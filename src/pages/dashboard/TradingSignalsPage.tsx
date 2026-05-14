import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Star,
  ChevronRight
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { DashboardPageHero, DashboardSectionTitle } from "@/components/dashboard/FinancePageHelpers";
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

function AdminSignalsView() {
  return (
    <div className="space-y-10">
      <DashboardPageHero
        eyebrow="Admin"
        title="Signal Command Center"
        description="Monitor activity and track participant performance across all sessions."
        icon={Zap}
      />

      {/* 2. Signal Activity Logs */}
      <div className="space-y-6">
        <DashboardSectionTitle 
          eyebrow="Activity"
          title="Signal Performance Logs"
        />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <SignalCodeCard code="29" status="success" count={12} />
          <SignalCodeCard code="30" status="error" count={5} />
          <SignalCodeCard code="31" status="success" count={18} />
          <SignalCodeCard code="32" status="pending" count={0} />
        </div>
      </div>

      {/* 3. User Attendance Tracking Table */}
      <div className="space-y-6">
        <DashboardSectionTitle 
          eyebrow="Tracking"
          title="User Session Attendance"
        />
        <SurfaceCard className="overflow-hidden p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)] text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 text-center">3 PM</th>
                <th className="px-6 py-4 text-center">6 PM</th>
                <th className="px-6 py-4 text-center">8 PM</th>
                <th className="px-6 py-4 text-center">10 PM</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border)/0.3)]">
              <AttendanceRow name="User 1" attendance={{ "3pm": true, "6pm": false, "8pm": false, "10pm": false }} />
              <AttendanceRow name="User 2" attendance={{ "3pm": true, "6pm": true, "8pm": false, "10pm": false }} />
              <AttendanceRow name="User 3" attendance={{ "3pm": false, "6pm": false, "8pm": false, "10pm": false }} />
            </tbody>
          </table>
        </SurfaceCard>
      </div>
    </div>
  );
}

function AttendanceRow({ name, attendance }: any) {
  return (
    <tr className="group transition-colors hover:bg-[hsl(var(--muted)/0.2)]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[10px] font-black text-[hsl(var(--primary))] uppercase">
            {name.charAt(0)}
          </div>
          <span className="font-bold text-sm">{name}</span>
        </div>
      </td>
      {["3pm", "6pm", "8pm", "10pm"].map((time) => (
        <td key={time} className="px-6 py-4 text-center">
          <div className="flex justify-center">
            {attendance[time] ? (
              <CheckCircle2 size={18} className="text-green-500" />
            ) : (
              <XCircle size={18} className="text-[hsl(var(--muted-foreground)/0.3)]" />
            )}
          </div>
        </td>
      ))}
      <td className="px-6 py-4 text-right">
        <button className="p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
          <Plus size={16} />
        </button>
      </td>
    </tr>
  );
}

function SignalCodeCard({ code, status, count }: any) {
  return (
    <SurfaceCard className="group flex flex-col items-center justify-center p-6 transition-all hover:scale-[1.02]">
      <span className="text-3xl font-black text-[hsl(var(--foreground))] mb-3">{code}</span>
      <div className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", 
        status === "success" ? "bg-green-500/10 text-green-500" : 
        status === "error" ? "bg-red-500/10 text-red-500" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
      )}>
        {status === "success" ? `${count} Success` : status === "error" ? `${count} Error` : "Pending"}
      </div>
    </SurfaceCard>
  );
}




function UserSignalsView() {
  const featured = useQuery(api.signals.getFeatured);
  const activeSignals = useQuery(api.signals.listActive);
  
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">Trading Signals</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Real-time alerts from our expert analysts.</p>
      </div>

      {/* Session Drops Schedule - Boss Request */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Clock size={20} className="text-[hsl(var(--primary))]" />
            Today's Signal Drops
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">UTC+8 TIMEZONE</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SessionCard time="3:00 PM" label="London Session Drop" description="Focus on GBP/EUR pairs" />
          <SessionCard time="8:00 PM" label="New York Session Drop" description="Focus on USD/GOLD pairs" />
        </div>
      </div>

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
