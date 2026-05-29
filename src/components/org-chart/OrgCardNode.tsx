import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Users, User, Trash2, Link2, Plus, Minus, Check, Mail, UserPlus, Network } from "lucide-react";
import { type DummyMember } from "@/data/dummyMembers";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "react-hot-toast";
import { useContextMenu } from "../ui/useContextMenu";
import { type ContextMenuItem } from "../ui/ContextMenu";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useState } from "react";

export type OrgCardData = {
  member: Omit<DummyMember, "id" | "uplineId" | "status" | "joinDate"> & { 
    id: Id<"networkMembers">;
    uplineId: Id<"networkMembers"> | null;
    lastUplineId?: Id<"networkMembers"> | null;
    directChildrenCount?: number;
    totalDownlines?: number;
    joinedDownlines?: number;
    prospectDownlines?: number;
    status: "joined" | "invited" | "pending" | "to-invite";
    allowAdd?: boolean;
    latestAsset?: {
      name: string;
      value: number;
      currency: string;
      createdAt: number;
    } | null;
    investmentStartedAt?: number;
    city?: string;
    province?: string;
    country?: string;
    locationAddress?: string;
    latitude?: number;
    longitude?: number;
  };
  isRoot?: boolean;
  branchColor?: string;
};

export function formatTimeSinceJoined(timestamp?: number): string | null {
  if (!timestamp) return null;
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "Joined just now";
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Joined just now";
  if (diffMins < 60) return `Joined ${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Joined ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Joined ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export type OrgCardNode = Node<OrgCardData, "orgCard">;



export type OrgCardNodeType = Node<OrgCardData, "org-card">;

export const OrgCardNode = memo(function OrgCardNode({ data, selected }: NodeProps<OrgCardNodeType>) {
  const { member, isRoot } = data;
  const reassignMemberParent = useMutation(api.network.reassignMemberParent);
  const isFull = (member.directChildrenCount ?? 0) >= 6;
  const isMasterNode = isRoot || member.uplineId == null;
  const isClickable = !isRoot && member.totalDownlines > 0;
  const chipStyles = {
    joined: {
      bg: "bg-[hsl(221_83%_53%/0.14)] dark:bg-[#273B7A] text-[hsl(43,96%,48%)] dark:text-[#FFD700]",
      icon: <Check size={14} className="stroke-[3]" />,
    },
    invited: {
      bg: "bg-[#FFD700] text-[#1A2235]",
      icon: <Mail size={14} />,
    },
    pending: {
      bg: "bg-[#4B5563]/25 dark:bg-[#4B5563] text-white",
      icon: <div className="w-2 h-2 rounded-full bg-white shrink-0" />,
    },
    "to-invite": {
      bg: "bg-[#374151]/25 dark:bg-[#374151] text-white",
      icon: <UserPlus size={14} />,
    },
  } as const;
  const statusBorderColor = {
    joined: "#2E7D32",
    invited: "#E65100",
    pending: "#6A1B9A",
    "to-invite": "transparent",
  } as const;
  const statusBorderToneClass = {
    joined: "shadow-[0_0_20px_rgba(46,125,50,0.18)]",
    invited: "shadow-[0_0_20px_rgba(230,81,0,0.18)]",
    pending: "shadow-[0_0_18px_rgba(106,27,154,0.16)]",
    "to-invite": "shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
  } as const;
  const selectedStatusToneClass = {
    joined: "scale-[1.05] z-10 shadow-[0_0_30px_rgba(46,125,50,0.32)]",
    invited: "scale-[1.05] z-10 shadow-[0_0_30px_rgba(230,81,0,0.3)]",
    pending: "scale-[1.05] z-10 shadow-[0_0_26px_rgba(106,27,154,0.24)]",
    "to-invite":
      "scale-[1.05] z-10 shadow-[0_0_26px_rgba(148,163,184,0.18)]",
  } as const;
  const borderColor = isMasterNode
    ? "hsl(43 96% 48%)"
    : selected && member.status === "to-invite"
      ? "hsl(var(--foreground) / 0.24)"
      : statusBorderColor[member.status];

  const borderToneClass = isMasterNode
    ? "shadow-[0_0_24px_hsl(43,96%,48%,0.28)]"
    : statusBorderToneClass[member.status];

  const selectedToneClass = isMasterNode
    ? "scale-[1.05] z-10 shadow-[0_0_34px_hsl(43,96%,48%,0.45)]"
    : selectedStatusToneClass[member.status];

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState<"disconnect" | "reconnect">("disconnect");

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoveOpen(true);
  }, []);

  const executeRemove = useCallback(async () => {
    setIsRemoveOpen(false);
    try {
      await reassignMemberParent({ 
        memberId: member.id,
        newParentMemberId: null,
        reconnectChildren: removeMode === "reconnect"
      });
      toast.success("Member removed from hierarchy");
    } catch {
      toast.error("Failed to remove member");
    }
  }, [member.id, removeMode, reassignMemberParent]);

  const handleReconnect = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const previousUplineId = member.lastUplineId;

    if (previousUplineId) {
      void (async () => {
        try {
          await reassignMemberParent({ memberId: member.id, newParentMemberId: previousUplineId });
          toast.success(`Reconnected to previous manager`);
        } catch {
          toast.error("Failed to reconnect");
        }
      })();
    }
  }, [member.id, member.lastUplineId, reassignMemberParent]);

  const { handleContextMenu, ContextMenuComponent } = useContextMenu();

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    const items: ContextMenuItem[] = [];

    if (!isRoot) {
      if (member.uplineId) {
        items.push({
          label: "Remove from Hierarchy",
          icon: <Trash2 size={14} />,
          variant: "danger",
          onClick: () => {
            setIsRemoveOpen(true);
          }
        });
      }

      if (!member.uplineId && member.lastUplineId) {
        const previousUplineId = member.lastUplineId;

        items.push({
          label: "Reconnect to Previous Manager",
          icon: <Link2 size={14} />,
          onClick: () => {
            void reassignMemberParent({ memberId: member.id, newParentMemberId: previousUplineId }).then(() => {
              toast.success("Member reconnected");
            }).catch(() => {
              toast.error("Failed to reconnect");
            });
          }
        });
      }
    }

    if (items.length > 0) {
      handleContextMenu(e, items);
    }
  }, [isRoot, member.uplineId, member.lastUplineId, member.id, reassignMemberParent, handleContextMenu]);

  return (
    <>
    <div
      onContextMenu={handleRightClick}
      className={`relative w-[240px] rounded-[24px] transition-all duration-300 border-2 bg-[hsl(var(--card))] ${
        isClickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${selected ? selectedToneClass : `z-0 ${borderToneClass}`} ${isFull ? "ring-2 ring-red-500/50" : ""}`}
      style={{ borderColor }}
    >
      {/* Capacity Badge */}
      {isFull && (
        <div className="absolute -top-3 -right-3 z-30 flex h-6 items-center gap-1 rounded-full bg-red-600 px-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
          <Users size={12} />
          <span>FULL</span>
        </div>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[hsl(43,96%,48%)] !border-none opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[hsl(43,96%,48%)] !border-none opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Reconnect Handle (if disconnected) */}
      {!isRoot && !member.uplineId && member.lastUplineId && (
        <button
          onClick={handleReconnect}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce border-2 border-[hsl(var(--background))]"
        >
          <Link2 size={14} />
        </button>
      )}

      <div className="p-4 pb-6 group">
        {/* Top Section: Avatar, Name, Action */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] dark:bg-[#273B7A] flex items-center justify-center shadow-inner shrink-0">
              <User size={24} className="text-[hsl(43,96%,48%)]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[hsl(var(--foreground))] font-bold text-lg leading-tight truncate">{member.name}</span>
              <span className="text-[hsl(var(--muted-foreground))] text-xs font-medium truncate">{member.rank}</span>
              {member.latestAsset && (
                <span className="text-[hsl(43,96%,48%)] text-[10px] font-black uppercase tracking-wider mt-0.5 truncate block">
                  Asset: {member.latestAsset.currency} {member.latestAsset.value.toLocaleString()}
                </span>
              )}
              {member.latestAsset && member.investmentStartedAt && (
                <span className="text-[hsl(var(--muted-foreground))] text-[9px] font-semibold mt-0.5 truncate block">
                  {formatTimeSinceJoined(member.investmentStartedAt)}
                </span>
              )}
            </div>
          </div>
          {!isRoot && (
            <button 
              onClick={handleRemove}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-full p-1 transition-colors shrink-0 ml-2"
            >
              <Minus size={18} />
            </button>
          )}
        </div>

        {/* Middle Section: Status & Children Count */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${chipStyles[member.status].bg}`}>
            {chipStyles[member.status].icon}
            <span className="text-xs font-bold uppercase tracking-wider">
              {member.status}
            </span>
          </div>
          <span className="text-[hsl(var(--muted-foreground))] text-sm font-medium">
            {member.directChildrenCount || 0}{" "}
            {member.directChildrenCount === 1 ? "LuxTrader" : "LuxTraders"}
          </span>
        </div>

        {/* Bottom Section: Total Downline */}
        <div className="bg-[hsl(var(--muted)/0.5)] dark:bg-[#111827]/50 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2">
          <Network size={16} className="text-[hsl(var(--muted-foreground))]" />
          <span className="text-[hsl(var(--foreground))] text-sm font-medium">{member.totalDownlines || 0} total downline</span>
        </div>
      </div>

      {/* Add Button (Floating) */}
      {member.allowAdd !== false && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              (window as any).triggerAddMember?.(member.id);
            }}
            disabled={isFull}
            className={`flex w-10 h-10 items-center justify-center rounded-full shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-transform ${
              isFull 
                ? "bg-gray-600 cursor-not-allowed opacity-50 shadow-none"
                : "bg-[#FFD700] hover:scale-110 active:scale-95 cursor-pointer"
            }`}
          >
            <Plus size={20} className="text-black" strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
    {ContextMenuComponent}
    
    <ConfirmDialog
      isOpen={isRemoveOpen}
      title="Remove from Hierarchy"
      description={`Are you sure you want to remove ${member.name} from the hierarchy?`}
      variant="danger"
      confirmLabel="Remove"
      onConfirm={() => void executeRemove()}
      onCancel={() => setIsRemoveOpen(false)}
    >
      <div className="space-y-3 mt-4">
        <label className="flex items-start gap-3 p-3 rounded-xl border border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
          <input 
            type="radio" 
            name="removeMode" 
            value="disconnect"
            checked={removeMode === "disconnect"}
            onChange={() => setRemoveMode("disconnect")}
            className="mt-1"
          />
          <div>
            <p className="font-bold text-sm text-[hsl(var(--foreground))]">Disconnect only</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Member and their entire downline will be disconnected from the chart.</p>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-xl border border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
          <input 
            type="radio" 
            name="removeMode" 
            value="reconnect"
            checked={removeMode === "reconnect"}
            onChange={() => setRemoveMode("reconnect")}
            className="mt-1"
          />
          <div>
            <p className="font-bold text-sm text-[hsl(var(--foreground))]">Reconnect children</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Member will be disconnected, but their direct downlines will be moved up to the grandparent.</p>
          </div>
        </label>
      </div>
    </ConfirmDialog>
    </>
  );
});

OrgCardNode.displayName = "OrgCardNode";
