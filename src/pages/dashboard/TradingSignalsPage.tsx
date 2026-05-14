import { useState } from "react";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Star,
  Target,
  Play,
  X
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function TradingSignalsPage() {
  const mobileStatus = useQuery(api.mobile.status);
  const isAdmin = mobileStatus?.isAdmin;
  
  if (mobileStatus === undefined) return null;

  return (
    <div className="flex flex-col gap-8 p-6 pb-20 sm:p-8 lg:p-10">
      {isAdmin ? <AdminSignalsView /> : <UserSignalsView />}
    </div>
  );
}

function AdminSignalsView() {
  const stats = useQuery(api.signals.getStats);
  const featured = useQuery(api.signals.getFeatured);
  const activeSignals = useQuery(api.signals.listActive);
  const history = useQuery(api.signals.listHistory, { limit: 10 });
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">Signal Command Center</h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))]">Manage real-time trading alerts and performance.</p>
          </div>
          
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard 
              label="Win Rate" 
              value={`${stats?.winRate ?? 0}%`} 
              icon={Target} 
              trend="+2.4%" 
              color="text-green-500"
            />
            <StatCard 
              label="Active Signals" 
              value={stats?.activeCount ?? 0} 
              icon={Play} 
              color="text-blue-500"
            />
            <StatCard 
              label="Monthly Pips" 
              value={stats?.totalPips ?? 0} 
              icon={TrendingUp} 
              color="text-[hsl(var(--primary))]"
            />
            <StatCard 
              label="Featured" 
              value={featured ? featured.symbol : "None"} 
              icon={Star} 
              color="text-yellow-500"
            />
          </div>
        </div>

        <button 
          onClick={() => setIsCreating(true)}
          className="flex h-14 items-center gap-3 rounded-2xl bg-[hsl(var(--primary))] px-8 text-[15px] font-black text-white shadow-[0_16px_32px_-12px_hsl(var(--primary)/0.5)] transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus size={20} />
          POST NEW SIGNAL
        </button>
      </div>

      {isCreating && <SignalForm onCancel={() => setIsCreating(false)} />}

      {/* Main Tables */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play size={20} className="text-green-500" />
              Active Signals
            </h2>
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-500">
              {activeSignals?.length ?? 0} LIVE
            </span>
          </div>
          
          <div className="overflow-hidden rounded-[32px] border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card))] shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)] text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Entry / Targets</th>
                  <th className="px-6 py-4">RR</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border)/0.3)]">
                {activeSignals?.map(signal => (
                  <ActiveSignalRow key={signal._id} signal={signal} />
                ))}
                {activeSignals?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                      No active signals. Time to find a setup!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-[hsl(var(--muted-foreground))]" />
              Recent History
            </h2>
            <button className="text-[11px] font-black uppercase tracking-wider text-[hsl(var(--primary))] hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            {history?.map(signal => (
              <HistoryCard key={signal._id} signal={signal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card))] p-5 shadow-sm transition-all hover:border-[hsl(var(--primary)/0.2)] hover:shadow-md">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-current/10", color)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[hsl(var(--foreground))]">{value}</span>
          {trend && <span className="text-[11px] font-bold text-green-500">{trend}</span>}
        </div>
      </div>
    </div>
  );
}

