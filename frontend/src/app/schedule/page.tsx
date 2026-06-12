"use client";
import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import api from "@/lib/api";
import { ScheduleActivity, ScheduleRecord } from "@/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
} from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Settings,
  Check,
  X,
} from "lucide-react";

type CellStatus = "completed" | "not_completed" | null;

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [records, setRecords] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageMode, setManageMode] = useState(false);
  const [newActivity, setNewActivity] = useState("");

  const monthStr = format(currentMonth, "yyyy-MM");

  const load = (month: string) => {
    setLoading(true);
    api.get(`/schedule?month=${month}`).then((r) => {
      setActivities(r.data.activities);
      setRecords(r.data.records);
      setLoading(false);
    });
  };

  useEffect(() => {
    load(monthStr);
  }, [monthStr]);

  // All days in the current month
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Build a lookup: dateStr -> activityId -> status
  const lookup = useMemo(() => {
    const map: Record<string, Record<string, CellStatus>> = {};
    for (const r of records) {
      const dateStr =
        typeof r.date === "string"
          ? r.date.split("T")[0]
          : format(new Date(r.date), "yyyy-MM-dd");
      if (!map[dateStr]) map[dateStr] = {};
      map[dateStr][r.activity_id] = r.status as CellStatus;
    }
    return map;
  }, [records]);

  const getCell = (date: Date, activityId: string): CellStatus => {
    const dateStr = format(date, "yyyy-MM-dd");
    return lookup[dateStr]?.[activityId] ?? null;
  };

  const toggleCell = async (date: Date, activityId: string) => {
    if (manageMode) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const current = getCell(date, activityId);
    const next = current === "completed" ? "not_completed" : "completed";
    const res = await api.post("/schedule", {
      date: dateStr,
      activity_id: activityId,
      status: next,
    });
    setRecords((prev) => {
      const filtered = prev.filter(
        (r) =>
          !(r.activity_id === activityId && r.date.split("T")[0] === dateStr),
      );
      return [...filtered, res.data];
    });
  };

  const addActivity = async () => {
    if (!newActivity.trim()) return;
    const res = await api.post("/schedule/activities", {
      activity_name: newActivity.trim(),
    });
    setActivities((p) => [...p, res.data]);
    setNewActivity("");
  };

  const deleteActivity = async (id: string) => {
    await api.delete(`/schedule/activities/${id}`);
    setActivities((p) => p.filter((a) => a.id !== id));
    setRecords((p) => p.filter((r) => r.activity_id !== id));
  };

  // Consistency stats
  const totalCells = days.length * activities.length;
  const completedCells = records.filter((r) => r.status === "completed").length;
  const consistencyPct =
    totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

  // Per-activity bar chart data
  const activityChartData = activities.map((a) => {
    const done = records.filter(
      (r) => r.activity_id === a.id && r.status === "completed",
    ).length;
    return { name: a.activity_name, completed: done };
  });

  // Weekly trend (group by week)
  const weeklyTrend = useMemo(() => {
    const weeks: Record<string, { done: number; total: number }> = {};
    for (const day of days) {
      const weekLabel = `W${Math.ceil(day.getDate() / 7)}`;
      if (!weeks[weekLabel]) weeks[weekLabel] = { done: 0, total: 0 };
      weeks[weekLabel].total += activities.length;
      const dateStr = format(day, "yyyy-MM-dd");
      const dayDone = records.filter(
        (r) => r.date.split("T")[0] === dateStr && r.status === "completed",
      ).length;
      weeks[weekLabel].done += dayDone;
    }
    return Object.entries(weeks).map(([name, v]) => ({
      name,
      pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    }));
  }, [days, records, activities]);

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Schedule</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {format(currentMonth, "MMMM yyyy")} · {consistencyPct}%
              consistency
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="btn-secondary p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="btn-secondary px-3 py-2 text-xs"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="btn-secondary p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Weekly Consistency
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={weeklyTrend}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                  formatter={(v: number) => [`${v}%`, "Completion"]}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Activity Completion
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={activityChartData} barSize={24}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {activityChartData.map((_, i) => (
                    <Cell key={i} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add activity (manage mode) */}
        {manageMode && (
          <div className="card p-4 mb-4 flex items-center gap-3">
            <input
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addActivity()}
              placeholder="New activity name..."
              className="input text-sm flex-1"
            />
            <button
              onClick={addActivity}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        )}

        {/* Matrix */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="sticky left-0 bg-[#0d1117] px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider w-20">
                      Date
                    </th>
                    {activities.map((a) => (
                      <th
                        key={a.id}
                        className="px-3 py-3 text-center text-slate-400 font-semibold min-w-[80px]"
                      >
                        <div className="flex items-center justify-center gap-1">
                          {a.activity_name}
                          {manageMode && (
                            <button
                              onClick={() => deleteActivity(a.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {days.map((day) => {
                    const isCurrentDay = isToday(day);
                    return (
                      <tr
                        key={day.toISOString()}
                        className={`transition-colors hover:bg-white/[0.02] ${isCurrentDay ? "bg-indigo-500/5" : ""}`}
                      >
                        <td
                          className={`sticky left-0 px-4 py-2.5 font-medium ${isCurrentDay ? "bg-indigo-900/30 text-indigo-300" : "bg-[#0d1117] text-slate-400"}`}
                        >
                          <div>{format(day, "d")}</div>
                          <div className="text-[10px] text-slate-600">
                            {format(day, "EEE")}
                          </div>
                        </td>
                        {activities.map((a) => {
                          const status = getCell(day, a.id);
                          return (
                            <td key={a.id} className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => toggleCell(day, a.id)}
                                disabled={manageMode}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                  status === "completed"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                    : status === "not_completed"
                                      ? "bg-red-500/10 text-red-500/60 border border-red-500/20 hover:bg-red-500/20"
                                      : "bg-white/5 text-slate-700 border border-white/5 hover:bg-white/10 hover:text-slate-500"
                                }`}
                                title={
                                  status === "completed"
                                    ? "Completed"
                                    : status === "not_completed"
                                      ? "Not completed"
                                      : "Not marked"
                                }
                              >
                                {status === "completed" ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : status === "not_completed" ? (
                                  <X className="w-3.5 h-3.5" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-5 py-3 border-t border-white/[0.06] text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                Completed
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/10 border border-red-500/20" />
                Not Completed
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-white/5 border border-white/5" />
                Unmarked
              </div>
              <span className="ml-auto">Click cell to toggle</span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
