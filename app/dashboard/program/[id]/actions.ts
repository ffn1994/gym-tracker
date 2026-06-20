"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logExercise(data: {
  exercise_name: string;
  muscle_group: string | null;
  weight_kg: number;
  sets: number;
  reps: number;
  notes: string;
  program_day_id: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().slice(0, 8);

  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    exercise_name: data.exercise_name,
    muscle_group: data.muscle_group ?? "General",
    date: today,
    time,
    weight_kg: data.weight_kg,
    sets: data.sets,
    reps: data.reps,
    rest_time_seconds: 90,
    workout_duration_min: 0,
    difficulty_level: "Medium",
    notes: data.notes,
  });

  if (error) throw error;

  revalidatePath(`/dashboard/program/${data.program_day_id}`);
  revalidatePath("/dashboard");
}
