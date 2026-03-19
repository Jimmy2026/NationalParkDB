# 🌲 National Park Service — Database Management System

> SQLite · Node.js · Express · Vanilla JS

A full-stack database management system for the National Park Service, featuring a modern web UI and a SQLite backend. Runs locally with zero configuration.

---

## 📸 Features

| Module                    | Description                                                                   |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Dashboard**             | Live stats, recent donations, top parks by enrollment                         |
| **Persons**               | Full person registry with role badges (visitor / ranger / researcher / donor) |
| **Visitors**              | Visitor roster with enrollment counts, add + enroll in one flow               |
| **Rangers**               | Ranger profiles, certifications, years of service, team assignments           |
| **Researchers**           | Research staff with salary and teams overseen                                 |
| **Donors**                | Donor directory with total giving history                                     |
| **National Parks**        | Card grid + table view, capacity, program count                               |
| **Programs**              | Filterable by park and start date                                             |
| **Enrollments**           | Visitor-program matrix with accessibility info                                |
| **Ranger Teams**          | Team cards with expandable member tables                                      |
| **Donations**             | Filter by month, toggle anonymous-only view                                   |
| **Conservation Projects** | Projects linked to parks with budgets                                         |
| **Mailing List**          | Newsletter subscribers + one-click CSV export                                 |
| **SQL Terminal**          | Live SQLite query editor with tabular results                                 |
| **Bulk Operations**       | Batch updates and cleanup utilities                                           |

---

## 🚀 Quick Start

### Prerequisites

* **Node.js** v18+ — https://nodejs.org

### Install & Run

```bash
git clone <your-repo-url>
cd national-park-service-db

npm install
npm start
```

Open http://localhost:3000

The database (`nps.db`) is created automatically on first run with schema + sample data.

---

## 🗄️ Database Design

The system models people, park operations, programs, teams, and donations with normalized relational tables and enforced constraints.

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

| Table                  | Description                            |
| ---------------------- | -------------------------------------- |
| `PERSON`               | Root entity — all people in the system |
| `EMERGENCY_CONTACT`    | Multiple contacts per person           |
| `VISITOR`              | Specialization of PERSON               |
| `RANGER`               | Specialization of PERSON               |
| `RESEARCHER`           | Specialization of PERSON               |
| `DONOR`                | Specialization of PERSON               |
| `DONATION`             | Donation records                       |
| `CREDIT_CARD_DONATION` | Card payment details                   |
| `CHECK_DONATION`       | Check payment details                  |
| `NATIONAL_PARK`        | Park locations and capacity            |
| `PROGRAM`              | Park programs                          |
| `ENROLL`               | Visitor–Program relationship           |
| `PARK_PASS`            | Passes owned by persons                |
| `HOLDS`                | Person–Pass relationship               |
| `CONSERVATION_PROJECT` | Environmental projects                 |
| `HOSTS`                | Park–Project relationship              |
| `RANGER_TEAM`          | Ranger team groups                     |
| `INCLUDES`             | Ranger–Team assignments                |
| `MENTORS`              | Ranger mentorship relationships        |
| `REPORTS_TO`           | Team–Researcher reporting              |

---

## 🗂️ Project Structure

```
national-park-service-db/
├── backend/
├── frontend/
├── sql/
├── package.json
└── README.md
```

---

## 🔌 API Reference

All endpoints live at `http://localhost:3000/api/`

| Method   | Endpoint                        | Description           |
| -------- | ------------------------------- | --------------------- |
| GET      | `/stats`                        | Dashboard aggregates  |
| GET/POST | `/persons`                      | List / create persons |
| GET/POST | `/visitors`                     | Visitor operations    |
| GET/POST | `/rangers`                      | Ranger operations     |
| GET/POST | `/researchers`                  | Researcher operations |
| GET      | `/donors`                       | Donor directory       |
| GET/POST | `/parks`                        | Parks                 |
| GET/POST | `/programs`                     | Programs              |
| GET/POST | `/enrollments`                  | Enrollments           |
| GET/POST | `/teams`                        | Ranger teams          |
| GET      | `/teams/:id/members`            | Team members          |
| GET/POST | `/donations`                    | Donations             |
| GET      | `/projects`                     | Projects              |
| GET      | `/mailing-list`                 | Subscribers           |
| POST     | `/query`                        | SQL execution         |
| POST     | `/operations/researcher-raises` | Batch update          |
| DELETE   | `/operations/inactive-visitors` | Cleanup               |

---

## 🛠️ Tech Stack

* Node.js + Express
* SQLite (better-sqlite3)
* Vanilla HTML/CSS/JS

---

## 👨‍💻 Author

AbdulMalik Shodunke
- Website: [abdulmaliksho.vercel.app](https://abdulmaliksho.vercel.app)
- GitHub: [@Jimmy2026](https://github.com/Jimmy2026)
