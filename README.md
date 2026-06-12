# GATE DA 2027 Preparation Tracker

> Converted from TaskFlow — a personal single-user GATE Data Science & AI preparation tracker.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS v3, Recharts
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Railway / Supabase)

## Modules

| Module        | Description                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Dashboard** | Quote of the day, countdown to 1 Feb 2027, progress rings, consistency trend, subject progress bars, quick notes |
| **To-Do**     | Daily study tasks with priority, deadline, status (pending/completed)                                            |
| **Syllabus**  | Full GATE DA 2027 syllabus with topic-level status tracking (pending / in_progress / completed / skipped)        |
| **Schedule**  | Date × Activity matrix — mark Theory / PYQ / Revision / Mock Test per day, monthly consistency charts            |

## Setup

### 1. Apply database schema

```bash
psql $DATABASE_URL -f backend/src/config/schema.sql
```

### 2. Seed syllabus

```bash
cd backend
npm install
node src/scripts/seedSyllabus.js
```

### 3. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and FRONTEND_URL
npm run dev
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What was removed from TaskFlow

- Projects, Teams, Members, Roles, Permissions
- Shared workspaces, project-level task CRUD
- Light mode / theme switcher
- Auth guard (single-user, no login required)

## What was added

- GATE DA 2027 syllabus with 47 topics across 7 subjects
- Daily schedule matrix (date × activity)
- Consistency tracking (daily / weekly / monthly)
- Study streak counter
- Quote of the day rotation
- Quick notes with auto-save
- Countdown to 1 Feb 2027
