import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Search, UserPlus, X, ChevronLeft, ChevronRight, User } from "lucide-react";
import { toast } from "react-hot-toast";

interface MemberSidebarProps {
  currentPivotId: string;
  isOpen: boolean;
  onToggle: () => void;
  visibleMembers: { id: string; name: string; role?: string }[];
  selectedMember: Doc<"users"> | null;
  setSelectedMember: (member: Doc<"users"> | null) => void;
  targetManagerId: string;
  setTargetManagerId: (id: string) => void;
  onSuccess?: () => void;
}

export function MemberSidebar({ 
  currentPivotId, 
  isOpen, 
  onToggle, 
  visibleMembers, 
  selectedMember,
  setSelectedMember,
  targetManagerId,
  setTargetManagerId,
  onSuccess 
}: MemberSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const members = useQuery(api.users.listWithHierarchy) ?? [];
  const setUpline = useMutation(api.users.setUpline);

  const filteredMembers = members.filter(m => 
    !visibleMembers.some(vm => vm.id === m._id) && // Don't show members already on canvas
    (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirmConnection = () => {
    if (!selectedMember || !targetManagerId) return;
    const userId = (selectedMember._id || selectedMember.id) as Id<"users">;
    void (async () => {
      try {
        await setUpline({ userId, uplineId: targetManagerId as Id<"users"> });
        toast.success(`${selectedMember.name} connected to ${visibleMembers.find(m => m.id === targetManagerId)?.name}`);
        setSelectedMember(null);
        onSuccess?.();
      } catch (_err) {
        toast.error("Failed to connect member");
      }
    })();
  };

  return (
    <>
      <div 
        className={`fixed right-0 top-0 h-full bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] transition-all duration-300 z-50 flex flex-col ${
          isOpen ? "w-80" : "w-0"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -left-8 top-1/2 -translate-y-1/2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] border-r-0 p-1.5 rounded-l-xl shadow-lg hover:text-[hsl(var(--primary))] transition-colors"
        >
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {isOpen && (
          <>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Available Members</h2>
              <button onClick={onToggle} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-[hsl(var(--border))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                  No members found
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div 
                    key={member._id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/reactflow", JSON.stringify(member));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--secondary)/0.5)] transition-colors group cursor-grab active:cursor-grabbing"
                  >
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] shrink-0">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{member.name ?? "Anonymous"}</p>
                        {member.lastUplineId ? (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Broken</span>
                        ) : (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Unused</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{member.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setTargetManagerId(currentPivotId);
                      }}
                      className="p-1.5 rounded-md bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[hsl(var(--primary))] hover:text-white"
                      title="Connect member"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Connection Dialog */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1">Connect Member</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Choose a manager from the current canvas for <span className="text-[hsl(var(--foreground))] font-bold">{selectedMember.name}</span>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2 block">
                    Select Manager
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {visibleMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setTargetManagerId(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          targetManagerId === m.id 
                            ? "bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]" 
                            : "bg-[hsl(var(--secondary)/0.3)] border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground)/0.5)]"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold text-[10px]">
                          {getInitials(m.name)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold truncate">{m.name}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{m.role || "Member"}</p>
                        </div>
                        {targetManagerId === m.id && (
                          <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))] flex items-center gap-3">
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-bold hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConnection}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)]"
              >
                Confirm Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const getInitials = (name?: string) => {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};
