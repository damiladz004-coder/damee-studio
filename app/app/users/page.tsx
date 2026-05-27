"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { formatNaira } from "../../../lib/format";
import type { Profile } from "../../../lib/types";

type UserWithStats = Profile & {
  purchases_count: number;
  referral_count: number;
  wallet_balance: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithStats = await Promise.all(
        (profiles ?? []).map(async (profile) => {
          const { count: purchasesCount } = await supabase
            .from("purchases")
            .select("*", { count: "exact" })
            .eq("user_id", profile.id);

          const { data: walletData } = await supabase
            .from("wallets")
            .select("available_balance")
            .eq("user_id", profile.id)
            .single();

          return {
            ...profile,
            purchases_count: purchasesCount || 0,
            referral_count: profile.referral_count,
            wallet_balance: walletData?.available_balance || 0,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function promoteToAdmin(userId: string) {
    if (!confirm("Promote this user to admin?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error("Failed to promote user:", error);
      alert("Failed to promote user");
    }
  }

  async function demoteFromAdmin(userId: string) {
    if (!confirm("Demote this user from admin?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error("Failed to demote user:", error);
      alert("Failed to demote user");
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalBalance = users.reduce((sum, u) => sum + u.wallet_balance, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-zinc-400">Manage platform users and roles</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Admins</p>
          <p className="text-3xl font-bold text-white">{adminCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Total Wallet Balance</p>
          <p className="text-2xl font-bold text-white">{formatNaira(totalBalance)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by username or display name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-zinc-400">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">
            {users.length === 0 ? "No users yet" : "No users match your search"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-lg">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Display Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Purchases
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Referrals
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Balance
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white font-mono text-sm">{user.username}</td>
                  <td className="px-6 py-4 text-white">{user.display_name || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-zinc-500/20 text-zinc-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{user.purchases_count}</td>
                  <td className="px-6 py-4 text-white">{user.referral_count}</td>
                  <td className="px-6 py-4 text-white">{formatNaira(user.wallet_balance)}</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === "admin" ? (
                      <button
                        onClick={() => demoteFromAdmin(user.id)}
                        className="text-orange-400 hover:text-orange-300 text-sm"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => promoteToAdmin(user.id)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Promote
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
