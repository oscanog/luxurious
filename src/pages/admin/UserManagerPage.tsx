import { useMutation, useQuery } from "convex/react";
import { Coins, Search, Shield } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/Skeleton";

export function UserManagerPage() {
  const users = useQuery(api.admin.getUsers);
  const setAdminStatus = useMutation(api.admin.setAdminStatus);
  const resetBalance = useMutation(api.admin.resetBalance);

  const [search, setSearch] = useState("");

  const isLoading = users === undefined;
  const userList = users ?? [];

  const filteredUsers = userList.filter((user) =>
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.name?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleToggleAdmin(userId: Id<"users">, currentStatus: boolean) {
    try {
      await setAdminStatus({ userId, status: !currentStatus });
      toast.success("Permissions updated");
    } catch {
      toast.error("Failed to update permissions");
    }
  }

  async function handleResetBalance(userId: Id<"users">) {
    const amount = window.prompt("Enter new virtual balance ($):", "10000");
    if (amount === null) {
      return;
    }
    try {
      await resetBalance({ userId, amount: Number.parseFloat(amount) });
      toast.success("Balance reset");
    } catch {
      toast.error("Failed to reset balance");
    }
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">User Directory</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">Admin-only member permissions and balance tools.</p>
        </div>
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]"
            size={16}
          />
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">User</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Role</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Virtual Balance</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="group transition-colors hover:bg-[hsl(var(--muted)/0.1)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)] text-sm font-bold text-[hsl(var(--primary))]">
                        {user.name?.[0] ?? user.email?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[hsl(var(--foreground))]">{user.name || "Anonymous"}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                        user.role === "admin" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      <Shield size={10} />
                      {user.role === "admin" ? "Admin" : "Member"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-extrabold tabular-nums text-[hsl(var(--foreground))]">
                      ${(user.balance ?? 0).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void handleResetBalance(user._id)}
                        className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-[hsl(var(--muted-foreground))] transition-all hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
                        title="Reset Balance"
                      >
                        <Coins size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleAdmin(user._id, user.role === "admin")}
                        className={`rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 transition-all ${
                          user.role === "admin"
                            ? "text-red-500 hover:bg-red-500/5"
                            : "text-[hsl(var(--muted-foreground))] hover:text-red-500"
                        }`}
                        title={user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                      >
                        <Shield size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
