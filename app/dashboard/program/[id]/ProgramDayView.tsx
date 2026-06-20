"use client";

import { useState } from "react";
import { AddWorkoutModal } from "@/app/dashboard/AddWorkoutModal";
import { useLang } from "@/app/lang";

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

type WorkoutSummary = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  date: string;
};

const DAY_ICONS: Record<number, string> = { 1: "💪", 2: "🏃", 3: "🦵", 4: "🚴" };

const PHASE_STYLE: Record<string, { border: string; bg: string; title: string }> = {
  warmup:   { border: "border-yellow-800", bg: "bg-yellow-900/10", title: "text-yellow-400" },
  main:     { border: "border-blue-800",   bg: "bg-blue-900/10",   title: "text-blue-400"   },
  core:     { border: "border-purple-800", bg: "bg-purple-900/10", title: "text-purple-400" },
  finisher: { border: "border-orange-800", bg: "bg-orange-900/10", title: "text-orange-400" },
  cooldown: { border: "border-green-800",  bg: "bg-green-900/10",  title: "text-green-400"  },
};

function formatTarget(ex: ProgramExercise): string {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets}×`);
  if (ex.reps_min !== null && ex.reps_max !== null)
    parts.push(ex.reps_min === ex.reps_max ? `${ex.reps_min}` : `${ex.reps_min}-${ex.reps_max}`);
  if (ex.duration_seconds)
    parts.push(ex.duration_seconds >= 60 ? `${Math.round(ex.duration_seconds / 60)}m` : `${ex.duration_seconds}s`);
  return parts.join("") || "—";
}

function findMatch(ar: string, en: string | null, workouts: WorkoutSummary[]) {
  const names = [ar.toLowerCase().trim(), en?.toLowerCase().trim() ?? ""].filter(Boolean);
  return workouts.find(w => {
    const wn = w.exercise_name.toLowerCase().trim();
    return names.some(n => wn === n || wn.includes(n) || n.includes(wn));
  });
}

function getFeedback(ex: ProgramExercise, w: WorkoutSummary) {
  const msgs: { text: string; level: "warn" | "error" | "tip" }[] = [];
  if (ex.sets && w.sets < ex.sets)
    msgs.push({ text: `${w.sets} / ${ex.sets} sets`, level: "error" });
  else if (ex.sets && w.sets > ex.sets)
    msgs.push({ text: `${w.sets} / ${ex.sets} sets`, level: "warn" });
  if (ex.reps_min !== null && w.reps < ex.reps_min)
    msgs.push({ text: `${w.reps} < ${ex.reps_min} reps`, level: "error" });
  else if (ex.reps_max !== null && w.reps > ex.reps_max + 2)
    msgs.push({ text: `${w.reps} reps — weight too light, increase it`, level: "tip" });
  return msgs;
}

export function ProgramDayView({ day, exercises, todayWorkouts }: {
  day: ProgramDay;
  exercises: ProgramExercise[];
  todayWorkouts: WorkoutSummary[];
}) {
  const { lang, t } = useLang();
  const [showAdd, setShowAdd] = useState(false);

  const isEn = lang === "en";
  const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;
  const dayGoal = isEn ? (day.goal_en ?? day.goal) : day.goal;

  const todayWeekDay = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const isToday = day.day_of_week === todayWeekDay;

  const mainExercises = exercises.filter(e => e.phase === "main" || e.phase === "core");
  const done = mainExercises.filter(ex => findMatch(ex.exercise_name, ex.exercise_name_en, todayWorkouts));
  const pct = mainExercises.length > 0 ? Math.round((done.length / mainExercises.length) * 100) : 0;

  const phases = ["warmup", "main", "core", "finisher", "cooldown"];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{DAY_ICONS[day.day_number]}</span>
              <span className="text-xs text-gray-500">{t.day} {day.day_number}</span>
              {isToday && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  {t.today}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{dayName}</h1>
            <p className="text-sm text-gray-400 mt-1">{dayGoal}</p>
          </div>
          <div className="shrink-0 bg-gray-800 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-gray-500">{t.duration}</p>
            <p className="text-base font-bold text-white">{day.duration_text} {t.min}</p>
          </div>
        </div>

        {isToday && mainExercises.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{t.dayProgress}</span>
              <span>{done.length} / {mainExercises.length} {t.exercisesLogged}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Exercise phases */}
      {phases.map(phase => {
        const list = exercises.filter(e => e.phase === phase);
        if (list.length === 0) return null;
        const s = PHASE_STYLE[phase];
        const isTracked = (phase === "main" || phase === "core") && isToday;

        return (
          <div key={phase} className={`border ${s.border} ${s.bg} rounded-2xl p-5`}>
            <h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${s.title}`}>
              {t.phases[phase]}
            </h2>
            <div className="space-y-4">
              {list.map(ex => {
                const exName  = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
                const exNotes = isEn ? (ex.notes_en ?? ex.notes) : ex.notes;
                const match   = isTracked ? findMatch(ex.exercise_name, ex.exercise_name_en, todayWorkouts) : undefined;
                const feedback = match ? getFeedback(ex, match) : [];
                const hasError = feedback.some(f => f.level === "error");
                const icon = match ? (hasError ? "❌" : feedback.length > 0 ? "⚠️" : "✅") : "•";

                return (
                  <div key={ex.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="shrink-0">{isTracked ? icon : "•"}</span>
                        <span className="text-sm font-semibold text-white">{exName}</span>
                        {ex.muscle_group && (
                          <span className="text-xs text-gray-600 hidden sm:block">({ex.muscle_group})</span>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-mono text-gray-200 bg-gray-800 px-2.5 py-1 rounded-lg whitespace-nowrap">
                        {formatTarget(ex)}
                      </span>
                    </div>

                    {exNotes && (
                      <p className="text-xs text-gray-500 ps-5">{exNotes}</p>
                    )}

                    {match && feedback.length === 0 && (
                      <p className="text-xs text-green-400 font-medium ps-5">
                        ✓ {match.sets}×{match.reps} @ {match.weight_kg} kg
                      </p>
                    )}

                    {feedback.map((f, i) => (
                      <p key={i} className={`text-xs font-medium ps-5 ${
                        f.level === "error" ? "text-red-400" :
                        f.level === "tip"   ? "text-sky-400" : "text-yellow-400"
                      }`}>
                        {f.level === "error" ? "❌" : f.level === "tip" ? "💡" : "⚠️"} {f.text}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Progression notes */}
      {t.progression[day.day_number] && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t.progressionNotes}
          </h3>
          <ul className="space-y-2">
            {t.progression[day.day_number].map((note, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-400">
                <span className="text-gray-600 shrink-0">→</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      {isToday && pct === 100 ? (
        <div className="text-center py-4 bg-green-900/20 border border-green-800 rounded-2xl">
          <p className="text-green-400 font-semibold">{t.completedToday}</p>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
        >
          {t.logTodayWorkout}
        </button>
      )}

      {showAdd && <AddWorkoutModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
