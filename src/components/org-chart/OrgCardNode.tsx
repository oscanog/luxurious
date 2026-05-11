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
      className={`w-[160px] sm:w-[220px] rounded-[14px] transition-all duration-300 ${
        isClickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${selected ? "scale-[1.05] z-10" : "z-0"}`}
      style={{
        border: `2px solid ${
          selected ? rankColor : isRoot ? "hsl(43 96% 48%)" : data.branchColor || "hsl(var(--border))"
        }`,
        background: "hsl(var(--card))",
        boxShadow: isRoot
          ? "0 0 24px hsl(43 96% 48% / 0.35), 0 8px 32px hsl(0 0% 0% / 0.12)"
          : selected
            ? `0 0 30px ${rankColor}50, 0 8px 24px hsl(0 0% 0% / 0.1)`
            : "0 2px 12px hsl(0 0% 0% / 0.08)",
        transition: "box-shadow 0.3s, border-color 0.3s, transform 0.3s",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden", top: "50%", left: "50%" }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: "hidden", top: "50%", left: "50%" }} />

      {/* Rank band */}
      <div
        className="rounded-t-[12px] px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between border-b"
        style={{
          background: isGoldTier
            ? "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))"
            : `${rankColor}18`,
          borderBottomColor: `${rankColor}30`,
        }}
      >
        <span
          className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest"
          style={{ color: isGoldTier ? "white" : rankColor }}
        >
          {member.rank}
        </span>
        <StatusDot status={member.status} />
      </div>

      {/* Body */}
      <div className="p-2 sm:p-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
          <div
            className="w-7 h-7 sm:w-[34px] sm:h-[34px] rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-extrabold text-white shrink-0"
            style={{
              background: isGoldTier
                ? "linear-gradient(135deg, hsl(43 96% 48%), hsl(221 83% 53%))"
                : `linear-gradient(135deg, ${rankColor}, hsl(221 83% 53%))`,
            }}
          >
            {member.avatarInitials}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] sm:text-[13px] font-bold text-[hsl(var(--foreground))] whitespace-nowrap overflow-hidden text-ellipsis m-0">
              {member.name}
            </p>
            <p className="hidden sm:block text-[10px] text-[hsl(var(--muted-foreground))] m-0 whitespace-nowrap overflow-hidden text-ellipsis">
              {member.email}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
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
    <div className="bg-[hsl(var(--muted))] rounded-md sm:rounded-lg p-1 sm:p-1.5 flex flex-col items-center sm:items-start text-center sm:text-left">
      <div className="flex items-center justify-center sm:justify-start gap-1 text-[hsl(var(--muted-foreground))] mb-0.5">
        {icon}
        <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-[10px] sm:text-[11px] font-bold m-0 whitespace-nowrap overflow-hidden text-ellipsis ${positive ? "text-[hsl(152_69%_42%)]" : "text-[hsl(var(--foreground))]"}`}>
        {value}
      </p>
    </div>
  );
}

OrgCardNode.displayName = "OrgCardNode";
