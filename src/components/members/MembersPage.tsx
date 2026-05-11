import { useState } from "react";
import { Search, TrendingUp, Users, Award, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { DUMMY_MEMBERS, RANK_COLORS, STATUS_COLORS, type MemberRank, type MemberStatus } from "@/data/dummyMembers";
import { formatDate } from "@/lib/utils";

const RANK_ORDER_MAP: Record<MemberRank, number> = { Master: 5, Diamond: 4, Gold: 3, Silver: 2, Bronze: 1 };

function StatusBadge({ status }: { status: MemberStatus }) {
  const labels: Record<MemberStatus, string> = { active: "Active", inactive: "Inactive", pending: "Pending" };
  const color = STATUS_COLORS[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border shadow-sm"
      style={{ 
        background: `${color}12`, 
        color, 
        borderColor: `${color}30` 
      }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      {labels[status]}
    </span>
  );
}

function RankBadge({ rank }: { rank: MemberRank }) {
  const color = RANK_COLORS[rank];
  const isGold = rank === "Master" || rank === "Diamond" || rank === "Gold";
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-[0.08em] shadow-sm border"
      style={{ 
        background: isGold ? `linear-gradient(135deg, ${color}20, ${color}10)` : `${color}12`, 
        color,
        borderColor: `${color}40`
      }}>
      <Award size={10} style={{ color }} />
      {rank}
    </span>
  );
}

function getUplineName(uplineId: string | null): string {
  if (!uplineId) return "—";
  return DUMMY_MEMBERS.find((m) => m.id === uplineId)?.name ?? "—";
}

type SortKey = "name" | "rank" | "status" | "joinDate" | "totalDownlines" | "invitedCount" | "pendingCount";

export function MembersPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStatus, setFilterStatus] = useState<MemberStatus | "all">("all");

  const filtered = DUMMY_MEMBERS
    .filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.rank.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || m.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "rank") cmp = RANK_ORDER_MAP[a.rank] - RANK_ORDER_MAP[b.rank];
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "joinDate") cmp = a.joinDate.localeCompare(b.joinDate);
      else if (sortKey === "invitedCount") cmp = a.invitedCount - b.invitedCount;
      else if (sortKey === "pendingCount") cmp = a.pendingCount - b.pendingCount;
      return sortAsc ? cmp : -cmp;
    });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-30" />;
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  return (
    <div className="p-6 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Members", value: DUMMY_MEMBERS.length, icon: Users, color: "hsl(221 83% 53%)" },
          { label: "Active", value: DUMMY_MEMBERS.filter((m) => m.status === "active").length, icon: TrendingUp, color: "hsl(152 69% 42%)" },
          { label: "Pending", value: DUMMY_MEMBERS.filter((m) => m.status === "pending").length, icon: Users, color: "hsl(37 92% 50%)" },
          { label: "Master Rank", value: DUMMY_MEMBERS.filter((m) => m.rank === "Master").length, icon: Award, color: "hsl(43 96% 48%)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex items-center gap-4"
            style={{ boxShadow: "0 2px 8px hsl(0 0% 0% / 0.04)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-[22px] font-extrabold text-[hsl(var(--foreground))] leading-none">{value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search members by name, email or rank…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.08)] transition-all shadow-sm" 
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {(["all", "active", "pending", "inactive"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap active:scale-95"
              style={filterStatus === s
                ? { background: "hsl(43 96% 48%)", color: "white", boxShadow: "0 4px 12px hsl(43 96% 48% / 0.25)" }
                : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 lg:ml-auto">
          <span className="hidden sm:inline text-xs font-bold text-[hsl(var(--muted-foreground))] tabular-nums">
            {filtered.length} / {DUMMY_MEMBERS.length} <span className="opacity-50">members</span>
          </span>
          <button
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] text-sm font-bold transition-all active:scale-95 shadow-[0_4px_16px_hsl(var(--primary)/0.25)]"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
              {[
                { key: "name" as SortKey, label: "Member" },
                { key: "rank" as SortKey, label: "Rank" },
                { key: "status" as SortKey, label: "Status" },
                { key: "totalDownlines" as SortKey, label: "Downlines" },
                { key: "invitedCount" as SortKey, label: "Invited" },
                { key: "pendingCount" as SortKey, label: "Pending" },
                { key: "joinDate" as SortKey, label: "Joined" },
              ].map(({ key, label }) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors select-none">
                  <span className="flex items-center gap-1">{label}<SortIcon k={key} /></span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">Upline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${RANK_COLORS[m.rank]}, hsl(221 83% 53%))` }}>
                      {m.avatarInitials}
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">{m.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RankBadge rank={m.rank} /></td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--foreground))]">
                    <Users size={12} className="text-[hsl(var(--muted-foreground))]" />{m.totalDownlines}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--foreground))]">{m.invitedCount}</td>
                <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--foreground))]">{m.pendingCount}</td>
                <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">{formatDate(m.joinDate)}</td>
                <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">{getUplineName(m.uplineId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-[hsl(var(--muted-foreground))]">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No members match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
