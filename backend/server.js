#!/usr/bin/env node
/**
 * National Park Service Database — Express + node:sqlite Backend
 *
 * ✅ ZERO native compilation — uses Node.js 22+ built-in SQLite
 *    No better-sqlite3, no node-gyp, no C++ toolchain needed.
 *
 * Requires Node.js 22+ (you have 24 ✓)
 * Install:  npm install          (only installs express + cors)
 * Run:      node backend/server.js
 * URL:      http://localhost:3000
 */

// Suppress the experimental SQLite warning in console output
process.emitWarning = (() => {
  const orig = process.emitWarning.bind(process);
  return (msg, ...args) => {
    if (typeof msg === 'string' && msg.includes('SQLite')) return;
    orig(msg, ...args);
  };
})();

const { DatabaseSync } = require('node:sqlite');
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB_PATH    = path.join(__dirname, '..', 'nps.db');
const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
const seedPath   = path.join(__dirname, '..', 'sql', 'seed.sql');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode=WAL;');
db.exec('PRAGMA foreign_keys=ON;');
db.exec(fs.readFileSync(schemaPath, 'utf8'));

// Seed only if PERSON table is empty
const personCount = db.prepare('SELECT COUNT(*) as c FROM PERSON').get().c;
if (personCount === 0) {
  db.exec(fs.readFileSync(seedPath, 'utf8'));
  console.log('✓ Database seeded with sample data');
}
console.log('✓ Database ready:', DB_PATH);

// ─── node:sqlite returns null-prototype objects — normalize ──────────────────
const toObj = r => r ? Object.assign({}, r) : null;
const toArr = a => (a || []).map(toObj);

// Thin wrapper: auto-normalizes .get() and .all() results
function prep(sql) {
  const stmt = db.prepare(sql);
  return {
    get:  (...a) => toObj(stmt.get(...a)),
    all:  (...a) => toArr(stmt.all(...a)),
    run:  (...a) => stmt.run(...a),
  };
}

function apiError(res, msg, status = 400) {
  return res.status(status).json({ error: msg });
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  try {
    res.json({
      persons:     prep('SELECT COUNT(*) as c FROM PERSON').get().c,
      visitors:    prep('SELECT COUNT(*) as c FROM VISITOR').get().c,
      rangers:     prep('SELECT COUNT(*) as c FROM RANGER').get().c,
      researchers: prep('SELECT COUNT(*) as c FROM RESEARCHER').get().c,
      donors:      prep('SELECT COUNT(*) as c FROM DONOR').get().c,
      parks:       prep('SELECT COUNT(*) as c FROM NATIONAL_PARK').get().c,
      programs:    prep('SELECT COUNT(*) as c FROM PROGRAM').get().c,
      teams:       prep('SELECT COUNT(*) as c FROM RANGER_TEAM').get().c,
      projects:    prep('SELECT COUNT(*) as c FROM CONSERVATION_PROJECT').get().c,
      totalDonated:prep('SELECT COALESCE(SUM(AMOUNT),0) as s FROM DONATION').get().s,
      enrollments: prep('SELECT COUNT(*) as c FROM ENROLL').get().c,
      recentDonations: prep(`
        SELECT d.AMOUNT, d.DATE, d.CAMPAIGN_NAME,
               p.FIRST_NAME || ' ' || p.LAST_NAME AS donor_name, do.IS_ANONYMOUS
        FROM DONATION d
        JOIN DONOR do ON do.PERSON_ID = d.PERSON_ID
        JOIN PERSON p ON p.ID = d.PERSON_ID
        ORDER BY d.DATE DESC LIMIT 5`).all(),
      topParks: prep(`
        SELECT e.PARK_NAME, COUNT(*) as enrollments
        FROM ENROLL e GROUP BY e.PARK_NAME ORDER BY enrollments DESC LIMIT 5`).all(),
    });
  } catch (e) { apiError(res, e.message, 500); }
});

