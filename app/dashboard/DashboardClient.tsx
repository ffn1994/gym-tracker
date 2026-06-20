"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProgramTab } from "./ProgramTab";
import { useLang } from "@/app/lang";
import { deleteAllWorkouts } from "./program/[id]/actions";

/* ─── Types ─────────────────────────────────────────────── */

type ProgramDay = {
  id: number;
  day_number: number;
  day_name: string;
  day_name_en: string | null;
  day_of_week: string;
  duration_text: string;
  goal: string;
  goal_en: string | null;
};

type ProgramExercise = {
  id: number;
  program_day_id: number;
  phase: string;
  exercise_name: string;
  exercise_name_en: string | null;
  muscle_group: string | null;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  notes: string | null;
  notes_en: string | null;
  order_index: number;
};

type Workout = {
  id: number;
  exercise_name: string;
  muscle_group: string;
  date: string;
  time: string;
  weight_kg: number;
  sets: number;
  reps: number;
  rest_time_seconds: number;
  workout_duration_min: number;
  difficulty_level: string;
  notes: string;
  video_url?: string | null;
};

/* ─── Constants ──────────────────────────────────────────── */

const DAY_ICONS: Record<number, string> = { 1: "💪", 2: "🏃", 3: "🦵", 4: "🚴" };
const DOW_AR: Record<string, string> = {
  Saturday: "السبت",
  Monday: "الاثنين",
  Wednesday: "الأربعاء",
  Friday: "الجمعة",
};

/* ─── Helpers ────────────────────────────────────────────── */

