'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import Modal from '@/components/ui/Modal';
import { Avatar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Project, Task, Member } from '@/types';
import {
  Plus, Users, Crown, UserPlus, UserMinus,
  FolderKanban, ChevronLeft, Filter, Search
} from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  { key: 'todo', label: 'To Do', dot: 'bg-slate-500' },
  { key: 'in_progress', label: 'In Progress', dot: 'bg-amber-400' },
  { key: 'done', label: 'Done', dot: 'bg-emerald-500' },
] as const;

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');

  // UI state
  const [activeTab, setActiveTab] = useState<'board' | 'members'>('board');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);
      setProject(projRes.data.project);
      setMembers(projRes.data.members);
      setUserRole(projRes.data.project.user_role);
      setTasks(tasksRes.data.tasks);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assigned_to !== filterAssignee) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreateTask = async (data: any) => {
    const res = await api.post(`/projects/${projectId}/tasks`, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
    });
    setTasks(prev => [res.data.task, ...prev]);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const res = await api.patch(`/projects/${projectId}/tasks/${taskId}`, updates);
    setTasks(prev => prev.map(t => t.id === taskId ? res.data.task : t));
  };

  const handleEditTask = async (data: any) => {
    if (!editingTask) return;
    const res = await api.patch(`/projects/${projectId}/tasks/${editingTask.id}`, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
      status: data.status,
    });
    setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data.task : t));
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    setMemberError('');
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email: memberEmail, role: memberRole });
      setMembers(prev => [...prev, res.data.member]);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err: any) {
      setMemberError(err.response?.data?.error || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this project?`)) return;
    await api.delete(`/projects/${projectId}/members/${memberId}`);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!project) return null;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/projects" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 transition-colors w-fit">
            <ChevronLeft className="w-4 h-4" />
            Projects
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                {userRole === 'admin' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-slate-400 mt-1 text-sm">{project.description}</p>
              )}
            </div>
            {userRole === 'admin' && (
              <button onClick={() => setShowTaskForm(true)} className="btn-primary flex items-center gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 mb-6">
          {[
            { key: 'board', label: 'Task Board', icon: FolderKanban },
            { key: 'members', label: `Members (${members.length})`, icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Board Tab */}
        {activeTab === 'board' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="input pl-9 w-52 text-sm py-2"
                  placeholder="Search tasks…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="input w-36 text-sm py-2"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
              >
                <option value="">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                className="input w-44 text-sm py-2"
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
              >
                <option value="">All assignees</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {(filterPriority || filterAssignee || search) && (
                <button
                  onClick={() => { setFilterPriority(''); setFilterAssignee(''); setSearch(''); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COLUMNS.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.key);
                return (
                  <div key={col.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h3 className="text-sm font-semibold text-slate-300">{col.label}</h3>
                      <span className="ml-auto bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2 min-h-[120px]">
                      {colTasks.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-800 rounded-xl h-24 flex items-center justify-center">
                          <p className="text-slate-700 text-xs">No tasks</p>
                        </div>
                      ) : (
                        colTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            userRole={userRole}
                            currentUserId={user?.id || ''}
                            onUpdate={handleUpdateTask}
                            onEdit={(t) => { setEditingTask(t); }}
                            onDelete={handleDeleteTask}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="max-w-2xl">
            {userRole === 'admin' && (
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
            )}
            <div className="card divide-y divide-slate-800">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                  <Avatar name={m.name} color={m.avatar_color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{m.name}</span>
                      {m.id === user?.id && <span className="text-xs text-slate-500">(you)</span>}
                    </div>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      m.role === 'admin'
                        ? 'bg-amber-400/10 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {m.role === 'admin' && <Crown className="w-3 h-3" />}
                      {m.role}
                    </span>
                    {userRole === 'admin' && m.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Create Form */}
      <TaskForm
        open={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleCreateTask}
        members={members}
        title="Create Task"
      />

      {/* Task Edit Form */}
      <TaskForm
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditTask}
        members={members}
        initial={editingTask}
        title="Edit Task"
      />

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => { setShowAddMember(false); setMemberError(''); }} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          {memberError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{memberError}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
            <input
              type="email"
              className="input"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1.5">User must already have a TaskFlow account.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
            <select
              className="input"
              value={memberRole}
              onChange={e => setMemberRole(e.target.value as any)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addingMember} className="btn-primary flex-1">
              {addingMember ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
