"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import api from "@/lib/api";
import { DashboardStats } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  StickyNote,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Quote of the Day ─────────────────────────────────────────────────────────
function QuoteCard() {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(
    null,
  );

  useEffect(() => {
    fetch("/data/quotes.json")
      .then((r) => r.json())
      .then((quotes: { text: string; author: string }[]) => {
        const idx = Math.floor(new Date().getDate() % quotes.length);
        setQuote(quotes[idx]);
      });
  }, []);

  if (!quote) return null;
  return (
    <div className="card p-5 col-span-full flex items-start gap-4">
      <div className="text-3xl text-indigo-400/60 font-serif leading-none mt-1">
        "
      </div>
      <div>
        <p className="text-slate-200 text-sm leading-relaxed italic">
          {quote.text}
        </p>
        <p className="text-slate-500 text-xs mt-1">— {quote.author}</p>
      </div>
    </div>
  );
}

// ── Countdown ────────────────────────────────────────────────────────────────
function CountdownCard() {
  const gateDate = new Date("2027-02-01");
  const now = new Date();
  const diffMs = gateDate.getTime() - now.getTime();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  return (
    <div className="card p-5 flex flex-col gap-1">
      <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
        GATE DA 2027
      </p>
      <p className="text-4xl font-extrabold text-white">{days}</p>
      <p className="text-slate-500 text-xs">
        days left · ~{weeks} weeks · ~{months} months
      </p>
      <p className="text-slate-600 text-[11px] mt-1">1 Feb 2027</p>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
            {label}
          </p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const data = [{ name: label, value: pct, fill: "#6366f1" }];
  return (
    <div className="card p-5 flex flex-col items-center justify-center gap-1">
      <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
        {label}
      </p>
      <div className="relative w-32 h-32">
        <RadialBarChart
          width={128}
          height={128}
          cx={64}
          cy={64}
          innerRadius={46}
          outerRadius={60}
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={14}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{ fill: "#1e293b" }}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Subject Progress ───────────────────────────────────────────────────────────
function SubjectProgressCard({
  subjects,
}: {
  subjects: { id: string; name: string; total: number; completed: number }[];
}) {
  return (
    <div className="card p-5 col-span-full lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <h2 className="font-semibold text-white text-sm">Syllabus Progress</h2>
      </div>
      <div className="space-y-3">
        {subjects.map((s) => {
          const pct =
            Number(s.total) > 0
              ? Math.round((Number(s.completed) / Number(s.total)) * 100)
              : 0;
          return (
            <div key={s.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 truncate max-w-[60%]">
                  {s.name}
                </span>
                <span className="text-xs text-slate-500">
                  {s.completed}/{s.total} · {pct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct === 100
                        ? "#10b981"
                        : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Notes Widget ──────────────────────────────────────────────────────────────
function NotesWidget() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/notes").then((r) => setContent(r.data.content || ""));
  }, []);

  useEffect(() => {
    if (!content && content !== "") return;
    const t = setTimeout(async () => {
      setSaving(true);
      await api.put("/notes", { content });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
    return () => clearTimeout(t);
  }, [content]);

  return (
    <div className="card p-5 col-span-full lg:col-span-1">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-indigo-400" />
        <h2 className="font-semibold text-white text-sm">Quick Notes</h2>
        {saving && (
          <RefreshCw className="w-3 h-3 text-slate-500 animate-spin ml-auto" />
        )}
        {saved && (
          <span className="text-[10px] text-emerald-400 ml-auto">Saved</span>
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Jot down thoughts, formulas, reminders..."
        className="w-full h-36 bg-transparent text-slate-300 placeholder-slate-600 text-sm resize-none focus:outline-none leading-relaxed"
      />
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{greeting()} 👋</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Your GATE DA 2027 preparation at a glance.
          </p>
        </div>

        {loading || !stats ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quote + Countdown */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <QuoteCard />
              <CountdownCard />
              <StatCard
                icon={Flame}
                label="Study Streak"
                value={`${stats.streak}d`}
                sub="consecutive days"
                color="bg-orange-500/20 text-orange-400"
              />
              <StatCard
                icon={Target}
                label="Topics Done"
                value={`${stats.topics.completed}/${stats.topics.total}`}
                sub={`${stats.topics.inProgress} in progress`}
                color="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                icon={CheckCircle2}
                label="Todos Done"
                value={`${stats.todos.completed}/${stats.todos.total}`}
                sub={`${stats.todos.pending} pending`}
                color="bg-indigo-500/20 text-indigo-400"
              />
            </div>

            {/* Progress Rings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ProgressRing
                pct={
                  stats.topics.total > 0
                    ? Math.round(
                        (stats.topics.completed / stats.topics.total) * 100,
                      )
                    : 0
                }
                label="Syllabus Complete"
              />
              <ProgressRing
                pct={stats.consistency.weekly}
                label="Weekly Consistency"
              />
              <ProgressRing
                pct={stats.consistency.monthly}
                label="Monthly Consistency"
              />
            </div>

            {/* Subject Progress + Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SubjectProgressCard subjects={stats.subjectProgress} />
              <NotesWidget />
            </div>

            {/* Consistency Trend */}
            {stats.consistencyTrend.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h2 className="font-semibold text-white text-sm">
                    30-Day Consistency Trend
                  </h2>
                  <span className="ml-auto text-xs text-slate-500">
                    % of activities completed per day
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={stats.consistencyTrend}>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickFormatter={(v) => {
                        try {
                          return format(parseISO(String(v)), "MMM d");
                        } catch {
                          return "";
                        }
                      }}
                      interval="preserveStartEnd"
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
                      labelFormatter={(l) => {
                        try {
                          return format(parseISO(String(l)), "MMM d, yyyy");
                        } catch {
                          return l;
                        }
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pct"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#6366f1" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
