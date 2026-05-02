'use client';
import { Task } from '@/types';
import { Avatar } from '@/components/Sidebar';
import { format, isPast, parseISO, isToday } from 'date-fns';
import { Calendar, Pencil, Trash2, ArrowRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'] as const;

interface TaskCardProps {
  task: Task;
  userRole: 'admin' | 'member';
  currentUserId: string;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ task, userRole, currentUserId, onUpdate, onEdit, onDelete }: TaskCardProps) {
  const isAdmin = userRole === 'admin';
  const isAssignee = task.assigned_to === currentUserId;
  const canEdit = isAdmin;
  const canUpdateStatus = isAdmin || isAssignee;

  const nextStatus = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(task.status) + 1) % STATUS_OPTIONS.length];
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  return (
    <div className={`card p-4 group transition-all hover:border-slate-700 ${task.status === 'done' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
          task.status === 'done' ? 'bg-emerald-500' :
          task.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-600'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium text-white leading-snug ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
              {task.title}
            </h4>
            {(canEdit || canUpdateStatus) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {canUpdateStatus && task.status !== 'done' && (
                  <button
                    onClick={() => onUpdate(task.id, { status: nextStatus })}
                    className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                    title={`Move to ${STATUS_LABELS[nextStatus]}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {canEdit && (
                  <>
                    <button onClick={() => onEdit(task)} className="text-slate-500 hover:text-white p-1 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-red-400 p-1 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`badge-${task.priority}`}>{task.priority}</span>
            <span className={`badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>

            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs ${
                isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-slate-500'
              }`}>
                <Calendar className="w-3 h-3" />
                {format(parseISO(task.due_date), 'MMM d')}
                {isOverdue && ' · Overdue'}
                {isDueToday && ' · Today'}
              </span>
            )}

            {task.assigned_to_name && (
              <div className="ml-auto flex items-center gap-1.5">
                <Avatar name={task.assigned_to_name} color={task.assigned_to_color} size="sm" />
                <span className="text-xs text-slate-500 max-w-[80px] truncate">{task.assigned_to_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
