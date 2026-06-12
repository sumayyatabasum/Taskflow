"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import api from "@/lib/api";
import { Subject, TopicStatus } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  BarChart2,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STATUS_CONFIG: Record<
  TopicStatus,
  { label: string; color: string; ring: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/20",
    ring: "bg-slate-600",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/20",
    ring: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    ring: "bg-emerald-500",
  },
  skipped: {
    label: "Skipped",
    color: "bg-slate-700/40 text-slate-600 border-slate-700/20",
    ring: "bg-slate-700",
  },
};

const STATUS_CYCLE: TopicStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
];

export default function SyllabusPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [manageMode, setManageMode] = useState(false);
  const [newTopicName, setNewTopicName] = useState<Record<string, string>>({});

  const load = () =>
    api.get("/topics").then((r) => {
      setSubjects(r.data);
      // expand first subject by default
      if (r.data.length > 0) setExpanded({ [r.data[0].id]: true });
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const cycleStatus = async (
    subjectId: string,
    topicId: string,
    current: TopicStatus,
  ) => {
    if (manageMode) return;
    const next =
      STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    await api.put(`/topics/${topicId}`, { status: next });
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t.id === topicId ? { ...t, status: next } : t,
              ),
            }
          : s,
      ),
    );
  };

  const addTopic = async (subjectId: string) => {
    const name = newTopicName[subjectId]?.trim();
    if (!name) return;
    const id = `${subjectId}-custom-${Date.now()}`;
    const res = await api.post("/topics", {
      id,
      subject_id: subjectId,
      topic_name: name,
    });
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: [...s.topics, res.data] } : s,
      ),
    );
    setNewTopicName((p) => ({ ...p, [subjectId]: "" }));
  };

  const deleteTopic = async (subjectId: string, topicId: string) => {
    await api.delete(`/topics/${topicId}`);
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
          : s,
      ),
    );
  };

  // chart data
  const chartData = subjects.map((s) => {
    const total = s.topics.length;
    const completed = s.topics.filter((t) => t.status === "completed").length;
    return {
      name: s.name.split(" ").slice(0, 2).join(" "), // short name
      completed,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);
  const doneTopics = subjects.reduce(
    (a, s) => a + s.topics.filter((t) => t.status === "completed").length,
    0,
  );
  const inProgressTopics = subjects.reduce(
    (a, s) => a + s.topics.filter((t) => t.status === "in_progress").length,
    0,
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Syllabus</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {doneTopics}/{totalTopics} topics completed · {inProgressTopics}{" "}
              in progress
            </p>
          </div>
          <button
            onClick={() => setManageMode((p) => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              manageMode
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
                : "text-slate-500 border-white/10 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            {manageMode ? "Done" : "Manage"}
          </button>
        </div>

        {/* Subject Completion Chart */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-white text-sm">
              Subject Completion
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={28} layout="vertical">
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
                formatter={(v: number, _n, props) => [
                  `${v}% (${props.payload.completed}/${props.payload.total})`,
                  "Progress",
                ]}
              />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={chartData[i].pct === 100 ? "#10b981" : "#6366f1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Accordion */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((s) => {
              const total = s.topics.length;
              const done = s.topics.filter(
                (t) => t.status === "completed",
              ).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isOpen = !!expanded[s.id];

              return (
                <div key={s.id} className="card overflow-hidden">
                  {/* Subject header */}
                  <button
                    onClick={() => toggleExpand(s.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[160px]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct === 100
                                  ? "#10b981"
                                  : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold ${pct === 100 ? "text-emerald-400" : "text-indigo-400"}`}
                    >
                      {pct}%
                    </span>
                  </button>

                  {/* Topics list */}
                  {isOpen && (
                    <div className="border-t border-white/[0.05] divide-y divide-white/[0.03]">
                      {s.topics.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 px-5 py-3 group hover:bg-white/[0.02] transition-colors"
                        >
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[t.status].ring}`}
                          />
                          <p
                            className={`flex-1 text-sm ${t.status === "completed" ? "line-through text-slate-600" : t.status === "skipped" ? "text-slate-600" : "text-slate-300"}`}
                          >
                            {t.topic_name}
                          </p>
                          {manageMode ? (
                            <button
                              onClick={() => deleteTopic(s.id, t.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => cycleStatus(s.id, t.id, t.status)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all hover:scale-105 ${STATUS_CONFIG[t.status].color}`}
                              title="Click to cycle status"
                            >
                              {STATUS_CONFIG[t.status].label}
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add topic row (manage mode) */}
                      {manageMode && (
                        <div className="flex items-center gap-2 px-5 py-3">
                          <input
                            value={newTopicName[s.id] || ""}
                            onChange={(e) =>
                              setNewTopicName((p) => ({
                                ...p,
                                [s.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && addTopic(s.id)
                            }
                            placeholder="Add topic..."
                            className="input text-xs py-1.5 flex-1"
                          />
                          <button
                            onClick={() => addTopic(s.id)}
                            className="btn-primary py-1.5 px-2.5 text-xs flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 px-1">
          <p className="text-xs text-slate-600">
            Click a status badge to cycle:
          </p>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <span
              key={k}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v.color}`}
            >
              {v.label}
            </span>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
