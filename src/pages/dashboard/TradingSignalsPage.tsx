import { useState } from "react";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  CheckCircle2, 
  XCircle, 
  Star,
  ChevronRight,
  Shield,
  Search,
  Filter,
  Mail,
  Clipboard,
  Check
} from "lucide-react";
import { useMutation, useQuery, usePaginatedQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { DashboardPageHero } from "@/components/dashboard/FinancePageHelpers";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";

export function TradingSignalsPage() {
  const mobileStatus = useQuery(api.mobile.status);
  const isAdmin = mobileStatus?.isAdmin;
  
  if (mobileStatus === undefined) return null;

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {isAdmin ? <AdminSignalsView /> : <UserSignalsView />}
    </div>
  );
}

const TABS = [
  { key: "daily", label: "Daily Tracking" },
  { key: "access", label: "Access & Promotions" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const getLocalToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function AdminSignalsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const stats = useQuery(api.participation.getDailyStats, { date: selectedDate });

  return (
    <div className="space-y-10">
      <DashboardPageHero
        eyebrow="Admin"
        title="Signal Command Center"
        description="Monitor activity and track participant performance across all sessions."
        icon={Zap}
      />

      {/* Signal Performance Logs — full width */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Users" status="pending" value={stats?.totalUsers ?? 0} />
        <StatCard title="Success (Checked)" status="success" value={stats?.success ?? 0} />
        <StatCard title="Pending (Unchecked)" status="pending" value={stats?.pending ?? 0} />
        <StatCard title="Failed (Error)" status="error" value={stats?.error ?? 0} />
      </div>

      {/* Toolbar: Search (Left) & Tabs (Right) */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] h-4 w-4" />
              <input 
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 text-sm outline-none focus:border-[hsl(var(--primary))]"
              />
            </div>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 w-[140px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            />
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]">
              <Filter size={16} />
              Filter
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-2xl bg-[hsl(var(--muted)/0.4)] p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-xl px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] transition-all",
                  activeTab === tab.key
                    ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "daily" ? <DailyTrackingTable search={search} date={selectedDate} /> : <AccessPromotionTable search={search} />}
      </div>
    </div>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[hsl(var(--muted))]" />
              <div className="h-4 w-24 rounded-lg bg-[hsl(var(--muted))]" />
            </div>
          </td>
          {[...Array(cols - 1)].map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="mx-auto h-5 w-5 rounded-full bg-[hsl(var(--muted))]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Tab 1: Daily Tracking ── */
const SESSION_TIMES = ["3pm", "6pm", "8pm", "10pm"] as const;

function DailyTrackingTable({ search, date }: { search: string, date: string }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.participation.getDailyAttendance,
    { date, search },
    { initialNumItems: 10 }
  );
  const toggle = useMutation(api.participation.toggleAttendance);
  const [beepData, setBeepData] = useState<{ user: any; sessionTime: string } | null>(null);

  return (
    <div className="space-y-4">
      <SurfaceCard className="overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)] text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4 text-center">3 PM</th>
              <th className="px-6 py-4 text-center">6 PM</th>
              <th className="px-6 py-4 text-center">8 PM</th>
              <th className="px-6 py-4 text-center">10 PM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border)/0.3)]">
            {status === "LoadingFirstPage" ? (
              <TableRowSkeleton cols={5} />
            ) : results.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No users found.</td></tr>
            ) : (
              results.map((row) => (
                <tr key={String(row.userId)} className="transition-colors hover:bg-[hsl(var(--muted)/0.2)] group/row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[10px] font-black text-[hsl(var(--primary))] uppercase">
                        {row.userName.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{row.userName}</span>
                    </div>
                  </td>
                  {SESSION_TIMES.map((time) => (
                    <td key={time} className="px-6 py-4 text-center group/cell relative">
                      <div className="flex justify-center items-center h-full">
                        <button
                          onClick={() => toggle({ userId: row.userId as any, date, sessionTime: time, attended: !row.sessions[time] })}
                          className="flex justify-center"
                        >
                          {row.sessions[time]
                            ? <CheckCircle2 size={20} className="text-green-500" />
                            : <XCircle size={20} className="text-[hsl(var(--muted-foreground)/0.3)] hover:text-[hsl(var(--muted-foreground))]" />}
                        </button>
                        <button 
                          onClick={() => setBeepData({ user: row, sessionTime: time })}
                          className="absolute right-2 opacity-0 group-hover/cell:opacity-100 transition-opacity p-1.5 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.2)]"
                          title="Beep user"
                        >
                          <Mail size={14} />
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {status === "LoadingMore" && (
          <div className="px-6 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading more...</div>
        )}
        
        {status === "CanLoadMore" && (
          <div className="p-4 border-t border-[hsl(var(--border)/0.5)] flex justify-center">
            <button 
              onClick={() => loadMore(10)}
              className="text-xs font-black uppercase tracking-widest text-[hsl(var(--primary))] hover:underline"
            >
              Load More Users
            </button>
          </div>
        )}
      </SurfaceCard>

      {beepData && (
        <BeepUserDialog 
          user={beepData.user} 
          sessionTime={beepData.sessionTime} 
          onClose={() => setBeepData(null)} 
        />
      )}
    </div>
  );
}

function BeepUserDialog({ user, sessionTime, onClose }: { user: any, sessionTime: string, onClose: () => void }) {
  const sendEmail = useAction(api.email.sendEmail);
  const [message, setMessage] = useState(`Just a message for beeping ${user.userName} about the ${sessionTime} session.`);
  const [signalCode, setSignalCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSignalCode(text);
      setIsPasted(true);
      setTimeout(() => setIsPasted(false), 1500); // Reset icon after 1.5s
    } catch (err) {
      toast.error("Failed to read clipboard");
    }
  };

  const handleSend = async () => {
    if (!user.email) {
      toast.error(`${user.userName} does not have an email address.`);
      return;
    }
    
    setIsSending(true);
    try {
      await sendEmail({
        to: user.email,
        subject: `Notification for ${sessionTime} Trading Session`,
        text: message,
        signalCode: signalCode.trim() !== "" ? signalCode : undefined,
      });
      toast.success(`Message sent to ${user.userName}`);
      onClose();
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-[24px] bg-[hsl(var(--background))] p-6 shadow-2xl border border-[hsl(var(--border))] animate-in zoom-in-95">
        <h3 className="mb-2 text-xl font-black tracking-tight text-[hsl(var(--foreground))]">
          Beep {user.userName}
        </h3>
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          Send an email notification regarding the {sessionTime} session.
        </p>
        
        <div className="mb-4">
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-3 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
            placeholder="Type your message here..."
          />
        </div>

        <div className="mb-6 relative">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Optional Signal Code
          </label>
          <div className="relative">
            <input 
              type="text"
              value={signalCode}
              onChange={(e) => setSignalCode(e.target.value)}
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-4 pr-10 text-sm font-mono outline-none focus:border-[hsl(var(--primary))]"
              placeholder="e.g. 1A2B3C"
            />
            <button 
              onClick={handlePaste}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] rounded-lg transition-colors"
              title="Paste from clipboard"
            >
              {isPasted ? <Check size={16} className="text-green-500" /> : <Clipboard size={16} />}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            disabled={isSending}
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-bold text-white hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 2: Access & Promotions ── */
const TIER_OPTIONS = ["free", "silver", "gold"] as const;

function AccessPromotionTable({ search }: { search: string }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.participation.listUserTiers,
    { search },
    { initialNumItems: 10 }
  );
  const promote = useMutation(api.participation.promoteUserTier);

  return (
    <div className="space-y-4">
      <SurfaceCard className="overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)] text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Current Tier</th>
              <th className="px-6 py-4">Promoted Date</th>
              <th className="px-6 py-4 text-right">Promote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border)/0.3)]">
            {status === "LoadingFirstPage" ? (
              <TableRowSkeleton cols={4} />
            ) : results.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No users found.</td></tr>
            ) : (
              results.map((row) => {
                const tierColor = row.tier === "gold"
                  ? "text-yellow-500 bg-yellow-500/10"
                  : row.tier === "silver"
                    ? "text-blue-400 bg-blue-400/10"
                    : "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]";
                return (
                  <tr key={String(row.profileId)} className="transition-colors hover:bg-[hsl(var(--muted)/0.2)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[10px] font-black text-[hsl(var(--primary))] uppercase">
                          {row.userName.charAt(0)}
                        </div>
                        <span className="font-bold text-sm">{row.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider", tierColor)}>
                        <Shield size={12} />
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                      {row.promotedAt ? new Date(row.promotedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={row.tier}
                        onChange={(e) => promote({ profileId: row.profileId as any, tier: e.target.value as any })}
                        className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
                      >
                        {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {status === "LoadingMore" && (
          <div className="px-6 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading more...</div>
        )}
        
        {status === "CanLoadMore" && (
          <div className="p-4 border-t border-[hsl(var(--border)/0.5)] flex justify-center">
            <button 
              onClick={() => loadMore(10)}
              className="text-xs font-black uppercase tracking-widest text-[hsl(var(--primary))] hover:underline"
            >
              Load More Users
            </button>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}



function StatCard({ title, value, status }: { title: string; value: number | string; status: "success" | "error" | "pending" | "default" }) {
  const accent = status === "success"
    ? "text-green-500"
    : status === "error"
      ? "text-red-500"
      : "text-[hsl(var(--foreground))]";
      
  return (
    <SurfaceCard className="rounded-[30px] p-[18px]">
      <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">{title}</p>
      <p className={`mt-3 text-[40px] leading-none font-bold tabular-nums ${accent}`}>{value}</p>
    </SurfaceCard>
  );
}




function UserSignalsView() {
  const featured = useQuery(api.signals.getFeatured);
  const activeSignals = useQuery(api.signals.listActive);
  const schedules = useQuery(api.schedules.list);
  const milestones = useQuery(api.milestones.list);
  const [activeTab, setActiveTab] = useState<"live" | "history" | "schedule" | "milestones">("live");
  
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">Trading Signals</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">Real-time alerts from our expert analysts.</p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-[hsl(var(--muted)/0.4)] p-1 w-fit">
          {["live", "history", "schedule", "milestones"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all",
                activeTab === tab
                  ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "live" && (
        <div className="space-y-10">
          {featured && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                <h2 className="text-xl font-bold uppercase tracking-tight">Signal of the Week</h2>
              </div>
              <FeaturedSignalCard signal={featured} />
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Live Alerts</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{activeSignals?.length ?? 0} Active</span>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeSignals?.map(signal => (
                <UserSignalCard key={signal._id} signal={signal} />
              ))}
              {activeSignals?.length === 0 && (
                <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-[32px] border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                  <Zap size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold">Scanning for opportunities...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && <SignalHistoryView />}
      
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-[hsl(var(--primary))]" />
              Signal Drop Schedule
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schedules?.map(s => (
              <SessionCard 
                key={s._id} 
                time={s.time} 
                label={s.title} 
                description={`Analyst: ${s.analystName} • ${s.timezone}`} 
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-tight">Milestone Progression</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {milestones?.map((m, idx) => (
              <SurfaceCard key={m._id} className="relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[hsl(var(--primary))]" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-black">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{m.title}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{m.description}</p>
                    <div className="mt-4 flex gap-2">
                      <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
                        {m.requiredSignals} SIGNALS
                      </span>
                      {m.requiredWinRate && (
                        <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
                          {m.requiredWinRate}% WIN RATE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SignalHistoryView() {
  const history = useQuery(api.signals.listHistory, { limit: 50 });
  
  return (
    <SurfaceCard className="p-0 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)] text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            <th className="px-6 py-4">Signal</th>
            <th className="px-6 py-4">Result</th>
            <th className="px-6 py-4">Pips</th>
            <th className="px-6 py-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border)/0.3)]">
          {history?.map(s => (
            <tr key={s._id} className="hover:bg-[hsl(var(--muted)/0.1)] transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold">{s.symbol} <span className="text-[10px] opacity-60 ml-1">{s.type.toUpperCase()}</span></div>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                  s.status === "tp_hit" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {s.status === "tp_hit" ? "WIN" : "LOSS"}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-sm">{s.result ?? "—"}</td>
              <td className="px-6 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                {new Date(s.closedAt ?? s.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SurfaceCard>
  );
}

function FeaturedSignalCard({ signal }: any) {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(221_83%_45%))] p-8 text-white shadow-2xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black shadow-inner", signal.type === "buy" ? "text-green-300" : "text-red-300")}>
              {signal.type === "buy" ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-black">{signal.symbol}</h3>
                <span className="rounded-full bg-yellow-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">FEATURED</span>
              </div>
              <p className="text-blue-100/80 font-bold uppercase tracking-widest text-[11px]">{signal.strategy} • {signal.timeframe} Chart</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <LevelDisplay label="Entry" value={signal.entry} />
            <LevelDisplay label="Target 1" value={signal.tp1} isSuccess />
            {signal.tp2 && <LevelDisplay label="Target 2" value={signal.tp2} isSuccess />}
            <LevelDisplay label="Stop Loss" value={signal.sl} isError />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:w-64">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`Symbol: ${signal.symbol}\nType: ${signal.type}\nEntry: ${signal.entry}\nTP1: ${signal.tp1}\nSL: ${signal.sl}`);
              toast.success("Signal copied to clipboard!");
            }}
            className="w-full rounded-2xl bg-white px-6 py-4 text-[15px] font-black text-[hsl(var(--primary))] shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            COPY SETUP
          </button>
          <p className="text-center text-[10px] font-bold text-blue-100/60 uppercase tracking-widest">Post date: {new Date(signal.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

function UserSignalCard({ signal }: any) {
  const isBuy = signal.type === "buy";
  
  return (
    <div className="group relative flex flex-col rounded-[32px] border border-[hsl(var(--border)/0.6)] bg-[hsl(var(--card))] p-6 transition-all hover:border-[hsl(var(--primary)/0.3)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.05)]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isBuy ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
            {isBuy ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div>
            <h4 className="font-black text-lg">{signal.symbol}</h4>
            <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{signal.timeframe} • {signal.strategy}</p>
          </div>
        </div>
        <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[hsl(var(--muted)/0.3)] p-3">
            <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Entry</p>
            <p className="font-mono text-sm font-bold">{signal.entry}</p>
          </div>
          <div className="rounded-2xl bg-[hsl(var(--muted)/0.3)] p-3">
            <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Target</p>
            <p className="font-mono text-sm font-bold text-green-500">{signal.tp1}</p>
          </div>
        </div>
        
        <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-3">
          <p className="text-[9px] font-black text-red-500/60 uppercase tracking-wider mb-1">Stop Loss</p>
          <p className="font-mono text-sm font-bold text-red-500">{signal.sl}</p>
        </div>
      </div>

      <button 
        onClick={() => {
          navigator.clipboard.writeText(`${signal.symbol} ${signal.type.toUpperCase()} @ ${signal.entry}`);
          toast.success("Entry copied");
        }}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-xs font-black uppercase tracking-widest transition-all hover:bg-[hsl(var(--primary))] hover:text-white hover:border-transparent group-hover:bg-[hsl(var(--primary))] group-hover:text-white"
      >
        Copy Signal
      </button>
    </div>
  );
}

function LevelDisplay({ label, value, isSuccess, isError }: any) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/5">
      <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn("font-mono text-lg font-black", isSuccess ? "text-green-300" : isError ? "text-red-300" : "text-white")}>
        {value}
      </p>
    </div>
  );
}

function SessionCard({ time, label, description }: any) {
  return (
    <div className="flex items-center gap-6 rounded-[32px] border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card))] p-6 shadow-sm transition-all hover:border-[hsl(var(--primary)/0.2)]">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
        <Clock size={32} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-black text-[hsl(var(--foreground))]">{time}</p>
        <p className="font-bold text-sm text-[hsl(var(--foreground))]">{label}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      <ChevronRight size={24} className="text-[hsl(var(--muted-foreground))] opacity-20" />
    </div>
  );
}
