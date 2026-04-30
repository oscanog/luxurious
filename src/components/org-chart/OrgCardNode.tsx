import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Users, UserPlus, Clock } from "lucide-react";
import { type DummyMember, RANK_COLORS, STATUS_COLORS } from "@/data/dummyMembers";

export type OrgCardData = {
  member: DummyMember;
  isRoot?: boolean;
  branchColor?: string;
};

export type OrgCardNode = Node<OrgCardData, "orgCard">;

function StatusDot({ status }: { status: DummyMember["status"] }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: STATUS_COLORS[status] }}
      title={status}
    />
  );
}

export const OrgCardNode = memo(function OrgCardNode({ data, selected }: NodeProps<OrgCardNode>) {
  const { member, isRoot } = data;
  const rankColor = RANK_COLORS[member.rank];
  const isGoldTier = member.rank === "Master" || member.rank === "Diamond" || member.rank === "Gold";
  
  // Can only drill down if not already root, and has downlines
  const isClickable = !isRoot && member.totalDownlines > 0;

  return (
    <div
      className={isClickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""}
      style={{
        width: 220,
        borderRadius: 14,
        border: `2px solid ${selected ? rankColor : isRoot ? "hsl(43 96% 48%)" : (data.branchColor || "hsl(var(--border))")}`,
        background: "hsl(var(--card))",
        boxShadow: isRoot
          ? "0 0 20px hsl(43 96% 48% / 0.25), 0 4px 16px hsl(0 0% 0% / 0.08)"
          : selected
            ? `0 0 16px ${rankColor}40`
            : "0 2px 8px hsl(0 0% 0% / 0.06)",
        transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden", top: "50%", left: "50%" }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: "hidden", top: "50%", left: "50%" }} />

      {/* Rank band */}
      <div
        style={{
          borderRadius: "12px 12px 0 0",
          padding: "6px 12px",
          background: isGoldTier
            ? "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))"
            : `${rankColor}18`,
          borderBottom: `1px solid ${rankColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: isGoldTier ? "white" : rankColor }}>
          {member.rank}
        </span>
        <StatusDot status={member.status} />
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px 12px" }}>
        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "white",
              flexShrink: 0,
              background: isGoldTier
                ? "linear-gradient(135deg, hsl(43 96% 48%), hsl(221 83% 53%))"
                : `linear-gradient(135deg, ${rankColor}, hsl(221 83% 53%))`,
            }}
          >
            {member.avatarInitials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
              {member.name}
            </p>
            <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {member.email}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <StatChip icon={<Users size={10} />} label="dline" value={String(member.totalDownlines ?? 0)} />
          <StatChip icon={<UserPlus size={10} />} label="invited" value={String(member.invitedCount ?? 0)} />
          <StatChip icon={<Clock size={10} />} label="pending" value={String(member.pendingCount ?? 0)} />
        </div>
      </div>


    </div>
  );
});

function StatChip({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive?: boolean }) {
  return (
    <div style={{ background: "hsl(var(--muted))", borderRadius: 8, padding: "4px 6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "hsl(var(--muted-foreground))", marginBottom: 1 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color: positive ? "hsl(152 69% 42%)" : "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </p>
    </div>
  );
}

OrgCardNode.displayName = "OrgCardNode";
