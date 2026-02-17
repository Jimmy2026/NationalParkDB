-- ============================================================
-- National Park Service Database - SQLite Schema
-- Converted from Azure SQL Server → SQLite (free, local)
-- Author: AbdulMalik Shodunke (polished)
-- ============================================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================================
-- PERSON: Root entity for all people in the system
-- ============================================================
CREATE TABLE IF NOT EXISTS PERSON (
  ID                   TEXT    NOT NULL PRIMARY KEY,
  FIRST_NAME           TEXT    NOT NULL,
  MIDDLE_INITIAL       TEXT    CHECK (MIDDLE_INITIAL IS NULL OR LENGTH(MIDDLE_INITIAL) = 1),
  LAST_NAME            TEXT    NOT NULL,
  DATE_OF_BIRTH        TEXT    NOT NULL,  -- ISO: YYYY-MM-DD
  GENDER               TEXT,
  STREET               TEXT    NOT NULL,
  CITY                 TEXT    NOT NULL,
  STATE                TEXT    NOT NULL,
  POSTAL_CODE          TEXT    NOT NULL,
  PHONE_NUMBER         TEXT,
  EMAIL_ADDRESS        TEXT,
  NEWSLETTER_SUBSCRIBED INTEGER NOT NULL DEFAULT 0 CHECK (NEWSLETTER_SUBSCRIBED IN (0,1))
  -- AGE is computed on-the-fly via SQL; no stored column needed (SQLite doesn't support computed cols in older versions)
);

-- ============================================================
-- EMERGENCY_CONTACT: One or more contacts per person
-- ============================================================
CREATE TABLE IF NOT EXISTS EMERGENCY_CONTACT (
  PERSON_ID    TEXT NOT NULL,
  NAME         TEXT NOT NULL,
  RELATIONSHIP TEXT NOT NULL,
  PHONE_NUMBER TEXT NOT NULL,
  PRIMARY KEY (PERSON_ID, PHONE_NUMBER),
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- VISITOR: People who visit parks
-- ============================================================
CREATE TABLE IF NOT EXISTS VISITOR (
  PERSON_ID TEXT NOT NULL PRIMARY KEY,
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- RANGER: Park rangers
-- ============================================================
CREATE TABLE IF NOT EXISTS RANGER (
  PERSON_ID      TEXT    NOT NULL PRIMARY KEY,
  START_DATE     TEXT    NOT NULL,
  STATUS         TEXT    NOT NULL DEFAULT 'active',
  CERTIFICATIONS TEXT,
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- RESEARCHER: Research staff
-- ============================================================
CREATE TABLE IF NOT EXISTS RESEARCHER (
  PERSON_ID      TEXT    NOT NULL PRIMARY KEY,
  RESEARCH_FIELD TEXT    NOT NULL,
  HIRE_DATE      TEXT    NOT NULL,
  SALARY         REAL    NOT NULL CHECK (SALARY >= 0),
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- DONOR: People who donate
-- ============================================================
CREATE TABLE IF NOT EXISTS DONOR (
  PERSON_ID    TEXT    NOT NULL PRIMARY KEY,
  IS_ANONYMOUS INTEGER NOT NULL DEFAULT 0 CHECK (IS_ANONYMOUS IN (0,1)),
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- DONATION: Individual donation records
-- PK prevents two donations on the same day for one donor
-- ============================================================
CREATE TABLE IF NOT EXISTS DONATION (
  PERSON_ID     TEXT NOT NULL,
  DATE          TEXT NOT NULL,
  AMOUNT        REAL NOT NULL CHECK (AMOUNT > 0),
  CAMPAIGN_NAME TEXT,
  PRIMARY KEY (PERSON_ID, DATE),
  FOREIGN KEY (PERSON_ID) REFERENCES DONOR(PERSON_ID) ON DELETE CASCADE
);

-- ============================================================
-- CREDIT_CARD_DONATION: Card payment details
-- ============================================================
CREATE TABLE IF NOT EXISTS CREDIT_CARD_DONATION (
  PERSON_ID        TEXT NOT NULL,
  LAST_FOUR_DIGITS TEXT NOT NULL CHECK (LENGTH(LAST_FOUR_DIGITS) = 4 AND LAST_FOUR_DIGITS GLOB '[0-9][0-9][0-9][0-9]'),
  CARD_TYPE        TEXT NOT NULL,
  EXPIRATION_DATE  TEXT NOT NULL,
  FOREIGN KEY (PERSON_ID) REFERENCES DONOR(PERSON_ID) ON DELETE CASCADE
);

-- ============================================================
-- CHECK_DONATION: Check payment details
-- ============================================================
CREATE TABLE IF NOT EXISTS CHECK_DONATION (
  PERSON_ID    TEXT NOT NULL,
  CHECK_NUMBER TEXT NOT NULL,
  FOREIGN KEY (PERSON_ID) REFERENCES DONOR(PERSON_ID) ON DELETE CASCADE
);

-- ============================================================
-- NATIONAL_PARK: Parks in the system
-- ============================================================
CREATE TABLE IF NOT EXISTS NATIONAL_PARK (
  NAME               TEXT    NOT NULL PRIMARY KEY,
  STREET             TEXT    NOT NULL,
  CITY               TEXT    NOT NULL,
  STATE              TEXT    NOT NULL,
  POSTAL_CODE        TEXT    NOT NULL,
  ESTABLISHMENT_DATE TEXT    NOT NULL,
  VISITOR_CAPACITY   INTEGER CHECK (VISITOR_CAPACITY IS NULL OR VISITOR_CAPACITY >= 0)
);

-- ============================================================
-- PROGRAM: Programs offered at parks
-- ============================================================
CREATE TABLE IF NOT EXISTS PROGRAM (
  PARK_NAME    TEXT    NOT NULL,
  PROGRAM_NAME TEXT    NOT NULL,
  TYPE         TEXT    NOT NULL,
  START_DATE   TEXT    NOT NULL,
  DURATION     INTEGER NOT NULL CHECK (DURATION >= 0),
  PRIMARY KEY (PARK_NAME, PROGRAM_NAME),
  FOREIGN KEY (PARK_NAME) REFERENCES NATIONAL_PARK(NAME) ON DELETE CASCADE
);

-- ============================================================
-- ENROLL: Visitor enrollment in programs
-- ============================================================
CREATE TABLE IF NOT EXISTS ENROLL (
  PERSON_ID    TEXT NOT NULL,
  PARK_NAME    TEXT NOT NULL,
  PROGRAM_NAME TEXT NOT NULL,
  VISIT_DATE   TEXT,
  ACCESSIBILITY TEXT,
  PRIMARY KEY (PERSON_ID, PARK_NAME, PROGRAM_NAME),
  FOREIGN KEY (PERSON_ID) REFERENCES VISITOR(PERSON_ID) ON DELETE CASCADE,
  FOREIGN KEY (PARK_NAME, PROGRAM_NAME) REFERENCES PROGRAM(PARK_NAME, PROGRAM_NAME) ON DELETE CASCADE
);

-- ============================================================
-- PARK_PASS: Passes owned by people
-- ============================================================
CREATE TABLE IF NOT EXISTS PARK_PASS (
  PASS_ID         TEXT NOT NULL PRIMARY KEY,
  PERSON_ID       TEXT NOT NULL,
  TYPE            TEXT NOT NULL,
  EXPIRATION_DATE TEXT NOT NULL,
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- HOLDS: Many-to-many: passes held by people
-- ============================================================
CREATE TABLE IF NOT EXISTS HOLDS (
  PASS_ID   TEXT NOT NULL,
  PERSON_ID TEXT NOT NULL,
  PRIMARY KEY (PASS_ID, PERSON_ID),
  FOREIGN KEY (PASS_ID) REFERENCES PARK_PASS(PASS_ID) ON DELETE CASCADE,
  FOREIGN KEY (PERSON_ID) REFERENCES PERSON(ID) ON DELETE CASCADE
);

-- ============================================================
-- CONSERVATION_PROJECT: Environmental projects
-- ============================================================
CREATE TABLE IF NOT EXISTS CONSERVATION_PROJECT (
  PROJECT_ID TEXT NOT NULL PRIMARY KEY,
  NAME       TEXT NOT NULL,
  START_DATE TEXT NOT NULL,
  BUDGET     REAL NOT NULL CHECK (BUDGET >= 0)
);

-- ============================================================
-- HOSTS: Park–project relationship
-- ============================================================
CREATE TABLE IF NOT EXISTS HOSTS (
  PROJECT_ID          TEXT NOT NULL,
  NATIONAL_PARK_NAME  TEXT NOT NULL,
  PRIMARY KEY (PROJECT_ID, NATIONAL_PARK_NAME),
  FOREIGN KEY (PROJECT_ID) REFERENCES CONSERVATION_PROJECT(PROJECT_ID) ON DELETE CASCADE,
  FOREIGN KEY (NATIONAL_PARK_NAME) REFERENCES NATIONAL_PARK(NAME) ON DELETE CASCADE
);

-- ============================================================
-- RANGER_TEAM: Teams of rangers
-- ============================================================
CREATE TABLE IF NOT EXISTS RANGER_TEAM (
  TEAM_ID        TEXT NOT NULL PRIMARY KEY,
  FOCUS_AREA     TEXT NOT NULL,
  FORMATION_DATE TEXT NOT NULL
);

-- ============================================================
-- INCLUDES: Rangers assigned to teams
-- ============================================================
CREATE TABLE IF NOT EXISTS INCLUDES (
  PERSON_ID   TEXT    NOT NULL,
  TEAM_ID     TEXT    NOT NULL,
  TEAM_LEADER INTEGER NOT NULL DEFAULT 0 CHECK (TEAM_LEADER IN (0,1)),
  PRIMARY KEY (PERSON_ID, TEAM_ID),
  FOREIGN KEY (PERSON_ID) REFERENCES RANGER(PERSON_ID) ON DELETE CASCADE,
  FOREIGN KEY (TEAM_ID) REFERENCES RANGER_TEAM(TEAM_ID) ON DELETE CASCADE
);

-- ============================================================
-- MENTORS: Ranger mentorship relationships
-- Each ranger can mentor at most one other ranger
-- ============================================================
CREATE TABLE IF NOT EXISTS MENTORS (
  MENTOR_ID  TEXT NOT NULL,
  MENTEE_ID  TEXT NOT NULL,
  START_DATE TEXT NOT NULL,
  PRIMARY KEY (MENTOR_ID, MENTEE_ID),
  UNIQUE (MENTOR_ID),  -- at most one mentee per mentor
  UNIQUE (MENTEE_ID),  -- at most one mentor per mentee
  FOREIGN KEY (MENTOR_ID) REFERENCES RANGER(PERSON_ID) ON DELETE CASCADE,
  FOREIGN KEY (MENTEE_ID) REFERENCES RANGER(PERSON_ID) ON DELETE CASCADE
);

-- ============================================================
-- REPORTS_TO: Team reports to researcher on a date
-- ============================================================
CREATE TABLE IF NOT EXISTS REPORTS_TO (
  TEAM_ID     TEXT NOT NULL,
  PERSON_ID   TEXT NOT NULL,
  DATE        TEXT NOT NULL,
  DESCRIPTION TEXT,
  PRIMARY KEY (TEAM_ID, PERSON_ID, DATE),
  FOREIGN KEY (TEAM_ID) REFERENCES RANGER_TEAM(TEAM_ID) ON DELETE CASCADE,
  FOREIGN KEY (PERSON_ID) REFERENCES RESEARCHER(PERSON_ID) ON DELETE CASCADE
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_person_name ON PERSON (LAST_NAME, FIRST_NAME);
CREATE INDEX IF NOT EXISTS idx_donation_date ON DONATION (DATE);
CREATE INDEX IF NOT EXISTS idx_enroll_park ON ENROLL (PARK_NAME, PROGRAM_NAME);
CREATE INDEX IF NOT EXISTS idx_includes_team ON INCLUDES (TEAM_ID);
CREATE INDEX IF NOT EXISTS idx_reports_team ON REPORTS_TO (TEAM_ID);
CREATE INDEX IF NOT EXISTS idx_park_pass_person ON PARK_PASS (PERSON_ID, EXPIRATION_DATE);