function SignalForm({ onCancel }: { onCancel: () => void }) {
  const createSignal = useMutation(api.signals.create);
  const [formData, setFormData] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    entry: "",
    tp1: "",
    tp2: "",
    tp3: "",
    sl: "",
    timeframe: "1H",
    strategy: "",
    notes: "",
    tier: "free" as "free" | "silver" | "gold",
    isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSignal({
        ...formData,
        entry: parseFloat(formData.entry),
        tp1: parseFloat(formData.tp1),
        tp2: formData.tp2 ? parseFloat(formData.tp2) : undefined,
        tp3: formData.tp3 ? parseFloat(formData.tp3) : undefined,
        sl: parseFloat(formData.sl),
      } as any);
      toast.success("Signal posted successfully!");
      onCancel();
    } catch (err) {
      toast.error("Failed to post signal");
    }
  };

  return (
    <div className="rounded-[32px] border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.03)] p-8 animate-in slide-in-from-top-4 duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Post New Trading Alert</h2>
        <button onClick={onCancel} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Symbol</label>
          <input 
            required
            className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 font-bold"
            placeholder="e.g. BTC/USDT"
            value={formData.symbol}
            onChange={e => setFormData({...formData, symbol: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Type</label>
          <div className="flex h-12 rounded-xl bg-[hsl(var(--muted)/0.5)] p-1">
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: "buy"})}
              className={cn("flex-1 rounded-lg text-xs font-black transition-all", formData.type === "buy" ? "bg-green-500 text-white" : "text-[hsl(var(--muted-foreground))]")}
            >BUY</button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: "sell"})}
              className={cn("flex-1 rounded-lg text-xs font-black transition-all", formData.type === "sell" ? "bg-red-500 text-white" : "text-[hsl(var(--muted-foreground))]")}
            >SELL</button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Entry Price</label>
          <input 
            required type="number" step="any"
            className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 font-bold"
            value={formData.entry}
            onChange={e => setFormData({...formData, entry: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Stop Loss</label>
          <input 
            required type="number" step="any"
            className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 font-bold text-red-500"
            value={formData.sl}
            onChange={e => setFormData({...formData, sl: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Take Profit 1</label>
          <input 
            required type="number" step="any"
            className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 font-bold text-green-500"
            value={formData.tp1}
            onChange={e => setFormData({...formData, tp1: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Take Profit 2 (Opt)</label>
          <input 
            type="number" step="any"
            className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 font-bold text-green-500"
            value={formData.tp2}
            onChange={e => setFormData({...formData, tp2: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Tier</label>
          <select 
            className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 font-bold"
            value={formData.tier}
            onChange={e => setFormData({...formData, tier: e.target.value as any})}
          >
            <option value="free">FREE</option>
            <option value="silver">SILVER</option>
            <option value="gold">GOLD</option>
          </select>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="h-5 w-5 rounded border-[hsl(var(--border))]" 
              checked={formData.isFeatured}
              onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Feature this signal</span>
          </label>
        </div>

        <div className="md:col-span-4 flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-6 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))]">Cancel</button>
          <button type="submit" className="rounded-xl bg-[hsl(var(--primary))] px-10 py-3 text-sm font-black text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-all hover:scale-[1.02]">
            POST SIGNAL
          </button>
        </div>
      </form>
    </div>
  );
}

function ActiveSignalRow({ signal }: any) {
  const updateStatus = useMutation(api.signals.updateStatus);
  const toggleFeatured = useMutation(api.signals.toggleFeatured);

  return (
    <tr className="group transition-colors hover:bg-[hsl(var(--muted)/0.2)]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px]", signal.type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
            {signal.type === "buy" ? "B" : "S"}
          </div>
          <div>
            <p className="font-bold">{signal.symbol}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{signal.timeframe} • {signal.strategy}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", signal.type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
          {signal.type}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <p className="text-xs font-bold"><span className="text-[hsl(var(--muted-foreground))] mr-2">Entry:</span> {signal.entry}</p>
          <div className="flex gap-3">
            <p className="text-xs font-bold text-green-500"><span className="text-[hsl(var(--muted-foreground))] mr-1">TP1:</span> {signal.tp1}</p>
            {signal.tp2 && <p className="text-xs font-bold text-green-500"><span className="text-[hsl(var(--muted-foreground))] mr-1">TP2:</span> {signal.tp2}</p>}
          </div>
          <p className="text-xs font-bold text-red-500"><span className="text-[hsl(var(--muted-foreground))] mr-2">SL:</span> {signal.sl}</p>
        </div>
      </td>
      <td className="px-6 py-4 font-mono text-[11px] font-bold text-[hsl(var(--primary))]">{signal.riskReward}</td>
      <td className="px-6 py-4">
        <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          {signal.tier}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => toggleFeatured({ id: signal._id })}
            className={cn("p-2 rounded-lg transition-colors", signal.isFeatured ? "text-yellow-500 bg-yellow-500/10" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]")}
            title="Toggle Featured"
          >
            <Star size={16} fill={signal.isFeatured ? "currentColor" : "none"} />
          </button>
          <div className="h-6 w-px bg-[hsl(var(--border)/0.5)] mx-1" />
          <button 
            onClick={() => updateStatus({ id: signal._id, status: "tp_hit", result: 50 })}
            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
            title="Hit TP"
          >
            <CheckCircle2 size={16} />
          </button>
          <button 
            onClick={() => updateStatus({ id: signal._id, status: "sl_hit", result: -30 })}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Hit SL"
          >
            <XCircle size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function HistoryCard({ signal }: any) {
  const isProfit = signal.status === "tp_hit";
  
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border)/0.4)] bg-[hsl(var(--card))] p-4 transition-all hover:bg-[hsl(var(--muted)/0.1)]">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isProfit ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
        {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate font-bold text-sm">{signal.symbol}</p>
          <p className={cn("text-xs font-black", isProfit ? "text-green-500" : "text-red-500")}>
            {isProfit ? "+" : ""}{signal.result ?? 0} PIPS
          </p>
        </div>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-bold">
          {signal.status.replace("_", " ")} • {new Date(signal.closedAt ?? 0).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function UserSignalsView() {
  const featured = useQuery(api.signals.getFeatured);
  const activeSignals = useQuery(api.signals.listActive);
  const stats = useQuery(api.signals.getStats);
  
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">Trading Signals</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Real-time alerts from our expert analysts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Platform Win Rate" value={`${stats?.winRate ?? 0}%`} icon={Target} color="text-green-500" />
        <StatCard label="Total Pips Gained" value={`${stats?.totalPips ?? 0}+`} icon={TrendingUp} color="text-[hsl(var(--primary))]" />
        <StatCard label="Active Signals" value={activeSignals?.length ?? 0} icon={Play} color="text-blue-500" />
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
