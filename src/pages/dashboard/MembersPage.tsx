import { useState } from "react";
import { useQuery } from "convex/react";
import { Search, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

type MemberStatus = "all" | "joined" | "invited" | "pending";

const FILTERS: Array<{ value: MemberStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "joined", label: "Joined" },
  { value: "invited", label: "Invited" },
  { value: "pending", label: "Pending" },
];

export function MembersPage() {
  const [status, setStatus] = useState<MemberStatus>("all");
  const [search, setSearch] = useState("");

  const dashboard = useQuery(api.network.getDashboard);
  const members = useQuery(
    api.network.listMembers,
    status === "all" ? {} : { status },
  );

  const filteredMembers = (members ?? []).filter((member) => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return (
      member.name.toLowerCase().includes(needle) ||
      member.roleTitle.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <SurfaceCard className="relative overflow-hidden p-6 sm:p-8">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(circle at top left, hsl(221 83% 53% / 0.18), transparent 32%), radial-gradient(circle at bottom right, hsl(43 96% 48% / 0.16), transparent 28%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              Network
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
              Members follow mobile meanings again.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
              Joined, invited, and pending all live here. Admin directory moved back under admin.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <MetricTile label="Joined" value={dashboard?.stats.joinedCount} />
            <MetricTile label="Invited" value={dashboard?.stats.invitedCount} />
            <MetricTile label="Pending" value={dashboard?.stats.pendingCount} />
          </div>
        </div>
      </SurfaceCard>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                status === filter.value
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:w-[320px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member or role"
            className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
          />
        </label>
      </div>

      {members === undefined ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[28px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredMembers.map((member) => (
            <SurfaceCard key={member.id} className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                  <Users size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-black text-[hsl(var(--foreground))]">{member.name}</h2>
                    {member.isViewer && (
                      <span className="rounded-full bg-[hsl(var(--secondary)/0.14)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                        You
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{member.roleTitle}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                    member.status === "joined"
                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                      : member.status === "pending"
                        ? "bg-amber-500/12 text-amber-600 dark:text-amber-300"
                        : "bg-violet-500/12 text-violet-600 dark:text-violet-300"
                  }`}
                >
                  {member.status}
                </span>
              </div>
            </SurfaceCard>
          ))}
          {filteredMembers.length === 0 && (
            <SurfaceCard className="p-8 xl:col-span-2">
              <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                No members matched current filter.
              </p>
            </SurfaceCard>
          )}
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number | undefined }) {
  return (
    <SurfaceCard className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[hsl(var(--foreground))] tabular-nums">{value ?? "..."}</p>
    </SurfaceCard>
  );
}
