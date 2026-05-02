'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { Project } from '@/types';
import { format, parseISO } from 'date-fns';
import { Plus, FolderKanban, Users, ListTodo, Crown, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = () => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/projects', { name, description });
      setShowCreate(false);
      setName('');
      setDescription('');
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    await api.delete(`/projects/${projectId}`);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-slate-400 mt-1">Manage your team projects</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">No projects yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create your first project to get started.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="card p-5 hover:border-slate-700 hover:bg-slate-900/80 transition-all group block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    {p.role === 'admin' && (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                    {p.role === 'admin' && (
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">{p.name}</h3>
                {p.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description}</p>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-slate-800 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {p.member_count} member{Number(p.member_count) !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-3.5 h-3.5" />
                    {p.task_count} task{Number(p.task_count) !== 1 ? 's' : ''}
                  </span>
                  <span className="ml-auto">{format(parseISO(p.created_at), 'MMM d')}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Project name *</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. TaskFlow Redesign"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              className="input resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1">
              {creating ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
