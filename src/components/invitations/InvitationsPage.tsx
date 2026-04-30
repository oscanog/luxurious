import { useState } from "react";
import { Mail, Plus, Copy, Trash2, Clock, CheckCircle, X } from "lucide-react";

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

function InviteModal({ onClose, onSend }: { onClose: () => void; onSend: (email: string) => void }) {
  const [email, setEmail] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onSend(email.trim());
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
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
        <form onSubmit={submit} className="space-y-4">
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
  const [copied, setCopied] = useState<string | null>(null);

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
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleRevoke(id: string) {
    setInvites((prev) => prev.filter((inv) => inv.id !== id));
  }

  const counts = { pending: invites.filter((i) => i.status === "pending").length, accepted: invites.filter((i) => i.status === "accepted").length, expired: invites.filter((i) => i.status === "expired").length };

  return (
    <div className="p-6 space-y-5">
      {showModal && <InviteModal onClose={() => setShowModal(false)} onSend={handleSend} />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Manage Invitations</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Invite new members by sending them a secure link.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))", boxShadow: "0 4px 16px hsl(43 96% 48% / 0.3)" }}>
          <Plus size={15} /> Invite Member
        </button>
      </div>

      {/* Count chips */}
      <div className="flex gap-3">
        {(["pending", "accepted", "expired"] as InviteStatus[]).map((s) => {
          const st = STATUS_STYLES[s];
          const Icon = st.icon;
          return (
            <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <Icon size={13} style={{ color: st.text }} />
              <span className="text-xs font-bold" style={{ color: st.text }}>{counts[s]}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{s}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))] overflow-hidden">
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
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.bg }}>
                <Mail size={15} style={{ color: st.text }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{inv.email}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate font-mono">{inv.link}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0" style={{ background: st.bg, color: st.text }}>
                <Icon size={10} />{st.label}
              </span>
              <p className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 w-24 text-right">{inv.sentAt}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleCopy(inv.link, inv.id)} title="Copy link"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors">
                  {copied === inv.id ? <CheckCircle size={14} style={{ color: "hsl(152 69% 42%)" }} /> : <Copy size={14} />}
                </button>
                {inv.status === "pending" && (
                  <button onClick={() => handleRevoke(inv.id)} title="Revoke"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
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
