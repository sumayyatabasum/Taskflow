"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import api from "@/lib/api";
import { Todo } from "@/types";
import { Plus, Trash2, CheckCircle2, Circle, Calendar } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

const PRIORITY_COLORS = {
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  high: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Todo["priority"]>("medium");
  const [deadline, setDeadline] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const load = () =>
    api.get("/todos").then((r) => {
      setTodos(r.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const addTodo = async () => {
    if (!title.trim()) return;
    const res = await api.post("/todos", {
      title: title.trim(),
      priority,
      deadline: deadline || null,
    });
    setTodos((p) => [res.data, ...p]);
    setTitle("");
    setDeadline("");
    setPriority("medium");
  };

  const toggle = async (t: Todo) => {
    const next = t.status === "pending" ? "completed" : "pending";
    const res = await api.put(`/todos/${t.id}`, { status: next });
    setTodos((p) => p.map((x) => (x.id === t.id ? res.data : x)));
  };

  const remove = async (id: string) => {
    await api.delete(`/todos/${id}`);
    setTodos((p) => p.filter((x) => x.id !== id));
  };

  const filtered = todos.filter((t) =>
    filter === "all" ? true : t.status === filter,
  );
  const pending = todos.filter((t) => t.status === "pending").length;
  const completed = todos.filter((t) => t.status === "completed").length;

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">To-Do</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {pending} pending · {completed} completed
          </p>
        </div>

        {/* Add Task */}
        <div className="card p-5 mb-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a task..."
            className="input"
          />
          <div className="flex items-center gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Todo["priority"])}
              className="input w-auto text-sm"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input w-auto text-sm"
            />
            <button
              onClick={addTodo}
              className="btn-primary flex items-center gap-2 ml-auto"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-500 hover:text-slate-300 bg-white/5 border border-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm">
            No tasks here. Add one above!
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const isOverdue =
                t.deadline &&
                t.status === "pending" &&
                isPast(parseISO(t.deadline));
              return (
                <div
                  key={t.id}
                  className={`card px-4 py-3 flex items-center gap-3 group transition-opacity ${
                    t.status === "completed" ? "opacity-50" : ""
                  }`}
                >
                  <button
                    onClick={() => toggle(t)}
                    className="shrink-0 text-slate-600 hover:text-indigo-400 transition-colors"
                  >
                    {t.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${t.status === "completed" ? "line-through text-slate-500" : "text-slate-200"}`}
                    >
                      {t.title}
                    </p>
                    {t.deadline && (
                      <p
                        className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-slate-500"}`}
                      >
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(t.deadline), "MMM d, yyyy")}
                        {isOverdue && " · Overdue"}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${PRIORITY_COLORS[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                  <button
                    onClick={() => remove(t.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
