import { useState, useEffect, useMemo } from "react";
import { X, Copy, Check, ChevronLeft, UserRound, ArrowRight, Search, SortDesc, Calendar } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import bonchatLogo from "@/assets/brand/bonchat.png";
import yepbitLogo from "@/assets/brand/yepbit.png";

type Member = {
  id: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending" | "to-invite";
  bonchatId?: string;
  bonchatUsername?: string;
  yepbitId?: string;
  yepbitUsername?: string;
  createdAt?: number;
  updatedAt?: number;
};

type NetworkDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialTab?: "joined" | "invited" | "pending" | "to-invite";
};

export function NetworkDialog({ isOpen, onClose, members, initialTab = "joined" }: NetworkDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedMember(null);
      setIsClosing(false);
      setSearch("");
      setDisplayCount(10);
    }
  }, [isOpen, initialTab]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const filteredAndSortedMembers = useMemo(() => {
    let result = members.filter((m) => m.status === activeTab);
    
    if (search) {
      const needle = search.toLowerCase();
      result = result.filter((m) => 
        m.name.toLowerCase().includes(needle) || 
        m.roleTitle.toLowerCase().includes(needle)
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

    return result;
  }, [members, activeTab, search, sortBy]);

  const displayedMembers = filteredAndSortedMembers.slice(0, displayCount);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (displayCount < filteredAndSortedMembers.length) {
        setDisplayCount((prev) => prev + 10);
      }
    }
  };

  if (!isOpen && !isClosing) return null;

  const TABS = [
    { id: "joined", label: "Joined" },
    { id: "invited", label: "Invited" },
    { id: "pending", label: "Pending" },
    { id: "to-invite", label: "To Invite" },
  ] as const;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-[hsl(var(--background)/0.8)] backdrop-blur-md" onClick={handleClose} />
      
      <div className={`relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl transition-all duration-300 ${isClosing ? "scale-95 translate-y-4" : "scale-100 translate-y-0"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border)/0.5)] px-6 py-4">
          <div className="flex items-center gap-3">
            {selectedMember && (
              <button 
                onClick={() => setSelectedMember(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[hsl(var(--muted))]"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
              {selectedMember ? selectedMember.name : "Network Explorer"}
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="h-[600px] overflow-y-auto p-6" onScroll={handleScroll}>
          {!selectedMember ? (
            <div className="space-y-6">
              {/* Custom Tab Bar */}
              <div className="flex items-center gap-2 rounded-[20px] bg-[hsl(var(--muted)/0.5)] p-1.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setDisplayCount(10);
                    }}
                    className={`flex-1 rounded-[14px] py-2 text-[13px] font-black uppercase tracking-[0.1em] transition-all ${
                      activeTab === tab.id 
                        ? "bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm" 
                        : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search name or title..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-2xl bg-[hsl(var(--muted)/0.5)] pl-11 pr-4 text-sm outline-none transition-all focus:bg-[hsl(var(--muted))]"
                  />
                </div>
                <button 
                  onClick={() => setSortBy(prev => prev === "date" ? "name" : "date")}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  title={sortBy === "date" ? "Sorted by Date" : "Sorted by Name"}
                >
                  {sortBy === "date" ? <Calendar size={18} /> : <SortDesc size={18} />}
                </button>
              </div>

              {/* Members List - Single Column */}
              <div className="flex flex-col gap-2">
                {displayedMembers.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-[24px] border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                    <UserRound size={32} className="mb-3 opacity-20" />
                    <p className="text-sm">
                      {activeTab === "to-invite" ? "Open referral slots available" : "No members found"}
                    </p>
                  </div>
                ) : (
                  displayedMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="group flex items-center gap-4 rounded-[24px] border border-[hsl(var(--border)/0.6)] bg-[hsl(var(--card))] p-4 text-left transition-all hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.02)]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                        <UserRound size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[hsl(var(--foreground))]">{member.name}</p>
                        <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{member.roleTitle}</p>
                      </div>
                      <ArrowRight size={16} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1" />
                    </button>
                  ))
                )}
                {displayCount < filteredAndSortedMembers.length && (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {/* User Bio */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                  <UserRound size={40} />
                </div>
                <h3 className="mt-4 text-[24px] font-bold text-[hsl(var(--foreground))]">{selectedMember.name}</h3>
                <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))]">{selectedMember.roleTitle}</p>
              </div>

              {/* Social Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <SocialCard 
                  memberId={selectedMember.id}
                  logo={bonchatLogo} 
                  name="Bonchat" 
                  id={selectedMember.bonchatId ?? "N/A"} 
                  username={selectedMember.bonchatUsername ?? "N/A"} 
                  accentColor="#22C55E"
                  bgColor="bg-[#22C55E]"
                />
                <SocialCard 
                  memberId={selectedMember.id}
                  logo={yepbitLogo} 
                  name="Yepbit" 
                  id={selectedMember.yepbitId ?? "N/A"} 
                  username={selectedMember.yepbitUsername ?? "N/A"} 
                  accentColor="#1E3A8A"
                  bgColor="bg-[#1E3A8A]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialCard({ 
  memberId,
  logo, 
  name, 
  id, 
  username, 
  accentColor,
  bgColor
}: { 
  memberId: string;
  logo: string; 
  name: string; 
  id: string; 
  username: string;
  accentColor: string;
  bgColor: string;
}) {
  const updateSocial = useMutation(api.networkMembers.updateSocialIds);
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(username);
  const [currentId, setCurrentId] = useState(id);

  const handleCopy = (text: string) => {
    if (text === "N/A") return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success(`${name} ID copied`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleUpdate = async () => {
    try {
      await updateSocial({
        memberId: memberId as any,
        [name.toLowerCase() + "Username"]: currentUsername,
        [name.toLowerCase() + "Id"]: currentId,
      });
      toast.success(`${name} profile updated`);
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className={`rounded-[28px] ${bgColor} p-6 text-white shadow-xl shadow-[${accentColor}/0.2] transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt={name} className="h-8 w-8 object-contain" />
          <span className="text-[15px] font-black uppercase tracking-[0.15em] opacity-90">{name}</span>
        </div>
        <div className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Username</p>
          <div className="mt-1">
            {isEditingUsername ? (
              <input 
                autoFocus
                className="w-full bg-transparent text-[18px] font-bold text-white outline-none border-b border-white/30"
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                onBlur={() => {
                  setIsEditingUsername(false);
                  handleUpdate();
                }}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingUsername(false)}
              />
            ) : (
              <p 
                className="cursor-pointer text-[18px] font-bold text-white transition-opacity hover:opacity-80"
                onClick={() => setIsEditingUsername(true)}
              >
                {currentUsername === "N/A" ? "Click to set" : currentUsername}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">User ID</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {isEditingId ? (
                <input 
                  autoFocus
                  className="w-full bg-transparent font-mono text-[14px] text-white outline-none border-b border-white/30"
                  value={currentId}
                  onChange={(e) => setCurrentId(e.target.value)}
                  onBlur={() => {
                    setIsEditingId(false);
                    handleUpdate();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingId(false)}
                />
              ) : (
                <p 
                  className="truncate font-mono text-[14px] cursor-pointer hover:opacity-80"
                  onClick={() => setIsEditingId(true)}
                >
                  {currentId}
                </p>
              )}
            </div>
            <button 
              onClick={() => handleCopy(currentId)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90"
            >
              {copiedId ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
