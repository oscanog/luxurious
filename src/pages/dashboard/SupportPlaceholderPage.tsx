import { useMutation, useQuery } from "convex/react";
import { LifeBuoy, MessageSquare, Book, FileText, Send, Clock, CheckCircle2, AlertCircle, Plus, MoreHorizontal } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function PlaceholderSupportPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const tickets = useQuery(api.support.getTickets);
  const createTicket = useMutation(api.support.createTicket);
  
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    try {
      await createTicket({ subject, message, priority });
      setSubject("");
      setMessage("");
      setShowForm(false);
      toast.success("Ticket submitted successfully");
    } catch {
      toast.error("Failed to submit ticket");
    }
  }

  if (tickets === undefined) {
    return (
      <DashboardPageShell>
        <DashboardPageHero eyebrow={eyebrow} title={title} description={description} icon={LifeBuoy} />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={LifeBuoy}
        badges={[
          { label: `${tickets.length} total tickets`, tone: "neutral" },
          { label: "Live Support", tone: "success" },
        ]}
        metrics={[
          { label: "Active", value: tickets.filter((t: any) => t.status === "open").length, tone: "warning" },
          { label: "Resolved", value: tickets.filter((t: any) => t.status === "resolved").length, tone: "success" },
          { label: "Avg Response", value: "2h" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Book, label: "Knowledge Base", desc: "Guides and tutorials", count: "124" },
              { icon: FileText, label: "API Docs", desc: "Integrate with our platform", count: "v2.1" },
              { icon: MessageSquare, label: "Community", desc: "Join our discord server", count: "Live" },
            ].map(card => (
              <SurfaceCard key={card.label} className="p-5 group cursor-pointer hover:border-[hsl(var(--primary)/0.5)] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] mb-4 group-hover:scale-110 transition-transform">
                  <card.icon size={20} />
                </div>
                <h4 className="text-sm font-bold text-[hsl(var(--foreground))]">{card.label}</h4>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{card.desc}</p>
                <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  <span>Explore</span>
                  <span className="text-[hsl(var(--primary))]">{card.count}</span>
                </div>
              </SurfaceCard>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Support Tickets</h3>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[hsl(var(--primary)/0.2)] hover:scale-105 active:scale-95 transition-all">
                <Plus size={12} /> {showForm ? "Cancel" : "New Ticket"}
              </button>
            </div>

            {showForm && (
              <SurfaceCard className="p-6 animate-in slide-in-from-top-4 duration-300">
                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5 block">Subject</label>
                      <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                        className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5 block">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value as any)}
                        className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-[hsl(var(--primary))]">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5 block">Description</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3}
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[hsl(var(--primary))] resize-none" />
                  </div>
                  <button type="submit"
                    className="w-full py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white font-black text-xs shadow-lg shadow-[hsl(var(--primary)/0.2)] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Send size={14} /> SUBMIT TICKET
                  </button>
                </form>
              </SurfaceCard>
            )}

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))] overflow-hidden shadow-sm">
              {tickets.length === 0 ? (
                <div className="p-16 text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">No active tickets</p>
                </div>
              ) : (
                tickets.map((t: any) => (
                  <div key={t._id} className="p-5 hover:bg-[hsl(var(--muted)/0.1)] transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-[hsl(var(--foreground))] truncate">{t.subject}</h4>
                          <ToneBadge tone={t.status === "resolved" ? "success" : t.status === "open" ? "warning" : "neutral"}>
                            {t.status}
                          </ToneBadge>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">{t.message}</p>
                        <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            <AlertCircle size={10} className={t.priority === 'high' ? 'text-red-500' : ''} /> {t.priority} priority
                          </span>
                        </div>
                      </div>
                      <button className="w-9 h-9 rounded-xl flex items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-all active:scale-90 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <DashboardMetricCard 
            label="Service Status" 
            value="Operational" 
            hint="All systems are green." 
          />
          
          <SurfaceCard className="p-6">
            <DashboardSectionTitle
              eyebrow="Direct Support"
              title="Speak to an agent"
              description="Our support team is available Mon-Fri, 9am - 6pm UTC."
            />
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <LifeBuoy size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Email</p>
                  <p className="text-xs font-bold text-[hsl(var(--foreground))]">support@luxurious.trade</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Live Chat</p>
                  <p className="text-xs font-bold text-[hsl(var(--foreground))] text-green-500">Agent Online</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 rounded-xl border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] text-xs font-black uppercase tracking-widest hover:bg-[hsl(var(--primary)/0.05)] transition-all">
              Start Live Chat
            </button>
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
