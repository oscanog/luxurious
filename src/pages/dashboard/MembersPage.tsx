import { useState, useEffect, useRef } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import {
  ChevronDown,
  Check,
  Copy,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DashboardSearch,
  DashboardFilterGroup,
  DashboardFilterButton,
} from "@/components/dashboard/DashboardSearch";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

type MemberStatus = "all" | "joined" | "invited" | "pending" | "to-invite";

const FILTERS: Array<{ value: MemberStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "joined", label: "Joined" },
  { value: "invited", label: "Invited" },
  { value: "pending", label: "Pending" },
  { value: "to-invite", label: "To Invite" },
];

const PERMISSION_GROUPS = [
  {
    id: "joined-member",
    title: "Default Joined Member",
    subtitle: "Normal active member permissions.",
    icon: Users,
    can: [
      "View own allowed network/subtree.",
      "View joined member directory data allowed by backend.",
      "Use normal member workspace modules.",
      "Copy visible member IDs.",
    ],
    cannot: [
      "Add/edit downlines.",
      "Reassign/delete members.",
      "Reset passwords/change member emails.",
      "Promote/demote admins.",
      "Change direct capacity limits.",
      "Bypass direct-limit rules.",
    ],
  },
  {
    id: "level-1-admin",
    title: "Level 1 Admin",
    subtitle: "Branch-limited manager permissions.",
    icon: Shield,
    can: [
      "Add/edit only owned or self-created members/prospects.",
      "Manage status/location/investment/socials/assets for owned/self-created members.",
      "Work inside own allowed branch.",
    ],
    cannot: [
      "Manage unrelated visible members.",
      "Promote/demote admins.",
      "Change direct capacity limits.",
      "Run org ownership backfill.",
      "Bypass capacity rules.",
    ],
  },
  {
    id: "level-2-admin",
    title: "Level 2 Admin",
    subtitle: "Highest org-management permissions.",
    icon: ShieldCheck,
    can: [
      "Manage any visible member.",
      "Add/edit downlines under any visible joined member.",
      "Promote/demote Level 1 admins and members.",
      "Set per-member direct capacity overrides.",
      "Run org ownership backfill.",
      "Bypass default joined-member and Level 1 ownership restrictions.",
    ],
    cannot: [
      "Bypass authentication.",
      "Mutate missing/invalid records.",
      "Break protected backend safety checks such as valid parent, no self-parenting, no reconnect into own subtree.",
    ],
  },
] as const;