function getExHistory(ex: ProgramExercise, workouts: Workout[]): Workout[] {
  const ar = ex.exercise_name.toLowerCase().trim();
  const en = ex.exercise_name_en?.toLowerCase().trim() ?? "";
  return workouts
    .filter(w => {
      const wn = w.exercise_name.toLowerCase().trim();
      return (
        wn === ar || wn === en ||
        (ar && (wn.includes(ar) || ar.includes(wn))) ||
        (en && (wn.includes(en) || en.includes(wn)))
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

function calcWeekStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0;
  function weekNum(dateStr: string): number {
    return Math.floor(new Date(dateStr + "T00:00:00").getTime() / (7 * 24 * 60 * 60 * 1000));
  }
  const weeks = [...new Set(workouts.map(w => weekNum(w.date)))].sort((a, b) => a - b);
  let streak = 1;
  for (let i = weeks.length - 1; i > 0; i--) {
    if (weeks[i] - weeks[i - 1] === 1) streak++;
    else break;
  }
  return streak;
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function dayTrainedThisWeek(
  day: ProgramDay,
  programExercises: ProgramExercise[],
  workouts: Workout[],
  weekStart: string
): boolean {
  const exes = programExercises.filter(
    e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core")
  );
  return exes.some(ex => getExHistory(ex, workouts).some(w => w.date >= weekStart));
}

/* ─── Main Component ─────────────────────────────────────── */

export function DashboardClient({
  workouts,
  programDays,
  programExercises,
}: {
  workouts: Workout[];
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
}) {
  const { t, lang } = useLang();
  const isEn = lang === "en";
  const [tab, setTab] = useState<"program" | "progress" | "stats">("program");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, startReset] = useTransition();
  const router = useRouter();

  const weekStart = useMemo(getWeekStart, []);
  const thisWeekWorkouts = useMemo(
    () => workouts.filter(w => w.date >= weekStart),
    [workouts, weekStart]
  );
  const daysDoneThisWeek = useMemo(
    () => programDays.filter(d => dayTrainedThisWeek(d, programExercises, workouts, weekStart)).length,
    [programDays, programExercises, workouts, weekStart]
  );

  function handleReset() {
    startReset(async () => {
      await deleteAllWorkouts();
      setConfirmReset(false);
      router.refresh();
    });
  }

  return (
    <>
      {/* Reset button — top right */}
      <div className="flex justify-end mb-3">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">{isEn ? "Delete all?" : "مسح كل السجل؟"}</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-xs text-red-400 font-bold hover:text-red-300 disabled:opacity-50"
            >✓</button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >✗</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs text-gray-600 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-gray-900"
          >
            🗑️ {isEn ? "Reset all" : "مسح الكل"}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex gap-1 bg-[#1e1b30] border border-white/8 rounded-xl p-1 shadow-lg">
          <TabBtn active={tab === "program"} onClick={() => setTab("program")}>{t.tabProgram}</TabBtn>
          <TabBtn active={tab === "progress"} onClick={() => setTab("progress")}>{t.tabProgress}</TabBtn>
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")}>{t.tabStats}</TabBtn>
        </div>
      </div>

      {/* ── PROGRAM TAB ── */}
      {tab === "program" && (
        <ProgramTab
          programDays={programDays}
          programExercises={programExercises}
          workouts={workouts}
        />
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === "progress" && (
        <ProgressTab
          programDays={programDays}
          programExercises={programExercises}
          workouts={workouts}
          isEn={isEn}
        />
      )}

      {/* ── STATS TAB ── */}
      {tab === "stats" && (
        <StatsTab
          programDays={programDays}
          programExercises={programExercises}
          workouts={workouts}
          thisWeekWorkouts={thisWeekWorkouts}
          daysDoneThisWeek={daysDoneThisWeek}
          weekStart={weekStart}
          weekStreak={calcWeekStreak(workouts)}
          isEn={isEn}
        />
      )}
    </>
  );
}

/* ─── Progress Chart ─────────────────────────────────────── */

function ProgressChart({ history }: { history: Workout[] }) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const weights = sorted.map(d => Number(d.weight_kg));
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 5;

  const W = 300, H = 80;
  const PL = 30, PR = 6, PT = 8, PB = 20;
  const cW = W - PL - PR, cH = H - PT - PB;

  const pts = sorted.map((d, i) => ({
    x: PL + (sorted.length === 1 ? cW / 2 : (i / (sorted.length - 1)) * cW),
    y: PT + cH - ((Number(d.weight_kg) - minW) / range) * cH,
    date: d.date,
    w: Number(d.weight_kg),
  }));

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const n = sorted.length;
  const labelIdxs = n <= 4
    ? sorted.map((_, i) => i)
    : [0, Math.round(n / 4), Math.round(n / 2), Math.round(3 * n / 4), n - 1];
  const uniqueIdxs = [...new Set(labelIdxs)];

  function fmt(d: string) {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  const gradId = `pg-${sorted[0]?.date ?? "x"}`;

  return (
    <div className="mt-2 -mx-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={PL} y1={PT + cH * (1 - f)} x2={W - PR} y2={PT + cH * (1 - f)} stroke="#1f2937" strokeWidth="1" />
        ))}
        {/* Y labels */}
        <text x={PL - 3} y={PT + 4} textAnchor="end" fontSize="7.5" fill="#6b7280">{maxW}kg</text>
        {minW !== maxW && (
          <text x={PL - 3} y={PT + cH + 4} textAnchor="end" fontSize="7.5" fill="#6b7280">{minW}kg</text>
        )}
        {/* Area */}
        <path
          d={`${line} L${pts[pts.length - 1].x.toFixed(1)} ${PT + cH} L${pts[0].x.toFixed(1)} ${PT + cH} Z`}
          fill={`url(#${gradId})`}
        />
        {/* Line */}
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* X date labels */}
        {uniqueIdxs.map(i => (
          <text key={i} x={pts[i].x.toFixed(1)} y={H - 3} textAnchor="middle" fontSize="7.5" fill="#6b7280">
            {fmt(sorted[i].date)}
          </text>
        ))}
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
            r={p.w === maxW ? 3.5 : 2}
            fill={p.w === maxW ? "#f59e0b" : "#3b82f6"}
          />
        ))}
      </svg>
    </div>
  );
}

/* ─── Progress Tab ───────────────────────────────────────── */

