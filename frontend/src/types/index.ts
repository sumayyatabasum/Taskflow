// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatar_color?: string;
}

// ── Todos ─────────────────────────────────────────────────────────────────────
export interface Todo {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  deadline?: string | null;
  status: "pending" | "completed";
  created_at: string;
}

// ── Syllabus ──────────────────────────────────────────────────────────────────
export type TopicStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface Topic {
  id: string;
  subject_id: string;
  topic_name: string;
  status: TopicStatus;
  updated_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  sort_order: number;
  topics: Topic[];
}

// ── Schedule ──────────────────────────────────────────────────────────────────
export interface ScheduleActivity {
  id: string;
  activity_name: string;
  sort_order: number;
}

export interface ScheduleRecord {
  id: string;
  date: string; // ISO date string "YYYY-MM-DD"
  activity_id: string;
  status: "completed" | "not_completed";
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface SubjectProgress {
  id: string;
  name: string;
  total: number;
  completed: number;
}

export interface ConsistencyTrendPoint {
  date: string;
  pct: number;
}

export interface DashboardStats {
  todos: { total: number; completed: number; pending: number };
  topics: {
    total: number;
    completed: number;
    inProgress: number;
    skipped: number;
  };
  subjectProgress: SubjectProgress[];
  consistency: { last30Days: number; weekly: number; monthly: number };
  streak: number;
  dailyCompleted: number;
  consistencyTrend: ConsistencyTrendPoint[];
}