export function MembersPage() {
  const [status, setStatus] = useState<MemberStatus>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openPermissionRole, setOpenPermissionRole] = useState<string | null>(
    null,
  );

  const dashboard = useQuery(api.network.getDashboard);

  const {
    results,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.network.listMembersPaginated,
    status === "all"
      ? {}
      : { status: status === "to-invite" ? "to-invite" : (status as any) },
    { initialNumItems: 20 },
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && paginationStatus === "CanLoadMore") {
          loadMore(20);
        }
      },
      { threshold: 1.0 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [paginationStatus, loadMore]);

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMembers = (results ?? []).filter((member) => {
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
            <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))] dark:text-blue-100/60">
              Network
            </p>
            <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] dark:text-white sm:text-[44px]">
              Explorer
            </h1>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))] dark:text-blue-100/80 sm:text-base max-w-xl">
              Manage your direct network and downlines. Use filters to narrow
              down by status.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile
          label="Total"
          value={
            (dashboard?.stats.joinedCount ?? 0) +
            (dashboard?.stats.invitedCount ?? 0) +
            (dashboard?.stats.pendingCount ?? 0)
          }
          accentClassName="text-[hsl(var(--primary))]"
        />
        <StatTile
          label="Joined"
          value={dashboard?.stats.joinedCount}
          accentClassName="text-emerald-500"
        />
        <StatTile
          label="Invited"
          value={dashboard?.stats.invitedCount}
          accentClassName="text-blue-500"
        />
        <StatTile
          label="Pending"
          value={dashboard?.stats.pendingCount}
          accentClassName="text-amber-500"
        />
        <StatTile
          label="Slots"
          value={dashboard?.stats.toInviteCount}
          accentClassName="text-[hsl(var(--muted-foreground))]"
        />
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

      <SurfaceCard className="overflow-hidden border border-[hsl(var(--border)/0.5)] shadow-sm">
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.18)] px-5 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            RBAC Reference
          </p>
          <h2 className="mt-1 text-lg font-black text-[hsl(var(--foreground))]">
            What each member level can and cannot do
          </h2>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {PERMISSION_GROUPS.map((group) => {
            const Icon = group.icon;
            const isOpen = openPermissionRole === group.id;

            return (
              <div key={group.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenPermissionRole(isOpen ? null : group.id)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[hsl(var(--muted)/0.35)]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-[hsl(var(--foreground))]">
                        {group.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[hsl(var(--muted-foreground))]">
                        {group.subtitle}
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "shrink-0 text-[hsl(var(--muted-foreground))] transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                    <PermissionList tone="can" items={group.can} />
                    <PermissionList tone="cannot" items={group.cannot} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden border border-[hsl(var(--border)/0.5)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role / ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="group transition-colors hover:bg-[hsl(var(--muted)/0.5)]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] shadow-sm transition-transform group-hover:scale-105">
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
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        {member.roleTitle}
                      </span>
                      <button
                        onClick={() => copyToClipboard(member.id, member.id)}
                        className="flex w-max items-center gap-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]"
                      >
                        <span className="font-mono">
                          {member.id.slice(0, 8)}...
                        </span>
                        {copiedId === member.id ? (
                          <Check size={10} />
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
                        member.status === "joined"
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                          : member.status === "pending"
                            ? "bg-amber-500/12 text-amber-600 dark:text-amber-300"
                            : member.status === "invited"
                              ? "bg-blue-500/12 text-blue-600 dark:text-blue-300"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
                      )}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.status === "to-invite" ? (
                      <button className="rounded-lg bg-[hsl(var(--primary))] p-2 text-white shadow-md transition-all hover:scale-105 hover:bg-[hsl(var(--primary)/0.9)] active:scale-95">
                        <UserPlus size={16} />
                      </button>
                    ) : (
                      <button className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-[hsl(var(--muted-foreground))] transition-all hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]">
                        <Users size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {paginationStatus === "LoadingFirstPage" &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-4">
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </td>
                  </tr>
                ))}

              {filteredMembers.length === 0 &&
                paginationStatus !== "LoadingFirstPage" && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users
                          size={32}
                          className="text-[hsl(var(--muted-foreground)/0.5)]"
                        />
                        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                          No members matched your current filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="flex justify-center p-6">
          {paginationStatus === "LoadingMore" && (
            <div className="flex items-center gap-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
              Loading more members...
            </div>
          )}
          {paginationStatus === "Exhausted" && filteredMembers.length > 0 && (
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground)/0.5)]">
              End of Directory
            </p>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function PermissionList({
  tone,
  items,
}: {
  tone: "can" | "cannot";
  items: readonly string[];
}) {
  const isCan = tone === "can";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        isCan
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-red-500/20 bg-red-500/5",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-black uppercase tracking-[0.16em]",
          isCan
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-red-600 dark:text-red-300",
        )}
      >
        {isCan ? "Can do" : "Cannot do"}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-xs font-semibold leading-5 text-[hsl(var(--foreground))]"
          >
            <span
              className={cn(
                "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                isCan ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
    <SurfaceCard className="rounded-[30px] p-[18px] border border-[hsl(var(--border)/0.5)] shadow-sm transition-all hover:shadow-md">
      <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-[36px] leading-none font-bold tabular-nums",
          accentClassName,
        )}
      >
        {value ?? "..."}
      </p>
    </SurfaceCard>
  );
}
