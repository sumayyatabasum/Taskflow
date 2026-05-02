'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Task, Member } from '@/types';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  members: Member[];
  initial?: Task | null;
  title: string;
}

export default function TaskForm({ open, onClose, onSubmit, members, initial, title }: TaskFormProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setTaskTitle(initial.title);
      setDescription(initial.description || '');
      setPriority(initial.priority);
      setDueDate(initial.due_date?.slice(0, 10) || '');
      setAssignedTo(initial.assigned_to || '');
      setStatus(initial.status);
    } else {
      setTaskTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignedTo('');
      setStatus('todo');
    }
    setError('');
  }, [initial, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        title: taskTitle,
        description,
        priority,
        dueDate: dueDate || undefined,
        assignedTo: assignedTo || undefined,
        status,
      } as any);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
          <input
            className="input"
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            placeholder="Task title"
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
            placeholder="Add more details…"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
            <select
              className="input"
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <select
              className="input"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign to</label>
            <select
              className="input"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving…' : initial ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
