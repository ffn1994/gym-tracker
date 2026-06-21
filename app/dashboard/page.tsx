import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import Link from "next/link";
import { LangToggle } from "@/app/LangToggle";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_paid")
    .eq("id", user.id)
    .single();

  if (!profile?.is_paid) redirect("/buy");

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  const { data: programDays } = await supabase
    .from("program_days")
    .select("*")
    .order("day_number");

  const { data: programExercises } = await supabase
    .from("program_exercises")
    .select("*")
    .order("order_index");

  return (
    <div className="min-h-screen">
      <nav className="bg-[#17152a]/80 backdrop-blur-sm border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-white">⚡ Hybrid Athlete</span>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link href="/profile" className="text-sm text-gray-400 hover:text-white transition hidden sm:block">
              {user.email}
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-red-400 hover:text-red-300 transition font-medium">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <DashboardClient
          workouts={workouts ?? []}
          programDays={programDays ?? []}
          programExercises={programExercises ?? []}
        />
      </main>
    </div>
  );
}
