import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true });

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-white">⚡ Hybrid Athlete</Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-red-400 hover:text-red-300 transition font-medium">Sign out</button>
          </form>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h2 className="text-2xl font-bold text-white">Profile</h2>

        {/* Account Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account</h3>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">Email</span>
            <span className="text-sm text-white font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">Member since</span>
            <span className="text-sm text-white">{joinedDate}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-400">Workouts logged</span>
            <span className="text-sm text-white font-bold">{count ?? 0}</span>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">Change Password</h3>
          <ChangePasswordForm />
        </div>

        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </main>
    </div>
  );
}
