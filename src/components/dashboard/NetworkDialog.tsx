import { useState, useEffect } from "react";
import { X, Copy, Check, ChevronLeft, UserRound, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import bonchatLogo from "@/assets/brand/bonchat.png";
import yepbitLogo from "@/assets/brand/yepbit.png";

type Member = {
  id: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending";
  bonchatId?: string;
  bonchatUsername?: string;
  yepbitId?: string;
  yepbitUsername?: string;
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

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedMember(null);
      setIsClosing(false);
    }
  }, [isOpen, initialTab]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !isClosing) return null;

  const filteredMembers = members.filter((m) => m.status === activeTab);

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
        <div className="h-[500px] overflow-y-auto p-6">
          {!selectedMember ? (
            <div className="space-y-6">
              {/* Custom Tab Bar */}
              <div className="flex items-center gap-2 rounded-[20px] bg-[hsl(var(--muted)/0.5)] p-1.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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

              {/* Members List */}
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredMembers.length === 0 ? (
                  <div className="col-span-2 flex h-40 flex-col items-center justify-center rounded-[24px] border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                    <UserRound size={32} className="mb-3 opacity-20" />
                    <p className="text-sm">
                      {activeTab === "to-invite" ? "Open referral slots available" : "No members found in this category"}
                    </p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
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
                <div className="mt-3 inline-flex rounded-full bg-[hsl(var(--primary)/0.08)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[hsl(var(--primary))]">
                  {selectedMember.status}
                </div>
              </div>

              {/* Social Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <SocialCard 
                  logo={bonchatLogo} 
                  name="Bonchat" 
                  id={selectedMember.bonchatId ?? "N/A"} 
                  username={selectedMember.bonchatUsername ?? "N/A"} 
                  accentColor="#1E3A8A"
                />
                <SocialCard 
                  logo={yepbitLogo} 
                  name="Yepbit" 
                  id={selectedMember.yepbitId ?? "N/A"} 
                  username={selectedMember.yepbitUsername ?? "N/A"} 
                  accentColor="#D4AF37"
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
  logo, 
  name, 
  id, 
  username, 
  accentColor 
}: { 
  logo: string; 
  name: string; 
  id: string; 
  username: string;
  accentColor: string;
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(username);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success(`${name} ID copied`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="rounded-[28px] border border-[hsl(var(--border)/0.6)] bg-[hsl(var(--card))] p-5 transition-all hover:shadow-lg">
      <div className="flex items-center gap-3">
        <img src={logo} alt={name} className="h-8 w-8 object-contain" />
        <span className="text-[15px] font-black uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]" style={{ color: accentColor }}>{name}</span>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">Username</p>
          {isEditing ? (
            <input 
              autoFocus
              className="mt-1 w-full bg-transparent text-[16px] font-bold text-[hsl(var(--foreground))] outline-none border-b border-[hsl(var(--primary))]"
              value={currentUsername}
              onChange={(e) => setCurrentUsername(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            />
          ) : (
            <p 
              className="mt-1 cursor-pointer text-[16px] font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
              onClick={() => setIsEditing(true)}
            >
              {currentUsername}
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">User ID</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate font-mono text-[13px] text-[hsl(var(--foreground)/0.7)]">{id}</p>
            <button 
              onClick={() => handleCopy(id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]"
            >
              {copiedId ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
