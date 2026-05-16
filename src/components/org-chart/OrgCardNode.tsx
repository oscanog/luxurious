import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Users, User, Trash2, Link2, Plus, Minus, CheckCircle, Network } from "lucide-react";
import { type DummyMember } from "@/data/dummyMembers";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "react-hot-toast";
import { useContextMenu } from "../ui/useContextMenu";
import { type ContextMenuItem } from "../ui/ContextMenu";

export type OrgCardData = {
  member: Omit<DummyMember, "id" | "uplineId" | "status" | "joinDate"> & { 
    id: Id<"networkMembers">;
    uplineId: Id<"networkMembers"> | null;
    lastUplineId?: Id<"networkMembers"> | null;
    directChildrenCount?: number;
    status: "joined" | "invited" | "pending" | "to-invite";
  };
  isRoot?: boolean;
  branchColor?: string;
};

export type OrgCardNode = Node<OrgCardData, "orgCard">;



export type OrgCardNodeType = Node<OrgCardData, "org-card">;

export const OrgCardNode = memo(function OrgCardNode({ data, selected }: NodeProps<OrgCardNodeType>) {
  const { member, isRoot } = data;
  const reassignMemberParent = useMutation(api.network.reassignMemberParent);
  const isFull = (member.directChildrenCount ?? 0) >= 6;
  
  const isClickable = !isRoot && member.totalDownlines > 0;

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove ${member.name} from hierarchy?`)) {
      void (async () => {
        try {
          await reassignMemberParent({ memberId: member.id as any, newParentMemberId: null });
          toast.success("Member removed");
        } catch {
          toast.error("Failed to remove member");
        }
      })();
    }
  }, [member.id, member.name, reassignMemberParent]);

  const handleReconnect = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (member.lastUplineId) {
      void (async () => {
        try {
          await reassignMemberParent({ memberId: member.id as any, newParentMemberId: member.lastUplineId as any });
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
            if (confirm(`Remove ${member.name} from hierarchy?`)) {
              void reassignMemberParent({ memberId: member.id as any, newParentMemberId: null }).then(() => {
                toast.success("Member removed");
              }).catch(() => {
                toast.error("Failed to remove member");
              });
            }
          }
        });
      }

      if (!member.uplineId && member.lastUplineId) {
        items.push({
          label: "Reconnect to Previous Manager",
          icon: <Link2 size={14} />,
          onClick: () => {
            void reassignMemberParent({ memberId: member.id as any, newParentMemberId: member.lastUplineId as any }).then(() => {
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
  }, [isRoot, member.uplineId, member.lastUplineId, member.id, member.name, reassignMemberParent, handleContextMenu]);

  return (
    <>
    <div
      onContextMenu={handleRightClick}
      className={`relative w-[240px] rounded-[24px] transition-all duration-300 ${
        isClickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${selected ? "scale-[1.05] z-10" : "z-0"} ${isFull ? "ring-2 ring-red-500/50" : ""}`}
      style={{
        background: "#1A2235",
        border: `2px solid ${selected ? "hsl(43 96% 48%)" : "#2E8B57"}`,
        boxShadow: selected ? `0 0 30px hsl(43 96% 48% / 0.4)` : "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {/* Capacity Badge */}
      {isFull && (
        <div className="absolute -top-3 -right-3 z-30 flex h-6 items-center gap-1 rounded-full bg-red-600 px-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
          <Users size={12} />
          <span>FULL</span>
        </div>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      {/* Reconnect Handle (if disconnected) */}
      {!isRoot && !member.uplineId && member.lastUplineId && (
        <button
          onClick={handleReconnect}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce border-2 border-[hsl(var(--background))]"
        >
          <Link2 size={14} />
        </button>
      )}

      <div className="p-4 pb-6">
        {/* Top Section: Avatar, Name, Action */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-[#273B7A] flex items-center justify-center shadow-inner shrink-0">
              <User size={24} className="text-[#FFD700]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-lg leading-tight truncate">{member.name}</span>
              <span className="text-[#8B9BB4] text-xs font-medium truncate">{member.rank}</span>
            </div>
          </div>
          {!isRoot && (
            <button 
              onClick={handleRemove}
              className="text-[#8B9BB4] hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors shrink-0 ml-2"
            >
              <Minus size={18} />
            </button>
          )}
        </div>

        {/* Middle Section: Status & Children Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 bg-[#273B7A] px-3 py-1.5 rounded-full">
            <CheckCircle size={14} className="text-[#FFD700]" />
            <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wider">
              {member.status}
            </span>
          </div>
          <span className="text-[#8B9BB4] text-sm font-medium">
            {member.directChildrenCount || 0} children
          </span>
        </div>

        {/* Bottom Section: Total Downline */}
        <div className="bg-[#111827]/50 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2">
          <Network size={16} className="text-[#8B9BB4]" />
          <span className="text-white text-sm font-medium">{member.totalDownlines || 0} total downline</span>
        </div>
      </div>

      {/* Add Button (Floating) */}
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
    </div>
    {ContextMenuComponent}
    </>
  );
});

OrgCardNode.displayName = "OrgCardNode";
