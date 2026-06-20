"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProgramTab } from "./ProgramTab";
import { useLang } from "@/app/lang";

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
    .sort((a, b) => a.date.localeCompare(a.date) || a.time.localeCompare(a.time));
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

  const weekStart = useMemo(getWeekStart, []);
  const thisWeekWorkouts = useMemo(
    () => workouts.filter(w => w.date >= weekStart),
    [workouts, weekStart]
  );
  const daysDoneThisWeek = useMemo(
    () => programDays.filter(d => dayTrainedThisWeek(d, programExercises, workouts, weekStart)).length,
    [programDays, programExercises, workouts, weekStart]
  );

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
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
          isEn={isEn}
        />
      )}
    </>
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
  if (workouts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-base font-medium text-gray-400">
          {isEn ? "Log workouts to see progress" : "سجّل تمارينك لتظهر هنا"}
        </p>
        <p className="text-sm mt-1">
          {isEn ? "Open a program day and start logging" : "افتح يوم من البرنامج وابدأ"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {programDays.map(day => {
        const dayExes = programExercises.filter(
          e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core")
        );
        const withData = dayExes.filter(ex => getExHistory(ex, workouts).length > 0);
        if (withData.length === 0) return null;

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

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {withData.map((ex, idx) => {
                const hist = getExHistory(ex, workouts);
                const firstW = Number(hist[0].weight_kg);
                const latestW = Number(hist[hist.length - 1].weight_kg);
                const gain = latestW - firstW;
                const isTimed = ex.duration_seconds !== null && ex.reps_min === null;
                const exName = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
                const lastEntry = hist[hist.length - 1];

                return (
                  <div
                    key={ex.id}
                    className={`flex items-center gap-4 px-4 py-3.5 ${
                      idx < withData.length - 1 ? "border-b border-gray-800/60" : ""
                    }`}
                  >
                    {/* Progress bar background */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{exName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {hist.length} {isEn ? (hist.length === 1 ? "session" : "sessions") : "جلسة"}
                        {!isTimed && hist.length > 1 && (
                          <span className="text-gray-600"> · {firstW} → {latestW} kg</span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-end">
                      {!isTimed ? (
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
                        <>
                          <p className="text-base font-bold text-white">{lastEntry.reps}s</p>
                          <p className="text-xs text-gray-500">{lastEntry.sets} sets</p>
                        </>
                      )}
                    </div>
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
  thisWeekWorkouts, daysDoneThisWeek, weekStart, isEn,
}: {
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  workouts: Workout[];
  thisWeekWorkouts: Workout[];
  daysDoneThisWeek: number;
  weekStart: string;
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

      {/* This week grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
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
                    : "border-gray-800 hover:border-gray-700"
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
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-2 text-center">
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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
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
                  idx < records.length - 1 ? "border-b border-gray-800/60" : ""
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
        active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
