import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgramDayNav } from "./ProgramDayNav";
import { ProgramDayView } from "./ProgramDayView";

export default async function ProgramDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: day } = await supabase
    .from("program_days")
    .select("*")
    .eq("id", id)
    .single();

  if (!day) redirect("/dashboard");

  const { data: exercises } = await supabase
    .from("program_exercises")
    .select("*")
    .eq("program_day_id", id)
    .order("order_index");

  // Fetch ALL historical workouts for exercises in this day (both AR + EN names)
  const namesAr = (exercises ?? []).map(e => e.exercise_name);
  const namesEn = (exercises ?? []).map(e => e.exercise_name_en).filter(Boolean) as string[];
  const allNames = [...new Set([...namesAr, ...namesEn])];

  const { data: workoutHistory } = allNames.length > 0
    ? await supabase
        .from("workouts")
        .select("id, exercise_name, weight_kg, sets, reps, date, notes")
        .in("exercise_name", allNames)
        .order("date", { ascending: false })
        .order("time", { ascending: false })
    : { data: [] };

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: bwData } = await supabase
    .from("body_weights")
    .select("weight_kg, date")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestBodyWeight = bwData?.weight_kg ? Number(bwData.weight_kg) : null;
  const bodyWeightToday = bwData?.date === todayStr;

  const { data: noteData } = await supabase
    .from("session_notes")
    .select("note")
    .eq("user_id", user.id)
    .eq("program_day_id", id)
    .eq("date", todayStr)
    .maybeSingle();

  const todayNote = noteData?.note ?? "";

  return (
    <div className="min-h-screen">
      <ProgramDayNav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <ProgramDayView
          day={day}
          exercises={exercises ?? []}
          workoutHistory={workoutHistory ?? []}
          latestBodyWeight={latestBodyWeight}
          bodyWeightToday={bodyWeightToday}
          todayNote={todayNote}
        />
      </main>
    </div>
  );
}
