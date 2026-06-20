"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addWorkout(data: {
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
  video_url?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workouts").insert({ ...data, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteWorkout(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateWorkout(
  id: number,
  updates: {
    exercise_name: string;
    muscle_group: string;
    weight_kg: number;
    sets: number;
    reps: number;
    rest_time_seconds: number;
    workout_duration_min: number;
    difficulty_level: string;
    notes: string;
    video_url?: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("workouts").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
