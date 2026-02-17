# 🌲 National Park Service — Database Management System

> **CS4513 DBMS Individual Project** | SQLite · Node.js · Express · Vanilla JS

A full-stack database management system for the National Park Service, featuring a modern web UI and a polished SQLite backend. Originally built with Azure SQL Server, now fully free and runs locally with zero configuration.

---

## 📸 Features

| Module | Description |
|---|---|
| **Dashboard** | Live stats, recent donations, top parks by enrollment |
| **Persons** | Full person registry with role badges (visitor / ranger / researcher / donor) |
| **Visitors** | Visitor roster with enrollment counts, add + enroll in one flow |
| **Rangers** | Ranger profiles, certifications, years of service, team assignments |
| **Researchers** | Research staff with salary and teams overseen |
| **Donors** | Donor directory with total giving history |
| **National Parks** | Card grid + table view, capacity, program count |
| **Programs** | Filterable by park and start date |
| **Enrollments** | Visitor-program matrix with accessibility info |
| **Ranger Teams** | Team cards with expandable member tables |
| **Donations** | Filter by month, toggle anonymous-only view |
| **Conservation Projects** | Projects linked to parks with budgets |
| **Mailing List** | Newsletter subscribers + one-click CSV export |
| **SQL Terminal** | Live SQLite query editor with tabular results |
| **Bulk Operations** | 3% raise for active researchers, clean inactive visitors |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)

### Install & Run

```bash
# 1. Clone / download the project
git clone <your-repo-url>
cd national-park-service-db

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
open http://localhost:3000
```

The database (`nps.db`) is created automatically on first run with schema + sample data.

---

## 🗄️ Database Design

### Why SQLite instead of Azure SQL?

| | Azure SQL (original) | SQLite (this project) |
|---|---|---|
| Cost | Free trial (expires) | **Free forever** |
| Setup | Azure account required | Zero config, file-based |
| Local dev | Requires internet | Works offline |
| GitHub demo | Credentials expire | Just commit `nps.db` |

The schema is 100% faithful to the original — all tables, constraints, indexes, and relationships preserved. The only changes are SQLite-compatible syntax (e.g., `GETDATE()` → `date('now')`, computed columns removed in favor of `AS` expressions in queries).

### Entity–Relationship Overview

```
PERSON ──┬── VISITOR ──── ENROLL ──── PROGRAM ──── NATIONAL_PARK
         ├── RANGER ──┬── INCLUDES ── RANGER_TEAM ── REPORTS_TO ── RESEARCHER
         │            └── MENTORS
         ├── RESEARCHER ─ REPORTS_TO
         └── DONOR ──── DONATION ──┬── CREDIT_CARD_DONATION
                                   └── CHECK_DONATION

NATIONAL_PARK ── HOSTS ── CONSERVATION_PROJECT
PERSON ── PARK_PASS ── HOLDS
EMERGENCY_CONTACT → PERSON
```

### Tables (17 total)

| Table | Description |
|---|---|
| `PERSON` | Root entity — all people in the system |
| `EMERGENCY_CONTACT` | Multiple contacts per person |
| `VISITOR` | Specialization of PERSON |
| `RANGER` | Specialization of PERSON (w/ computed years_of_service) |
| `RESEARCHER` | Specialization of PERSON |
| `DONOR` | Specialization of PERSON |
| `DONATION` | Donation records (PK: person + date) |
| `CREDIT_CARD_DONATION` | Card payment details |
| `CHECK_DONATION` | Check payment details |
| `NATIONAL_PARK` | Park locations and capacity |
| `PROGRAM` | Park educational/recreational programs |
| `ENROLL` | Visitor–Program M:N with accessibility |
| `PARK_PASS` | Passes owned by persons |
| `HOLDS` | Person–Pass M:N relationship |
| `CONSERVATION_PROJECT` | Environmental projects |
| `HOSTS` | Park–Project M:N |
| `RANGER_TEAM` | Ranger team groups |
| `INCLUDES` | Ranger–Team M:N with leader flag |
| `MENTORS` | Ranger mentorship (1:1 each direction) |
| `REPORTS_TO` | Team–Researcher with date + description |

---

## 🗂️ Project Structure

```
national-park-service-db/
├── backend/
│   └── server.js          # Express API + SQLite integration
├── frontend/
│   └── index.html         # Single-file modern web UI
├── sql/
│   ├── schema.sql          # SQLite schema (all 17 tables + indexes)
│   └── seed.sql            # Sample data for demo
├── package.json
└── README.md
```

---

## 🔌 API Reference

All endpoints live at `http://localhost:3000/api/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Dashboard aggregates |
| GET/POST | `/persons` | List / create persons |
| GET/POST | `/visitors` | List / assign visitor role |
| GET/POST | `/rangers` | List / create rangers |
| GET/POST | `/researchers` | List / create researchers |
| GET | `/donors` | Donor directory |
| GET/POST | `/parks` | Parks list / create |
| GET/POST | `/programs` | Programs (filterable by park + date) |
| GET/POST | `/enrollments` | Enrollments (filterable) |
| GET/POST | `/teams` | Ranger teams |
| GET | `/teams/:id/members` | Team roster with roles |
| GET/POST | `/donations` | Donations (filterable by month/anon) |
| GET | `/projects` | Conservation projects |
| GET | `/mailing-list` | Newsletter subscribers |
| POST | `/query` | Raw SQL execution |
| POST | `/operations/researcher-raises` | 3% raise (Q14) |
| DELETE | `/operations/inactive-visitors` | Clean inactive visitors (Q15) |

---

## 📋 SQL Queries Implemented (from original project)

| # | Description |
|---|---|
| Q1 | Add visitor + enroll in program |
| Q2 | Add ranger + assign to team |
| Q3 | Add team + set leader |
| Q4 | Add donation (card / check) |
| Q5 | Add researcher + associate teams |
| Q6 | Add team report to researcher |
| Q7 | Add park program |
| Q8 | List emergency contacts for a person |
| Q9 | List visitors in a program (with accessibility) |
| Q10 | Programs for a park after a given date |
| Q11 | Monthly totals & averages for anonymous donors |
| Q12 | Rangers in a team (with roles + years of service) |
| Q13 | All people + mailing info |
| Q14 | 3% raise for researchers overseeing >1 team |
| Q15 | Delete inactive visitors (no enrollments + no valid pass) |
| Q16 | Import teams from CSV (via SQL Terminal) |
| Q17 | Export mailing list to CSV |

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express 4 + better-sqlite3
- **Database**: SQLite 3 (via better-sqlite3, no separate server needed)
- **Frontend**: Vanilla HTML/CSS/JS (no framework dependencies)
- **Fonts**: DM Serif Display + Outfit + JetBrains Mono (Google Fonts)
- **Cost**: $0.00 — entirely free to run locally

---

## 📝 Original Project Notes

The original implementation used **Azure SQL Server** with a Java JDBC console application. This version:

1. Migrates the database to **SQLite** (free, file-based, zero config)
2. Replaces the Java CLI with a **modern web UI**
3. Adds a **REST API layer** for clean separation of concerns
4. Preserves **all original queries** (Q1–Q17) in the API
5. Adds **sample seed data** so the app is immediately usable

---

*National Park Service DBMS — CS4513 Fall 2025 Individual Project*