function ProgressTab({
  programDays, programExercises, workouts, isEn,
}: {
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  workouts: Workout[];
  isEn: boolean;
}) {
  const [openExId, setOpenExId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {programDays.map(day => {
        const dayExes = programExercises
          .filter(e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core"))
          .sort((a, b) => a.order_index - b.order_index);
        if (dayExes.length === 0) return null;

        const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;

        return (
          <div key={day.id}>
            <Link
              href={`/dashboard/program/${day.id}`}
              className="flex items-center gap-2 mb-3 group"
            >
              <span className="text-xl">{DAY_ICONS[day.day_number]}</span>
              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                {dayName}
              </span>
              <span className="ms-auto text-xs text-gray-600 group-hover:text-blue-400 transition">
                {isEn ? "Open →" : "فتح →"}
              </span>
            </Link>

            <div className="bg-[#1e1b2e]/80 border border-white/6 rounded-2xl overflow-hidden">
              {dayExes.map((ex, idx) => {
                const hist = getExHistory(ex, workouts);
                const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
                const hasHistory = hist.length > 0;
                const firstW = hasHistory ? Number(sorted[0].weight_kg) : 0;
                const latestW = hasHistory ? Number(sorted[sorted.length - 1].weight_kg) : 0;
                const gain = latestW - firstW;
                const isTimed = ex.duration_seconds !== null && ex.reps_min === null;
                const exName = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
                const lastEntry = hasHistory ? sorted[sorted.length - 1] : null;
                const hasChart = !isTimed && hist.length >= 2;
                const isOpen = openExId === ex.id;

                return (
                  <div
                    key={ex.id}
                    className={idx < dayExes.length - 1 ? "border-b border-slate-800/40" : ""}
                  >
                    {/* Row */}
                    <button
                      onClick={() => hasChart && setOpenExId(isOpen ? null : ex.id)}
                      className={`w-full px-4 py-3.5 flex items-center gap-3 text-start ${
                        hasChart ? "cursor-pointer active:bg-slate-800/30" : "cursor-default"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${hasHistory ? "text-white" : "text-gray-500"}`}>
                          {exName}
                        </p>
                        {hasHistory ? (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {hist.length} {isEn ? (hist.length === 1 ? "session" : "sessions") : "جلسة"}
                            {!isTimed && hist.length > 1 && (
                              <span className="text-gray-600"> · {firstW} → {latestW} kg</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-700 mt-0.5">
                            {isEn ? "Not logged yet" : "لم تُسجَّل بعد"}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-end">
                        {hasHistory ? (
                          !isTimed ? (
                            <>
                              <p className="text-base font-bold text-white">{latestW} kg</p>
                              {hist.length > 1 && gain !== 0 && (
                                <p className={`text-xs font-semibold ${gain > 0 ? "text-green-400" : "text-red-400"}`}>
                                  {gain > 0 ? `↑ +${gain}` : `↓ ${gain}`} kg
                                </p>
                              )}
                              {hist.length > 1 && gain === 0 && (
                                <p className="text-xs text-gray-600">—</p>
                              )}
                            </>
                          ) : (
                            lastEntry && (
                              <>
                                <p className="text-base font-bold text-white">{lastEntry.reps}s</p>
                                <p className="text-xs text-gray-500">{lastEntry.sets} sets</p>
                              </>
                            )
                          )
                        ) : (
                          <p className="text-sm text-gray-700">—</p>
                        )}
                      </div>
                      {hasChart && (
                        <span className="text-gray-500 text-xs shrink-0 w-3">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      )}
                    </button>

                    {/* Chart — dropdown */}
                    {isOpen && hasChart && (
                      <div className="px-4 pb-4 pt-0">
                        <ProgressChart history={hist} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Stats Tab ──────────────────────────────────────────── */

function StatsTab({
  programDays, programExercises, workouts,
  thisWeekWorkouts, daysDoneThisWeek, weekStart, weekStreak, isEn,
}: {
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  workouts: Workout[];
  thisWeekWorkouts: Workout[];
  daysDoneThisWeek: number;
  weekStart: string;
  weekStreak: number;
  isEn: boolean;
}) {
  const totalSetsThisWeek = thisWeekWorkouts.reduce((s, w) => s + w.sets, 0);

  const records = programDays.flatMap(day =>
    programExercises
      .filter(e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core"))
      .map(ex => {
        const hist = getExHistory(ex, workouts);
        if (hist.length === 0) return null;
        const isTimed = ex.duration_seconds !== null && ex.reps_min === null;
        const weights = hist.map(h => Number(h.weight_kg));
        const maxW = Math.max(...weights);
        const firstW = Number(hist[0].weight_kg);
        const latestW = Number(hist[hist.length - 1].weight_kg);
        return { ex, day, isTimed, maxW, firstW, latestW, sessions: hist.length };
      })
      .filter(Boolean)
  );

  return (
    <div className="space-y-5">

      {/* Streak banner */}
      {weekStreak >= 1 && (
        <div className="bg-[#1e1b2e]/80 border border-white/6 rounded-2xl px-5 py-4 flex items-center gap-4">
          <span className="text-3xl">{weekStreak >= 4 ? "🔥" : "⚡"}</span>
          <div>
            <p className="text-xl font-bold text-white">
              {weekStreak} {isEn ? (weekStreak === 1 ? "week" : "weeks") : "أسبوع"}
            </p>
            <p className="text-xs text-gray-500">{isEn ? "Consecutive weeks training" : "أسابيع متواصلة في التمرين"}</p>
          </div>
        </div>
      )}

      {/* This week grid */}
      <div className="bg-[#1e1b2e]/80 border border-white/6 rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {isEn ? "This Week" : "هذا الأسبوع"}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {programDays.map(day => {
            const done = dayTrainedThisWeek(day, programExercises, workouts, weekStart);
            const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;
            const dow = isEn ? day.day_of_week.slice(0, 3) : DOW_AR[day.day_of_week] ?? day.day_of_week;
            return (
              <Link
                key={day.id}
                href={`/dashboard/program/${day.id}`}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition text-center ${
                  done
                    ? "border-green-700 bg-green-900/20"
                    : "border-slate-700/30 hover:border-slate-600/50"
                }`}
              >
                <span className="text-xl">{done ? "✅" : DAY_ICONS[day.day_number]}</span>
                <p className="text-xs font-medium text-white leading-tight">{dayName}</p>
                <p className="text-xs text-gray-600">{dow}</p>
              </Link>
            );
          })}
        </div>

        {/* Week numbers */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{daysDoneThisWeek}<span className="text-sm text-gray-500">/4</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{isEn ? "Days done" : "أيام مكتملة"}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalSetsThisWeek}</p>
            <p className="text-xs text-gray-500 mt-0.5">{isEn ? "Sets this week" : "مجموعات الأسبوع"}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{workouts.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{isEn ? "Total logs" : "إجمالي التسجيلات"}</p>
          </div>
        </div>
      </div>

      {/* Records per exercise */}
      {records.length > 0 && (
        <div className="bg-[#1e1b2e]/80 border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800/60">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isEn ? "Personal Records" : "الأرقام القياسية"}
            </h3>
          </div>
          {records.map((r, idx) => {
            if (!r) return null;
            const exName = isEn ? (r.ex.exercise_name_en ?? r.ex.exercise_name) : r.ex.exercise_name;
            const gain = r.latestW - r.firstW;
            return (
              <div
                key={r.ex.id}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  idx < records.length - 1 ? "border-b border-slate-800/40" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{DAY_ICONS[r.day.day_number]}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{exName}</p>
                    <p className="text-xs text-gray-600">{r.sessions} {isEn ? "sessions" : "جلسة"}</p>
                  </div>
                </div>
                {!r.isTimed && (
                  <div className="text-end">
                    <p className="text-sm font-bold text-white">{r.maxW} kg</p>
                    {r.sessions > 1 && gain !== 0 && (
                      <p className={`text-xs font-semibold ${gain > 0 ? "text-green-400" : "text-red-400"}`}>
                        {gain > 0 ? `+${gain}` : `${gain}`} kg
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {workouts.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-base font-medium text-gray-400">
            {isEn ? "No data yet" : "لا يوجد بيانات بعد"}
          </p>
          <p className="text-sm mt-1">
            {isEn ? "Start logging from the program" : "ابدأ التسجيل من صفحة البرنامج"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Tab Button ─────────────────────────────────────────── */

function TabBtn({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
        active ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-slate-700/50"
      }`}
    >
      {children}
    </button>
  );
}