// ─── PERSONS ─────────────────────────────────────────────────────────────────
app.get('/api/persons', (req, res) => {
  try {
    res.json(prep(`
      SELECT p.*,
        CASE WHEN v.PERSON_ID  IS NOT NULL THEN 1 ELSE 0 END AS is_visitor,
        CASE WHEN r.PERSON_ID  IS NOT NULL THEN 1 ELSE 0 END AS is_ranger,
        CASE WHEN rs.PERSON_ID IS NOT NULL THEN 1 ELSE 0 END AS is_researcher,
        CASE WHEN d.PERSON_ID  IS NOT NULL THEN 1 ELSE 0 END AS is_donor
      FROM PERSON p
      LEFT JOIN VISITOR    v  ON v.PERSON_ID  = p.ID
      LEFT JOIN RANGER     r  ON r.PERSON_ID  = p.ID
      LEFT JOIN RESEARCHER rs ON rs.PERSON_ID = p.ID
      LEFT JOIN DONOR      d  ON d.PERSON_ID  = p.ID
      ORDER BY p.LAST_NAME, p.FIRST_NAME`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.get('/api/persons/:id', (req, res) => {
  try {
    const row = prep('SELECT * FROM PERSON WHERE ID=?').get(req.params.id);
    if (!row) return apiError(res, 'Person not found', 404);
    res.json(row);
  } catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/persons', (req, res) => {
  const { ID, FIRST_NAME, MIDDLE_INITIAL, LAST_NAME, DATE_OF_BIRTH, GENDER,
          STREET, CITY, STATE, POSTAL_CODE, PHONE_NUMBER, EMAIL_ADDRESS,
          NEWSLETTER_SUBSCRIBED = 0 } = req.body;
  if (!ID || !FIRST_NAME || !LAST_NAME || !DATE_OF_BIRTH || !STREET || !CITY || !STATE || !POSTAL_CODE)
    return apiError(res, 'Missing required fields');
  try {
    prep(`INSERT INTO PERSON
          (ID,FIRST_NAME,MIDDLE_INITIAL,LAST_NAME,DATE_OF_BIRTH,GENDER,STREET,CITY,STATE,
           POSTAL_CODE,PHONE_NUMBER,EMAIL_ADDRESS,NEWSLETTER_SUBSCRIBED)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(ID, FIRST_NAME, MIDDLE_INITIAL || null, LAST_NAME, DATE_OF_BIRTH,
           GENDER || null, STREET, CITY, STATE, POSTAL_CODE,
           PHONE_NUMBER || null, EMAIL_ADDRESS || null, NEWSLETTER_SUBSCRIBED ? 1 : 0);
    res.status(201).json({ message: 'Person created', id: ID });
  } catch (e) { apiError(res, e.message); }
});

app.delete('/api/persons/:id', (req, res) => {
  try {
    const info = prep('DELETE FROM PERSON WHERE ID=?').run(req.params.id);
    if (info.changes === 0) return apiError(res, 'Person not found', 404);
    res.json({ message: 'Person deleted' });
  } catch (e) { apiError(res, e.message); }
});

// ─── EMERGENCY CONTACTS ───────────────────────────────────────────────────────
app.get('/api/persons/:id/emergency-contacts', (req, res) => {
  try { res.json(prep('SELECT * FROM EMERGENCY_CONTACT WHERE PERSON_ID=?').all(req.params.id)); }
  catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/persons/:id/emergency-contacts', (req, res) => {
  const { NAME, RELATIONSHIP, PHONE_NUMBER } = req.body;
  if (!NAME || !RELATIONSHIP || !PHONE_NUMBER) return apiError(res, 'Missing fields');
  try {
    prep('INSERT INTO EMERGENCY_CONTACT VALUES (?,?,?,?)').run(req.params.id, NAME, RELATIONSHIP, PHONE_NUMBER);
    res.status(201).json({ message: 'Contact added' });
  } catch (e) { apiError(res, e.message); }
});

// ─── NATIONAL PARKS ───────────────────────────────────────────────────────────
app.get('/api/parks', (req, res) => {
  try {
    res.json(prep(`
      SELECT np.*,
        (SELECT COUNT(*) FROM PROGRAM WHERE PARK_NAME=np.NAME) AS program_count,
        (SELECT COUNT(*) FROM ENROLL  WHERE PARK_NAME=np.NAME) AS enrollment_count
      FROM NATIONAL_PARK np ORDER BY np.NAME`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/parks', (req, res) => {
  const { NAME, STREET, CITY, STATE, POSTAL_CODE, ESTABLISHMENT_DATE, VISITOR_CAPACITY } = req.body;
  if (!NAME || !STREET || !CITY || !STATE || !POSTAL_CODE || !ESTABLISHMENT_DATE)
    return apiError(res, 'Missing required fields');
  try {
    prep('INSERT INTO NATIONAL_PARK VALUES (?,?,?,?,?,?,?)').run(
      NAME, STREET, CITY, STATE, POSTAL_CODE, ESTABLISHMENT_DATE, VISITOR_CAPACITY || null);
    res.status(201).json({ message: 'Park created' });
  } catch (e) { apiError(res, e.message); }
});

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────
app.get('/api/programs', (req, res) => {
  const { park, after } = req.query;
  let sql = 'SELECT * FROM PROGRAM WHERE 1=1';
  const params = [];
  if (park)  { sql += ' AND PARK_NAME=?';  params.push(park); }
  if (after) { sql += ' AND START_DATE>?'; params.push(after); }
  sql += ' ORDER BY START_DATE';
  try { res.json(prep(sql).all(...params)); }
  catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/programs', (req, res) => {
  const { PARK_NAME, PROGRAM_NAME, TYPE, START_DATE, DURATION } = req.body;
  if (!PARK_NAME || !PROGRAM_NAME || !TYPE || !START_DATE || DURATION === undefined)
    return apiError(res, 'Missing required fields');
  try {
    prep('INSERT INTO PROGRAM VALUES (?,?,?,?,?)').run(PARK_NAME, PROGRAM_NAME, TYPE, START_DATE, Number(DURATION));
    res.status(201).json({ message: 'Program created' });
  } catch (e) { apiError(res, e.message); }
});

// ─── VISITORS ─────────────────────────────────────────────────────────────────
app.get('/api/visitors', (req, res) => {
  try {
    res.json(prep(`
      SELECT p.*, v.PERSON_ID AS visitor_id,
        (SELECT COUNT(*) FROM ENROLL WHERE PERSON_ID=p.ID) AS enrollment_count
      FROM VISITOR v JOIN PERSON p ON p.ID=v.PERSON_ID
      ORDER BY p.LAST_NAME, p.FIRST_NAME`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/visitors', (req, res) => {
  const { PERSON_ID } = req.body;
  if (!PERSON_ID) return apiError(res, 'PERSON_ID required');
  try {
    prep('INSERT OR IGNORE INTO VISITOR VALUES (?)').run(PERSON_ID);
    res.status(201).json({ message: 'Visitor role assigned' });
  } catch (e) { apiError(res, e.message); }
});

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
app.get('/api/enrollments', (req, res) => {
  const { park, program } = req.query;
  let sql = `
    SELECT p.ID, p.FIRST_NAME, p.LAST_NAME, e.PARK_NAME, e.PROGRAM_NAME, e.VISIT_DATE, e.ACCESSIBILITY
    FROM ENROLL e JOIN VISITOR v ON v.PERSON_ID=e.PERSON_ID JOIN PERSON p ON p.ID=v.PERSON_ID
    WHERE 1=1`;
  const params = [];
  if (park)    { sql += ' AND e.PARK_NAME=?';    params.push(park); }
  if (program) { sql += ' AND e.PROGRAM_NAME=?'; params.push(program); }
  sql += ' ORDER BY p.LAST_NAME, p.FIRST_NAME';
  try { res.json(prep(sql).all(...params)); }
  catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/enrollments', (req, res) => {
  const { PERSON_ID, PARK_NAME, PROGRAM_NAME, VISIT_DATE, ACCESSIBILITY } = req.body;
  if (!PERSON_ID || !PARK_NAME || !PROGRAM_NAME) return apiError(res, 'Missing required fields');
  try {
    prep('INSERT OR IGNORE INTO VISITOR VALUES (?)').run(PERSON_ID);
    prep('INSERT INTO ENROLL VALUES (?,?,?,?,?)').run(
      PERSON_ID, PARK_NAME, PROGRAM_NAME, VISIT_DATE || null, ACCESSIBILITY || null);
    res.status(201).json({ message: 'Enrollment created' });
  } catch (e) { apiError(res, e.message); }
});

// ─── RANGERS ──────────────────────────────────────────────────────────────────
app.get('/api/rangers', (req, res) => {
  try {
    res.json(prep(`
      SELECT p.ID, p.FIRST_NAME, p.LAST_NAME, p.EMAIL_ADDRESS, p.PHONE_NUMBER,
             r.START_DATE, r.STATUS, r.CERTIFICATIONS,
             CAST((julianday('now') - julianday(r.START_DATE)) / 365.25 AS INTEGER) AS years_of_service,
             GROUP_CONCAT(rt.TEAM_ID || '(' || CASE WHEN i.TEAM_LEADER=1 THEN 'Leader' ELSE 'Member' END || ')', ', ') AS teams
      FROM RANGER r
      JOIN PERSON p ON p.ID=r.PERSON_ID
      LEFT JOIN INCLUDES i ON i.PERSON_ID=r.PERSON_ID
      LEFT JOIN RANGER_TEAM rt ON rt.TEAM_ID=i.TEAM_ID
      GROUP BY r.PERSON_ID ORDER BY p.LAST_NAME, p.FIRST_NAME`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/rangers', (req, res) => {
  const { PERSON_ID, START_DATE, STATUS = 'active', CERTIFICATIONS, TEAM_ID, IS_LEADER = 0 } = req.body;
  if (!PERSON_ID) return apiError(res, 'PERSON_ID required');
  try {
    prep('INSERT OR IGNORE INTO RANGER (PERSON_ID,START_DATE,STATUS,CERTIFICATIONS) VALUES (?,?,?,?)')
      .run(PERSON_ID, START_DATE || new Date().toISOString().slice(0,10), STATUS, CERTIFICATIONS || null);
    if (TEAM_ID) prep('INSERT OR IGNORE INTO INCLUDES VALUES (?,?,?)').run(PERSON_ID, TEAM_ID, IS_LEADER ? 1 : 0);
    res.status(201).json({ message: 'Ranger created' });
  } catch (e) { apiError(res, e.message); }
});

// ─── RANGER TEAMS ─────────────────────────────────────────────────────────────
app.get('/api/teams', (req, res) => {
  try {
    res.json(prep(`
      SELECT rt.*,
        COUNT(DISTINCT i.PERSON_ID) AS member_count,
        COUNT(DISTINCT rto.PERSON_ID) AS researcher_count
      FROM RANGER_TEAM rt
      LEFT JOIN INCLUDES i ON i.TEAM_ID=rt.TEAM_ID
      LEFT JOIN REPORTS_TO rto ON rto.TEAM_ID=rt.TEAM_ID
      GROUP BY rt.TEAM_ID ORDER BY rt.TEAM_ID`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.get('/api/teams/:id/members', (req, res) => {
  try {
    res.json(prep(`
      SELECT r.PERSON_ID, p.FIRST_NAME, p.LAST_NAME, r.CERTIFICATIONS,
             CAST((julianday('now') - julianday(r.START_DATE)) / 365.25 AS INTEGER) AS years_of_service,
             CASE WHEN i.TEAM_LEADER=1 THEN 'Leader' ELSE 'Member' END AS role
      FROM INCLUDES i JOIN RANGER r ON r.PERSON_ID=i.PERSON_ID JOIN PERSON p ON p.ID=r.PERSON_ID
      WHERE i.TEAM_ID=?
      ORDER BY i.TEAM_LEADER DESC, p.LAST_NAME, p.FIRST_NAME`).all(req.params.id));
  } catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/teams', (req, res) => {
  const { TEAM_ID, FOCUS_AREA, FORMATION_DATE, LEADER_ID } = req.body;
  if (!TEAM_ID || !FOCUS_AREA) return apiError(res, 'Missing required fields');
  try {
    prep('INSERT INTO RANGER_TEAM VALUES (?,?,?)').run(
      TEAM_ID, FOCUS_AREA, FORMATION_DATE || new Date().toISOString().slice(0,10));
    if (LEADER_ID) prep('INSERT OR IGNORE INTO INCLUDES VALUES (?,?,1)').run(LEADER_ID, TEAM_ID);
    res.status(201).json({ message: 'Team created' });
  } catch (e) { apiError(res, e.message); }
});

// ─── RESEARCHERS ──────────────────────────────────────────────────────────────
app.get('/api/researchers', (req, res) => {
  try {
    res.json(prep(`
      SELECT p.ID, p.FIRST_NAME, p.LAST_NAME, p.EMAIL_ADDRESS,
             rs.RESEARCH_FIELD, rs.HIRE_DATE, rs.SALARY,
             COUNT(DISTINCT rto.TEAM_ID) AS teams_overseen
      FROM RESEARCHER rs
      JOIN PERSON p ON p.ID=rs.PERSON_ID
      LEFT JOIN REPORTS_TO rto ON rto.PERSON_ID=rs.PERSON_ID
      GROUP BY rs.PERSON_ID ORDER BY p.LAST_NAME, p.FIRST_NAME`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/researchers', (req, res) => {
  const { PERSON_ID, RESEARCH_FIELD, HIRE_DATE, SALARY } = req.body;
  if (!PERSON_ID || !RESEARCH_FIELD || !HIRE_DATE || SALARY === undefined)
    return apiError(res, 'Missing required fields');
  try {
    prep('INSERT OR REPLACE INTO RESEARCHER VALUES (?,?,?,?)').run(PERSON_ID, RESEARCH_FIELD, HIRE_DATE, Number(SALARY));
    res.status(201).json({ message: 'Researcher created' });
  } catch (e) { apiError(res, e.message); }
});

// ─── DONORS & DONATIONS ───────────────────────────────────────────────────────
app.get('/api/donors', (req, res) => {
  try {
    res.json(prep(`
      SELECT p.ID, p.FIRST_NAME, p.LAST_NAME, p.EMAIL_ADDRESS, d.IS_ANONYMOUS,
             COUNT(dn.DATE) AS donation_count,
             COALESCE(SUM(dn.AMOUNT),0) AS total_donated
      FROM DONOR d
      JOIN PERSON p ON p.ID=d.PERSON_ID
      LEFT JOIN DONATION dn ON dn.PERSON_ID=d.PERSON_ID
      GROUP BY d.PERSON_ID ORDER BY total_donated DESC`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

app.get('/api/donations', (req, res) => {
  const { month, anon_only } = req.query;
  let sql = `
    SELECT d.*, p.FIRST_NAME || ' ' || p.LAST_NAME as donor_name, do.IS_ANONYMOUS
    FROM DONATION d JOIN PERSON p ON p.ID=d.PERSON_ID JOIN DONOR do ON do.PERSON_ID=d.PERSON_ID
    WHERE 1=1`;
  const params = [];
  if (month) {
    sql += " AND d.DATE>=? AND d.DATE<date(?, '+1 month')";
    params.push(month + '-01', month + '-01');
  }
  if (anon_only === 'true') sql += ' AND do.IS_ANONYMOUS=1';
  sql += ' ORDER BY d.DATE DESC';
  try { res.json(prep(sql).all(...params)); }
  catch (e) { apiError(res, e.message, 500); }
});

app.post('/api/donations', (req, res) => {
  const { PERSON_ID, DATE, AMOUNT, CAMPAIGN_NAME, IS_ANONYMOUS = 0,
          PAYMENT_TYPE, LAST_FOUR_DIGITS, CARD_TYPE, EXPIRATION_DATE, CHECK_NUMBER } = req.body;
  if (!PERSON_ID || !DATE || !AMOUNT) return apiError(res, 'Missing required fields');
  try {
    prep('INSERT OR IGNORE INTO DONOR VALUES (?,?)').run(PERSON_ID, IS_ANONYMOUS ? 1 : 0);
    prep('INSERT INTO DONATION VALUES (?,?,?,?)').run(PERSON_ID, DATE, Number(AMOUNT), CAMPAIGN_NAME || null);
    if (PAYMENT_TYPE === 'card') {
      prep('INSERT INTO CREDIT_CARD_DONATION VALUES (?,?,?,?)').run(PERSON_ID, LAST_FOUR_DIGITS, CARD_TYPE, EXPIRATION_DATE);
    } else if (PAYMENT_TYPE === 'check') {
      prep('INSERT INTO CHECK_DONATION VALUES (?,?)').run(PERSON_ID, CHECK_NUMBER);
    }
    res.status(201).json({ message: 'Donation recorded' });
  } catch (e) { apiError(res, e.message); }
});

// ─── CONSERVATION PROJECTS ────────────────────────────────────────────────────
app.get('/api/projects', (req, res) => {
  try {
    res.json(prep(`
      SELECT cp.*, GROUP_CONCAT(h.NATIONAL_PARK_NAME, ', ') AS parks
      FROM CONSERVATION_PROJECT cp
      LEFT JOIN HOSTS h ON h.PROJECT_ID=cp.PROJECT_ID
      GROUP BY cp.PROJECT_ID ORDER BY cp.START_DATE DESC`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

// ─── BULK OPERATIONS ──────────────────────────────────────────────────────────
app.post('/api/operations/researcher-raises', (req, res) => {
  try {
    const info = prep(`
      UPDATE RESEARCHER SET SALARY = ROUND(SALARY * 1.03, 2)
      WHERE PERSON_ID IN (
        SELECT PERSON_ID FROM REPORTS_TO GROUP BY PERSON_ID HAVING COUNT(DISTINCT TEAM_ID) > 1
      )`).run();
    res.json({ message: '3% raise applied', updated: info.changes });
  } catch (e) { apiError(res, e.message, 500); }
});

app.delete('/api/operations/inactive-visitors', (req, res) => {
  try {
    const info = prep(`
      DELETE FROM VISITOR
      WHERE PERSON_ID NOT IN (SELECT PERSON_ID FROM ENROLL)
      AND PERSON_ID NOT IN (
        SELECT PERSON_ID FROM PARK_PASS WHERE EXPIRATION_DATE > date('now')
      )`).run();
    res.json({ message: 'Inactive visitors removed', deleted: info.changes });
  } catch (e) { apiError(res, e.message, 500); }
});

// ─── MAILING LIST ─────────────────────────────────────────────────────────────
app.get('/api/mailing-list', (req, res) => {
  try {
    res.json(prep(`
      SELECT FIRST_NAME, LAST_NAME, STREET, CITY, STATE, POSTAL_CODE, EMAIL_ADDRESS
      FROM PERSON WHERE NEWSLETTER_SUBSCRIBED=1 ORDER BY LAST_NAME, FIRST_NAME`).all());
  } catch (e) { apiError(res, e.message, 500); }
});

// ─── RAW SQL QUERY ────────────────────────────────────────────────────────────
app.post('/api/query', (req, res) => {
  const { sql } = req.body;
  if (!sql) return apiError(res, 'SQL required');
  const upper = sql.trim().toUpperCase();
  if (upper.startsWith('DROP') || upper.startsWith('TRUNCATE'))
    return apiError(res, 'DROP and TRUNCATE not allowed via this endpoint');
  try {
    if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
      res.json({ rows: toArr(db.prepare(sql).all()), type: 'SELECT' });
    } else {
      const info = db.prepare(sql).run();
      res.json({ changes: info.changes, lastInsertRowid: info.lastInsertRowid, type: 'WRITE' });
    }
  } catch (e) { apiError(res, e.message); }
});

// ─── Catch-all → frontend ────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌲 National Park Service DB → http://localhost:${PORT}\n`);
});
