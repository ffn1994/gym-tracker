"use client";

import { useState } from "react";
import { updatePassword } from "./actions";

const inputClass = "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export function ChangePasswordForm() {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) { setError("Passwords do not match."); return; }
    if (newPass.length < 6) { setError("Minimum 6 characters."); return; }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(newPass);
      setSuccess(true);
      setNewPass("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-xl text-sm">
        ✅ Password updated successfully!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 6 characters" className={inputClass} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass} required />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition">
        {loading ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
