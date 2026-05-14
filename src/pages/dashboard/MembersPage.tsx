import { useState } from "react";
import { useQuery } from "convex/react";
import { Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardSearch, DashboardFilterGroup, DashboardFilterButton } from "@/components/dashboard/DashboardSearch";

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
      <section className="overflow-hidden rounded-[34px] border border-[hsl(210_40%_90%)] bg-[linear-gradient(135deg,hsl(210_40%_99%),hsl(210_40%_96%))] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[linear-gradient(135deg,#26459E,#1E3A8A)]">
        <div className="flex flex-col gap-6 px-[22px] py-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
          <div className="flex-1 pb-[18px]">
            <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))] dark:text-blue-100/60">Network</p>
            <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] dark:text-white sm:text-[44px]">
              Directory
            </h1>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))] dark:text-blue-100/80 sm:text-base max-w-xl">
              Joined, invited, and pending members. Admin directory moved back under admin.
            </p>
          </div>
        </div>
      </section>



      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Joined" value={dashboard?.stats.joinedCount} accentClassName="text-[hsl(var(--secondary))]" />
        <StatTile label="Invited" value={dashboard?.stats.invitedCount} accentClassName="text-[hsl(var(--foreground))]" />
        <StatTile label="Pending" value={dashboard?.stats.pendingCount} accentClassName="text-[hsl(var(--foreground))]" />
      </div>




      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <DashboardFilterGroup>
          {FILTERS.map((filter) => (
            <DashboardFilterButton
              key={filter.value}
              label={filter.label}
              active={status === filter.value}
              onClick={() => setStatus(filter.value)}
            />
          ))}
        </DashboardFilterGroup>

        <DashboardSearch 
          value={search} 
          onChange={setSearch} 
          placeholder="Search member or role" 
        />
      </div>

      {members === undefined ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[28px]" />
          ))}
        </div>
      ) : (
        <SurfaceCard className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="transition-colors hover:bg-[hsl(var(--muted))]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                        <Users size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[hsl(var(--foreground))]">
                          {member.name}
                        </span>
                        {member.isViewer && (
                          <span className="mt-1 w-max rounded-full bg-[hsl(var(--secondary)/0.14)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">
                    {member.roleTitle}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                        member.status === "joined"
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                          : member.status === "pending"
                            ? "bg-amber-500/12 text-amber-600 dark:text-amber-300"
                            : "bg-violet-500/12 text-violet-600 dark:text-violet-300"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    No members matched current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SurfaceCard>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: number | undefined;
  accentClassName: string;
}) {
  return (
    <SurfaceCard className="rounded-[30px] p-[18px]">
      <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={`mt-3 text-[40px] leading-none font-bold tabular-nums ${accentClassName}`}>{value ?? "..."}</p>
    </SurfaceCard>
  );
}
