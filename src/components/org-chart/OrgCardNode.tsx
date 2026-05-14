import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Users, UserPlus, Clock, Trash2, Link2 } from "lucide-react";
import { type DummyMember, RANK_COLORS, STATUS_COLORS } from "@/data/dummyMembers";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "react-hot-toast";

export type OrgCardData = {
  member: Omit<DummyMember, "id" | "uplineId"> & { 
    id: Id<"users">;
    uplineId: Id<"users"> | null;
    lastUplineId?: Id<"users"> | null;
  };
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
  const removeUpline = useMutation(api.users.removeUpline);
  const setUpline = useMutation(api.users.setUpline);
  
  const rankColor = RANK_COLORS[member.rank];
  const isGoldTier = member.rank === "Master" || member.rank === "Diamond" || member.rank === "Gold";
  
  const isClickable = !isRoot && member.totalDownlines > 0;

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove ${member.name} from hierarchy?`)) {
      void (async () => {
        try {
          await removeUpline({ userId: member.id });
          toast.success("Member removed");
        } catch {
          toast.error("Failed to remove member");
        }
      })();
    }
  }, [member.id, member.name, removeUpline]);

  const handleReconnect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (member.lastUplineId) {
      void (async () => {
        try {
          await setUpline({ userId: member.id, uplineId: member.lastUplineId as Id<"users"> });
          toast.success(`Reconnected to previous manager`);
        } catch {
          toast.error("Failed to reconnect");
        }
      })();
    }
  }, [member.id, member.lastUplineId, setUpline]);

  return (
    <div
      className={`relative w-[160px] sm:w-[220px] rounded-[14px] transition-all duration-300 ${
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
      {/* Reconnect Handle */}
      {!isRoot && !member.uplineId && member.lastUplineId && (
        <button
          onClick={handleReconnect}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce border-2 border-[hsl(var(--background))]"
          title="Quick reconnect to previous manager"
        >
          <Link2 size={14} />
        </button>
      )}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-[hsl(var(--primary))] !border-2 !border-[hsl(var(--background))] !shadow-lg hover:scale-125 transition-transform cursor-pointer"
        style={{ top: -2 }}
        onClick={(e) => {
          e.stopPropagation();
          handleReconnect(e); // Quick reconnect if possible, or maybe open dialog?
          // For now, let's make it trigger the reconnection or dialog
        }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-[hsl(var(--primary))] !border-2 !border-[hsl(var(--background))] !shadow-lg hover:scale-125 transition-transform cursor-pointer"
        style={{ bottom: -2 }}
      />

      {/* Rank band */}
      <div
        className="rounded-t-[12px] px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between border-b group"
        style={{
          background: isGoldTier
            ? "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))"
            : `${rankColor}18`,
          borderBottomColor: `${rankColor}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest"
            style={{ color: isGoldTier ? "white" : rankColor }}
          >
            {member.rank}
          </span>
          {!isRoot && (
            <button
              onClick={handleRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-500 text-white/70"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
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
