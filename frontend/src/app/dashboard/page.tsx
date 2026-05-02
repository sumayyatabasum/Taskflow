'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Avatar } from '@/components/Sidebar';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { format, isPast, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  CheckCircle2, Clock, AlertTriangle, ListTodo,
  TrendingUp, Users, FolderKanban, Calendar
} from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  todo: '#64748b',
  in_progress: '#f59e0b',
  done: '#10b981',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-red-400',
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!stats) return null;

  const statusChartData = Object.entries(stats.tasksByStatus).map(([key, val]) => ({
    name: STATUS_LABELS[key], value: val, color: STATUS_COLORS[key],
  }));

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.tasksByStatus.done / stats.totalTasks) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening across your projects.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={ListTodo} label="Total Tasks" value={stats.totalTasks} color="bg-indigo-500/20 text-indigo-400" />
          <StatCard icon={Clock} label="In Progress" value={stats.tasksByStatus.in_progress} color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.tasksByStatus.done} sub={`${completionRate}% completion rate`} color="bg-emerald-500/20 text-emerald-400" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdueTasks.length} color="bg-red-500/20 text-red-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Task Status Chart */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-white">Tasks by Status</h2>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusChartData} barSize={40}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Projects Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-white">Projects</h2>
            </div>
            {stats.projects.length === 0 ? (
              <p className="text-slate-500 text-sm">No projects yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.projects.slice(0, 5).map(p => {
                  const pct = p.total_tasks > 0 ? Math.round((Number(p.done_tasks) / Number(p.total_tasks)) * 100) : 0;
                  return (
                    <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors truncate max-w-[140px]">{p.name}</span>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks per User */}
          {stats.tasksPerUser.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-indigo-400" />
                <h2 className="font-semibold text-white">Tasks per Team Member</h2>
              </div>
              <div className="space-y-3">
                {stats.tasksPerUser.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} color={u.avatar_color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300 truncate">{u.name}</span>
                        <span className="text-xs text-slate-400">{u.task_count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${Math.min(100, (Number(u.task_count) / Math.max(...stats.tasksPerUser.map(x => Number(x.task_count)))) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Tasks */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-red-400" />
              <h2 className="font-semibold text-white">Overdue Tasks</h2>
              {stats.overdueTasks.length > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                  {stats.overdueTasks.length}
                </span>
              )}
            </div>
            {stats.overdueTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-slate-400 text-sm">No overdue tasks!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.overdueTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.project_name} · Due {t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}
                      </p>
                    </div>
                    <span className={`ml-auto shrink-0 text-xs capitalize ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Pending Tasks */}
        {stats.myPendingTasks.length > 0 && (
          <div className="card p-5 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-white">My Pending Tasks</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {stats.myPendingTasks.map(t => (
                <div key={t.id} className="flex items-center gap-4 py-3">
                  <span className={`badge-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                  <span className="text-sm text-slate-200 flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-slate-500">{t.project_name}</span>
                  {t.due_date && (
                    <span className={`text-xs ${isPast(parseISO(t.due_date)) ? 'text-red-400' : 'text-slate-500'}`}>
                      {format(parseISO(t.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
