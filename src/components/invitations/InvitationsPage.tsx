import { useState } from "react";
import { Mail, Plus, Copy, Trash2, Clock, CheckCircle, X, RotateCcw, AlertTriangle } from "lucide-react";

type InviteStatus = "pending" | "accepted" | "expired";

interface Invite {
  id: string;
  email: string;
  status: InviteStatus;
  sentAt: string;
  link: string;
}

const DUMMY_INVITES: Invite[] = [
  { id: "inv-1", email: "marcos.reyes@gmail.com", status: "pending", sentAt: "2026-04-28", link: "https://luxurious.trade/invite/abc123" },
  { id: "inv-2", email: "lucia.gomez@yahoo.com", status: "accepted", sentAt: "2026-04-20", link: "https://luxurious.trade/invite/def456" },
  { id: "inv-3", email: "pedro.santos@gmail.com", status: "expired", sentAt: "2026-04-01", link: "https://luxurious.trade/invite/ghi789" },
  { id: "inv-4", email: "carla.navarro@outlook.com", status: "pending", sentAt: "2026-04-29", link: "https://luxurious.trade/invite/jkl012" },
];

const STATUS_STYLES: Record<InviteStatus, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  pending: { bg: "hsl(37 92% 50% / 0.12)", text: "hsl(37 92% 40%)", icon: Clock, label: "Pending" },
  accepted: { bg: "hsl(152 69% 42% / 0.12)", text: "hsl(152 69% 35%)", icon: CheckCircle, label: "Accepted" },
  expired: { bg: "hsl(0 84% 61% / 0.12)", text: "hsl(0 84% 50%)", icon: X, label: "Expired" },
};

function RevokeDialog({ onClose, onConfirm, email }: { onClose: () => void; onConfirm: () => void; email: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[hsl(var(--card))] p-6 shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-2">Revoke Invitation?</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          This will invalidate the link for <span className="font-bold text-[hsl(var(--foreground))]">{email}</span>. They will no longer be able to join.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ onClose, onSend }: { onClose: () => void; onSend: (email: string) => void }) {
  const [email, setEmail] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onSend(email.trim());
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 pb-8 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Invite Member</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Send an invitation link via email</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={(e) => { void submit(e); }} className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] block mb-1.5">
              Email Address
            </label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="member@email.com" autoFocus
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] transition-all" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))", boxShadow: "0 4px 16px hsl(43 96% 48% / 0.3)" }}>
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>(DUMMY_INVITES);
  const [showModal, setShowModal] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  function handleSend(email: string) {
    const newInvite: Invite = {
      id: `inv-${Date.now()}`,
      email,
      status: "pending",
      sentAt: new Date().toISOString().slice(0, 10),
      link: `https://luxurious.trade/invite/${Math.random().toString(36).slice(2, 8)}`,
    };
    setInvites((prev) => [newInvite, ...prev]);
    setShowModal(false);
  }

  function handleCopy(link: string, id: string) {
    void navigator.clipboard.writeText(link).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleResend(id: string) {
    setResending(id);
    setTimeout(() => {
      setResending(null);
    }, 1500);
  }

  function handleConfirmRevoke() {
    if (revokeId) {
      setInvites((prev) => prev.filter((inv) => inv.id !== revokeId));
      setRevokeId(null);
    }
  }

  const counts = { pending: invites.filter((i) => i.status === "pending").length, accepted: invites.filter((i) => i.status === "accepted").length, expired: invites.filter((i) => i.status === "expired").length };

  return (
    <div className="p-6 space-y-5">
      {showModal && <InviteModal onClose={() => setShowModal(false)} onSend={handleSend} />}
      {revokeId && (
        <RevokeDialog 
          email={invites.find(i => i.id === revokeId)?.email ?? ""} 
          onClose={() => setRevokeId(null)} 
          onConfirm={handleConfirmRevoke} 
        />
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Manage Invitations</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Invite new members by sending them a secure link.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-[0_4px_16px_hsl(43_96%_48%/0.3)]"
          style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))" }}>
          <Plus size={15} /> Invite Member
        </button>
      </div>

      {/* Count chips */}
      <div className="flex flex-wrap gap-3">
        {(["pending", "accepted", "expired"] as InviteStatus[]).map((s) => {
          const st = STATUS_STYLES[s];
          const Icon = st.icon;
          return (
            <div key={s} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: st.bg }}>
                <Icon size={12} style={{ color: st.text }} />
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: st.text }}>{counts[s]}</span>
              <span className="text-[11px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{s}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))] overflow-hidden shadow-sm">
        {invites.length === 0 && (
          <div className="py-16 text-center text-[hsl(var(--muted-foreground))]">
            <Mail size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No invitations sent yet.</p>
          </div>
        )}
        {invites.map((inv) => {
          const st = STATUS_STYLES[inv.status];
          const Icon = st.icon;
          return (
            <div key={inv.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-[hsl(var(--muted)/0.2)] transition-colors group">
              <div className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center shrink-0 border border-transparent group-hover:border-[hsl(var(--border))] transition-all" style={{ background: st.bg }}>
                <Mail size={16} style={{ color: st.text }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">{inv.email}</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border" style={{ background: st.bg, color: st.text, borderColor: `${st.text}20` }}>
                    <Icon size={10} />{st.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] truncate font-mono bg-[hsl(var(--muted)/0.5)] px-1.5 py-0.5 rounded">{inv.link}</p>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 w-28 pr-4 border-r border-[hsl(var(--border))] mr-2">
                <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-tight">Sent Date</span>
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{inv.sentAt}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleCopy(inv.link, inv.id)} title="Copy link"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all active:scale-90">
                  {copied === inv.id ? <CheckCircle size={15} style={{ color: "hsl(152 69% 42%)" }} /> : <Copy size={15} />}
                </button>
                {inv.status !== "accepted" && (
                  <button onClick={() => handleResend(inv.id)} title="Resend link"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all active:scale-90">
                    <RotateCcw size={15} className={resending === inv.id ? "animate-spin text-[hsl(var(--primary))]" : ""} />
                  </button>
                )}
                {inv.status === "pending" && (
                  <button onClick={() => setRevokeId(inv.id)} title="Revoke"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
