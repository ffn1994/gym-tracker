"use client";

import Link from "next/link";
import { useLang } from "@/app/lang";

type ProgramDay = {
  id: number;
  day_number: number;
  day_name: string;
  day_of_week: string;
  duration_text: string;
  goal: string;
};

type ProgramExercise = {
  id: number;
  program_day_id: number;
  phase: string;
  exercise_name: string;
  muscle_group: string | null;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  notes: string | null;
  order_index: number;
};

type WorkoutSummary = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  date: string;
};

const DAY_JS_TO_WEEK: Record<number, string> = {
  6: "Saturday",
  1: "Monday",
  3: "Wednesday",
  5: "Friday",
};

const DAY_ICONS: Record<number, string> = { 1: "💪", 2: "🏃", 3: "🦵", 4: "🚴" };

const DAY_COLORS: Record<number, { active: string }> = {
  1: { active: "border-blue-500 bg-blue-900/20" },
  2: { active: "border-green-500 bg-green-900/20" },
  3: { active: "border-orange-500 bg-orange-900/20" },
  4: { active: "border-purple-500 bg-purple-900/20" },
};

function findMatch(name: string, workouts: WorkoutSummary[]) {
  const n = name.toLowerCase().trim();
  return workouts.find(w => {
    const wn = w.exercise_name.toLowerCase().trim();
    return wn === n || wn.includes(n) || n.includes(wn);
  });
}

export function ProgramTab({
  programDays,
  programExercises,
  workouts,
}: {
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  workouts: WorkoutSummary[];
}) {
  const { t } = useLang();
  const todayWeekDay = DAY_JS_TO_WEEK[new Date().getDay()];
  const todayStr = new Date().toISOString().split("T")[0];
  const todayWorkouts = workouts.filter(w => w.date === todayStr);

  if (programDays.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p>{t.loadingProgram}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {programDays.map(day => {
        const isToday = day.day_of_week === todayWeekDay;
        const c = DAY_COLORS[day.day_number];

        let doneCount = 0, mainCount = 0, todayPct = 0;
        if (isToday) {
          const mainExs = programExercises.filter(
            e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core")
          );
          mainCount = mainExs.length;
          doneCount = mainExs.filter(ex => findMatch(ex.exercise_name, todayWorkouts)).length;
          todayPct = mainCount > 0 ? Math.round((doneCount / mainCount) * 100) : 0;
        }

        return (
          <Link
            key={day.id}
            href={`/dashboard/program/${day.id}`}
            className={`relative block text-start p-4 rounded-2xl border transition-all ${
              isToday ? c.active : "border-gray-800 bg-gray-900 hover:border-gray-700"
            }`}
          >
            {isToday && (
              <span className="absolute top-2 end-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                {t.today}
              </span>
            )}
            <div className="text-2xl mb-2">{DAY_ICONS[day.day_number]}</div>
            <p className="text-xs text-gray-500 mb-0.5">{t.day} {day.day_number}</p>
            <p className="text-sm font-bold text-white leading-tight">{day.day_name}</p>
            <p className="text-xs text-gray-500 mt-1">{day.duration_text} {t.min}</p>

            {isToday && mainCount > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${todayPct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{doneCount}/{mainCount} {t.exercises}</p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
