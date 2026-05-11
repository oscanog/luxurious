import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Shield, Coins, Search } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Skeleton } from "../../components/ui/Skeleton";

export function MembersPage() {
  const users = useQuery(api.admin.getUsers);
  const setAdminStatus = useMutation(api.admin.setAdminStatus);
  const resetBalance = useMutation(api.admin.resetBalance);
  
  const [search, setSearch] = useState("");

  const isLoading = users === undefined;
  const userList = users ?? [];

  const filteredUsers = userList.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggleAdmin(userId: any, currentStatus: boolean) {
    try {
      await setAdminStatus({ userId, status: !currentStatus });
      toast.success("Permissions updated");
    } catch { toast.error("Failed to update permissions"); }
  }

  async function handleResetBalance(userId: any) {
    const amount = prompt("Enter new virtual balance ($):", "10000");
    if (amount === null) return;
    try {
      await resetBalance({ userId, amount: parseFloat(amount) });
      toast.success("Balance reset");
    } catch { toast.error("Failed to reset balance"); }
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">User Directory</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage platform members, roles, and balances.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" size={16} />
          <input 
            type="text" 
            placeholder="Search email or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium outline-none focus:border-[hsl(var(--primary))]" 
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[hsl(var(--muted)/0.3)] border-b border-[hsl(var(--border))]">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">User</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Role</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-right">Virtual Balance</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
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
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-[hsl(var(--muted)/0.1)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold text-sm">
                        {u.name?.[0] ?? u.email?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[hsl(var(--foreground))]">{u.name || "Anonymous"}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      u.role === "admin" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    }`}>
                      <Shield size={10} />
                      {u.role === "admin" ? "Admin" : "Member"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-extrabold text-[hsl(var(--foreground))] tabular-nums">
                      ${(u.balance ?? 0).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { void handleResetBalance(u._id); }}
                        className="p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary)/0.5)] transition-all"
                        title="Reset Balance"
                      >
                        <Coins size={14} />
                      </button>
                      <button 
                        onClick={() => { void handleToggleAdmin(u._id, u.role === "admin"); }}
                        className={`p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] transition-all ${
                          u.role === "admin" ? "text-red-500 hover:bg-red-500/5" : "text-[hsl(var(--muted-foreground))] hover:text-red-500"
                        }`}
                        title={u.role === "admin" ? "Revoke Admin" : "Make Admin"}
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
                <td colSpan={4} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))] text-sm">
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
