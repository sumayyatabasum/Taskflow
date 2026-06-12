-- ============================================================
-- GATE DA 2027 Preparation Tracker - Database Schema
-- Run this to replace the old TaskFlow schema
-- ============================================================

-- Drop old tables (team/project features)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Keep users table as-is (auth remains)

-- ── Todos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  deadline DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Syllabus ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
  id VARCHAR(50) PRIMARY KEY,
  subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_name VARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

-- ── Schedule ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS schedule_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  activity_id UUID NOT NULL REFERENCES schedule_activities(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'not_completed')) DEFAULT 'not_completed',
  UNIQUE(date, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_records_date ON schedule_records(date);

-- ── Notes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed single notes row
INSERT INTO notes(id, content) VALUES (1, '') ON CONFLICT DO NOTHING;

-- ── Auto-update triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_topics_updated_at ON topics;
CREATE TRIGGER trg_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed default schedule activities ──────────────────────────────────────
INSERT INTO schedule_activities (id, activity_name, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Theory',    1),
  ('a0000000-0000-0000-0000-000000000002', 'PYQ',       2),
  ('a0000000-0000-0000-0000-000000000003', 'Revision',  3),
  ('a0000000-0000-0000-0000-000000000004', 'Mock Test', 4)
ON CONFLICT DO NOTHING;
