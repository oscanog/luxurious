import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import {
  Users,
  BarChart3,
  Activity,
  ShieldAlert,
  ChevronRight,
  Bot,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { Id } from "../../../convex/_generated/dataModel";

export function AdminPortalPage() {
  const stats = useQuery(api.admin.getPlatformStats);
  const isAdmin = useQuery(api.admin.isAdmin);
  const adminContext = useQuery(api.admin.getAdminContext);
  const users = useQuery(api.admin.getUsers);
  const setAdminLevel = useMutation(api.admin.setAdminLevel);
  const backfillOrgAccessMetadata = useMutation(
    api.network.backfillOrgAccessMetadata,
  );
  const [isBackfillingOrgAccess, setIsBackfillingOrgAccess] = useState(false);

  const handleAdminLevelChange = (userId: Id<"users">, value: string) => {
    void (async () => {
      try {
        await setAdminLevel({
          userId,
          adminLevel: Number(value) as 0 | 1 | 2,
        });
        toast.success("Admin tier updated");
      } catch (error: any) {
        toast.error(error.message || "Failed to update admin tier");
      }
    })();
  };

  const handleBackfillOrgAccess = () => {
    void (async () => {
      setIsBackfillingOrgAccess(true);
      try {
        const result = await backfillOrgAccessMetadata({});
        toast.success(
          `Backfill done: ${result.updatedUsers} users, ${result.updatedMembers} members`,
        );
      } catch (error: any) {
        toast.error(error.message || "Backfill failed");
      } finally {
        setIsBackfillingOrgAccess(false);
      }
    })();
  };

  // Not yet determined (query loading)
  if (isAdmin === undefined) return null;

  if (!isAdmin) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center p-8 rounded-3xl border border-red-500/20 bg-red-500/5 max-w-md">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-black text-[hsl(var(--foreground))]">
            Restricted Access
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            You do not have administrative privileges to view this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">
          Platform Administration
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Global oversight and system management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Users",
            value: stats?.userCount ?? "...",
            icon: Users,
            color: "hsl(221 83% 53%)",
          },
          {
            label: "Total Trades",
            value: stats?.tradeCount ?? "...",
            icon: BarChart3,
            color: "hsl(152 69% 42%)",
          },
          {
            label: "Open Positions",
            value: stats?.openPositions ?? "...",
            icon: Activity,
            color: "hsl(43 96% 48%)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15` }}
              >
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <span className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                Global
              </span>
            </div>
            <p className="text-3xl font-black text-[hsl(var(--foreground))] tabular-nums">
              {s.value}
            </p>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-6">
            Management Tools
          </h3>
          <div className="space-y-3">
            {[
              {
                title: "Academy Content Manager",
                desc: "Edit levels, lessons, and slugs.",
                path: "/admin/academy",
              },
              {
                title: "AI Agent Settings",
                desc: "Manage DeepSeek V4, keys, limits, skills, and scope.",
                path: "/admin/ai-settings",
                icon: Bot,
              },
              {
                title: "User Directory",
                desc: "Manage roles and virtual balances.",
                path: "/admin/users",
              },
              {
                title: "Global Trade Monitor",
                desc: "View all live and past trades.",
                path: "/admin/trades",
              },
              {
                title: "Profile + Security",
                desc: "Review profile, rank, and password workflow.",
                path: "/profile",
              },
            ].map((tool) => (
              <Link
                key={tool.title}
                to={tool.path}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.5)] transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                    {tool.title}
                  </p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {tool.desc}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors"
                />
              </Link>
            ))}
          </div>
        </div>

        {adminContext?.canPromoteAdmins && (
          <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[hsl(var(--primary))]" />
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Admin Tiers
                </h3>
              </div>
              <button
                onClick={handleBackfillOrgAccess}
                disabled={isBackfillingOrgAccess}
                className="rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[hsl(var(--muted))] disabled:opacity-50"
              >
                {isBackfillingOrgAccess ? "Backfill" : "Backfill Org"}
              </button>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {(users ?? []).map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {user.name ?? user.email ?? "Unnamed user"}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                      {user.email ?? user._id}
                    </p>
                  </div>
                  <select
                    value={user.adminLevel ?? (user.role === "admin" ? 1 : 0)}
                    onChange={(event) =>
                      handleAdminLevelChange(user._id, event.target.value)
                    }
                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value={0}>Member</option>
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 rounded-2xl border border-dashed border-[hsl(var(--border))] flex items-center justify-center">
          <div className="text-center">
            <Activity
              size={32}
              className="mx-auto mb-2 text-[hsl(var(--muted-foreground))] opacity-20"
            />
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">
              Real-time health monitor coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
