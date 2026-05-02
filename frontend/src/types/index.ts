export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatar_color?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  role: 'admin' | 'member';
  member_count: number;
  task_count: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  project_id: string;
  created_by: string;
  assigned_to?: string;
  created_by_name?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_to_color?: string;
  created_at: string;
}

export interface DashboardStats {
  totalTasks: number;
  tasksByStatus: { todo: number; in_progress: number; done: number };
  tasksPerUser: Array<{ id: string; name: string; avatar_color: string; task_count: number }>;
  overdueTasks: Array<Task & { project_name: string }>;
  projects: Array<{ id: string; name: string; role: string; total_tasks: number; done_tasks: number }>;
  myPendingTasks: Array<Task & { project_name: string }>;
}
