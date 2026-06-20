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

  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayWorkouts } = await supabase
    .from("workouts")
    .select("exercise_name, sets, reps, weight_kg, date")
    .eq("date", todayStr);

  return (
    <div className="min-h-screen bg-gray-950">
      <ProgramDayNav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <ProgramDayView
          day={day}
          exercises={exercises ?? []}
          todayWorkouts={todayWorkouts ?? []}
        />
      </main>
    </div>
  );
}
