"use client";

import { useState, useMemo } from "react";
import { WorkoutCard } from "./WorkoutCard";
import { AddWorkoutModal } from "./AddWorkoutModal";
import { ProgramTab } from "./ProgramTab";

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

export function DashboardClient({
  workouts,
  programDays,
  programExercises,
}: {
  workouts: Workout[];
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
}) {
  const [tab, setTab] = useState<"workouts" | "progress" | "stats" | "program">("program");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const muscleGroups = useMemo(
    () => [...new Set(workouts.map((w) => w.muscle_group))].sort(),
    [workouts]
  );

  const filtered = useMemo(() => {
    return workouts.filter((w) => {
      const matchSearch = !search || w.exercise_name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = !muscleFilter || w.muscle_group === muscleFilter;
      const matchDiff = !diffFilter || w.difficulty_level === diffFilter;
      const matchFrom = !dateFrom || w.date >= dateFrom;
      const matchTo = !dateTo || w.date <= dateTo;
      return matchSearch && matchMuscle && matchDiff && matchFrom && matchTo;
    });
  }, [workouts, search, muscleFilter, diffFilter, dateFrom, dateTo]);

  const progress = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    [...workouts].sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
      if (!map[w.exercise_name]) map[w.exercise_name] = [];
      map[w.exercise_name].push(w);
    });
    return Object.entries(map).map(([name, sessions]) => {
      const weights = sessions.map((s) => Number(s.weight_kg));
      const first = weights[0];
      const latest = weights[weights.length - 1];
      const best = Math.max(...weights);
      return { name, muscle_group: sessions[0].muscle_group, sessions: sessions.length, first, latest, best, gained: latest - first, history: sessions };
    }).sort((a, b) => b.sessions - a.sessions);
  }, [workouts]);

  const stats = useMemo(() => {
    if (workouts.length === 0) return null;
    const muscleCounts: Record<string, number> = {};
    workouts.forEach((w) => { muscleCounts[w.muscle_group] = (muscleCounts[w.muscle_group] || 0) + 1; });
    const topMuscle = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0];
    const heaviest = workouts.reduce((max, w) => Number(w.weight_kg) > Number(max.weight_kg) ? w : max, workouts[0]);
    const totalVolume = workouts.reduce((sum, w) => sum + Number(w.weight_kg) * w.sets * w.reps, 0);
    const uniqueExercises = new Set(workouts.map((w) => w.exercise_name)).size;
    const diffCounts = { Easy: 0, Medium: 0, Hard: 0 } as Record<string, number>;
    workouts.forEach((w) => { if (w.difficulty_level in diffCounts) diffCounts[w.difficulty_level]++; });
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const thisWeek = workouts.filter((w) => new Date(w.date) >= weekStart).length;
    return { topMuscle, heaviest, totalVolume, uniqueExercises, diffCounts, thisWeek };
  }, [workouts]);

  const hasFilters = search || muscleFilter || diffFilter || dateFrom || dateTo;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          <TabBtn active={tab === "program"} onClick={() => setTab("program")}>البرنامج</TabBtn>
          <TabBtn active={tab === "workouts"} onClick={() => setTab("workouts")}>تماريني</TabBtn>
          <TabBtn active={tab === "progress"} onClick={() => setTab("progress")}>تقدم</TabBtn>
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")}>إحصاء</TabBtn>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition">
          <span className="text-lg leading-none">+</span> Log Workout
        </button>
      </div>

      {/* PROGRAM TAB */}
      {tab === "program" && (
        <ProgramTab
          programDays={programDays}
          programExercises={programExercises}
          workouts={workouts}
          onAdd={() => setShowAdd(true)}
        />
      )}

      {/* WORKOUTS TAB */}
      {tab === "workouts" && (
        <>
          {workouts.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-5">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercise…" className="flex-1 min-w-[160px] px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All muscles</option>
                {muscleGroups.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" title="From date" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" title="To date" />
              {hasFilters && <button onClick={() => { setSearch(""); setMuscleFilter(""); setDiffFilter(""); setDateFrom(""); setDateTo(""); }} className="px-3 py-2 text-sm text-gray-400 hover:text-white transition">Clear</button>}
            </div>
          )}
          {filtered.length > 0 ? (
            <>
              {hasFilters && <p className="text-xs text-gray-500 mb-3">{filtered.length} of {workouts.length} workouts</p>}
              <div className="grid gap-4">{filtered.map((w) => <WorkoutCard key={w.id} w={w} />)}</div>
            </>
          ) : workouts.length === 0 ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : (
            <div className="text-center py-16 text-gray-600">
              <p className="text-lg">No workouts match your filters.</p>
              <button onClick={() => { setSearch(""); setMuscleFilter(""); setDiffFilter(""); }} className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition">Clear filters</button>
            </div>
          )}
        </>
      )}

      {/* PROGRESS TAB */}
      {tab === "progress" && (
        progress.length === 0 ? <EmptyState onAdd={() => setShowAdd(true)} /> : (
          <div className="grid gap-4">
            {progress.map((ex) => (
              <div key={ex.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{ex.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{ex.muscle_group} · {ex.sessions} session{ex.sessions !== 1 ? "s" : ""}</p>
                  </div>
                  <TrendBadge gained={ex.gained} />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatBox label="Starting" value={`${ex.first} kg`} />
                  <StatBox label="Best" value={`${ex.best} kg`} highlight />
                  <StatBox label="Latest" value={`${ex.latest} kg`} />
                </div>
                {ex.sessions > 1 && (
                  <div className="border-t border-gray-800 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Session history</p>
                    <div className="space-y-1.5">
                      {ex.history.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{s.date}</span>
                          <div className="flex items-center gap-3 text-gray-300">
                            <span>{s.sets}×{s.reps}</span>
                            <span className="font-semibold text-white w-16 text-right">{s.weight_kg} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* STATS TAB */}
      {tab === "stats" && (
        !stats ? <EmptyState onAdd={() => setShowAdd(true)} /> : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <BigStat icon="📋" label="Total Sessions" value={String(workouts.length)} />
              <BigStat icon="📅" label="This Week" value={String(stats.thisWeek)} />
              <BigStat icon="💪" label="Exercises" value={String(stats.uniqueExercises)} />
              <BigStat icon="🏆" label="Top Muscle" value={stats.topMuscle[0]} sub={`${stats.topMuscle[1]} sessions`} />
              <BigStat icon="⚡" label="Heaviest Lift" value={`${stats.heaviest.weight_kg} kg`} sub={stats.heaviest.exercise_name} />
              <BigStat icon="📦" label="Total Volume" value={`${(stats.totalVolume / 1000).toFixed(1)}t`} sub="kg lifted total" />
            </div>

            {/* Difficulty breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Difficulty Breakdown</h3>
              <div className="space-y-3">
                {(["Easy", "Medium", "Hard"] as const).map((d) => {
                  const count = stats.diffCounts[d] ?? 0;
                  const pct = workouts.length ? Math.round((count / workouts.length) * 100) : 0;
                  const color = d === "Hard" ? "bg-red-500" : d === "Medium" ? "bg-yellow-500" : "bg-green-500";
                  return (
                    <div key={d}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{d}</span><span>{count} sessions ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muscle distribution */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Muscle Groups</h3>
              <div className="space-y-3">
                {Object.entries(
                  workouts.reduce((acc, w) => { acc[w.muscle_group] = (acc[w.muscle_group] || 0) + 1; return acc; }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).map(([muscle, count]) => {
                  const pct = Math.round((count / workouts.length) * 100);
                  return (
                    <div key={muscle}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{muscle}</span><span>{count} sessions</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      {showAdd && <AddWorkoutModal onClose={() => setShowAdd(false)} />}
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
      {children}
    </button>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${highlight ? "bg-blue-900/40 border border-blue-800" : "bg-gray-800"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-blue-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function BigStat({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function TrendBadge({ gained }: { gained: number }) {
  if (gained > 0) return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-900/50 text-green-300 border border-green-800">+{gained} kg</span>;
  if (gained < 0) return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-900/50 text-red-300 border border-red-800">{gained} kg</span>;
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">No change</span>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-20 text-gray-600">
      <div className="text-5xl mb-4">📋</div>
      <p className="text-lg font-medium text-gray-400">No workouts logged yet.</p>
      <p className="text-sm mt-1 mb-5">Start tracking your sessions!</p>
      <button onClick={onAdd} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition">
        + Log Your First Workout
      </button>
    </div>
  );
}
