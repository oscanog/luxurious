import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrendingUp, TrendingDown, Clock, User, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";

export function TradeMonitorPage() {
  const trades = useQuery(api.admin.getAllTrades) ?? [];
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const filteredTrades = trades.filter(t => {
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    return true;
  });

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Global Trade Monitor</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Live oversight of all platform trading activity.</p>
        </div>
        <div className="flex bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1">
          {["all", "open", "closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f ? "bg-[hsl(var(--primary))] text-white shadow-md" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTrades.map((trade) => {
          const isProfit = (trade.pnl ?? 0) >= 0;
          return (
            <div key={trade._id} className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[hsl(var(--primary)/0.3)] transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  trade.side === "long" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                }`}>
                  {trade.side === "long" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[hsl(var(--foreground))] uppercase">{trade.symbol}</span>
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      trade.side === "long" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    }`}>
                      {trade.side}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))] font-medium">
                    <User size={10} />
                    <span>{trade.userName} ({trade.userEmail})</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:max-w-md">
                <div>
                  <p className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest mb-1">Entry Price</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">${trade.entryPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest mb-1">Amount</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">${trade.amount.toLocaleString()}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest mb-1">Time</p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[hsl(var(--foreground))]">
                    <Clock size={14} className="text-[hsl(var(--muted-foreground))]" />
                    <span className="tabular-nums">{new Date(trade.openedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-right min-w-[120px]">
                <p className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest mb-1">Profit/Loss</p>
                <div className={`flex items-center justify-end gap-1 text-lg font-black tabular-nums ${isProfit ? "text-green-500" : "text-red-500"}`}>
                  {isProfit ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  ${Math.abs(trade.pnl ?? 0).toFixed(2)}
                </div>
                <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">{trade.status}</p>
              </div>
            </div>
          );
        })}

        {filteredTrades.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-[hsl(var(--border))] rounded-3xl">
            <TrendingUp size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-10" />
            <p className="text-sm font-bold text-[hsl(var(--muted-foreground))]">No trades recorded in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
