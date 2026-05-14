import { TrendingUp, BarChart3, ArrowUpRight, Wallet, PlayCircle, BookOpen } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TradingChart } from "../../components/dashboard/TradingChart";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function LearnToTradePage() {
  const [symbol] = useState("BTC");
  const [amount, setAmount] = useState(1000);
  const [history, setHistory] = useState<any[]>([]);
  const [tick, setTick] = useState<any>(null);
  const [livePrice, setLivePrice] = useState(0);

  const wallet = useQuery(api.simulation.getWallet);
  const openTrades = useQuery(api.simulation.getOpenTrades);
  const tradeHistory = useQuery(api.simulation.getTradeHistory);
  
  const executeTrade = useMutation(api.simulation.openTrade);
  const exitTrade = useMutation(api.simulation.closeTrade);

  // 1. History Fetch (Binance REST)
  useEffect(() => {
    fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=100")
      .then(res => res.json())
      .then(data => {
        const candles = data.map((d: any) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        setHistory(candles);
        if (candles.length > 0) {
          setLivePrice(candles[candles.length - 1].close);
        }
      })
      .catch(err => console.error("Binance History Error:", err));
  }, []);

  // 2. Real-time Stream (Binance WebSocket)
  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1h");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.k) {
        const k = msg.k;
        const newTick = {
          time: k.t / 1000,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        };
        setTick(newTick);
        setLivePrice(newTick.close);
      }
    };
    return () => ws.close();
  }, []);

  const currentPrice = livePrice;

  async function handleTrade(type: "buy" | "sell") {
    try {
      await executeTrade({
        symbol,
        type,
        side: type === "buy" ? "long" : "short",
        entryPrice: currentPrice,
        amount,
      });
      toast.success(`${type.toUpperCase()} order executed!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Trade failed");
    }
  }

  async function handleCloseTrade(tradeId: any) {
    try {
      await exitTrade({ tradeId, exitPrice: currentPrice });
      toast.success("Trade closed successfully");
    } catch {
      toast.error("Failed to close trade");
    }
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Learn to Trade</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Master the markets with risk-free simulation.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))]">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Sim Balance</p>
              <p className="text-sm font-extrabold text-[hsl(var(--foreground))] tabular-nums">${wallet?.balance?.toLocaleString() ?? "10,000"}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold shadow-lg shadow-[hsl(var(--primary)/0.25)] hover:scale-105 active:scale-95 transition-all">
            <PlayCircle size={18} />
            Start Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                  B
                </div>
                <div>
                  <h2 className="font-bold text-[hsl(var(--foreground))]">Bitcoin / USDT</h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Binance Live Feed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-[hsl(var(--foreground))] tabular-nums">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs font-bold text-[hsl(152_69%_42%)]">Live</p>
              </div>
            </div>
            
            {history.length > 0 ? (
              <TradingChart data={history} update={tick} />
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-[hsl(var(--muted)/0.2)] rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Connecting to Binance...</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Recent History</h3>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
              {!tradeHistory || tradeHistory.length === 0 ? (
                <div className="p-12 text-center text-[hsl(var(--muted-foreground))]">
                  <BarChart3 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">No trade history yet.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[hsl(var(--muted)/0.3)]">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Symbol</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Side</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Entry/Exit</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Amount</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {tradeHistory.map((h) => {
                      const pnl = h.side === "long" ? (h.exitPrice! - h.entryPrice) : (h.entryPrice - h.exitPrice!);
                      const pnlPercent = (pnl / h.entryPrice) * 100;
                      return (
                        <tr key={h._id} className="hover:bg-[hsl(var(--muted)/0.2)] transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-[hsl(var(--foreground))]">{h.symbol}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${h.side === 'long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {h.side}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-[hsl(var(--foreground))]">${h.entryPrice.toLocaleString()}</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">${h.exitPrice?.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-[hsl(var(--foreground))]">${h.amount.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-xs font-black text-right tabular-nums ${pnl >= 0 ? 'text-[hsl(152_69%_42%)]' : 'text-[hsl(0_84%_61%)]'}`}>
                            {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Trading Academy</h3>
              <button className="text-[10px] font-bold text-[hsl(var(--primary))] hover:underline cursor-pointer bg-transparent border-none">View All Modules</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  title: "Intro to Markets", 
                  desc: "Master pips, OHLC, and exchange basics.", 
                  progress: 100, 
                  icon: BookOpen, 
                  color: "hsl(221 83% 53%)" 
                },
                { 
                  title: "Technical Analysis", 
                  desc: "S/R levels, trend lines, and MAs.", 
                  progress: 45, 
                  icon: BarChart3, 
                  color: "hsl(152 69% 42%)" 
                },
                { 
                  title: "Risk Management", 
                  desc: "Position sizing and the 1% rule.", 
                  progress: 0, 
                  icon: TrendingUp, 
                  color: "hsl(43 96% 48%)" 
                },
              ].map((c) => (
                <div key={c.title} className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.5)] transition-all group cursor-pointer hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.color}15` }}>
                      <c.icon size={20} style={{ color: c.color }} />
                    </div>
                    {c.progress === 100 ? (
                      <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[9px] font-black uppercase">Complete</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{c.progress}%</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                    {c.title}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-all translate-x--1 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 mb-4 leading-relaxed">{c.desc}</p>
                  
                  <div className="w-full h-1 bg-[hsl(var(--muted)/0.3)] rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${c.progress}%`, 
                        background: c.progress === 100 ? 'hsl(152 69% 42%)' : c.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-4">Quick Trade</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => { void handleTrade("buy"); }}
                  className="flex-1 py-3 rounded-xl bg-[hsl(152_69%_42%)] text-white font-black text-sm shadow-lg shadow-[hsl(152_69%_42%)/0.2] active:scale-95 transition-all"
                >
                  BUY
                </button>
                <button 
                  onClick={() => { void handleTrade("sell"); }}
                  className="flex-1 py-3 rounded-xl bg-[hsl(0_84%_61%)] text-white font-black text-sm shadow-lg shadow-[hsl(0_84%_61%)/0.2] active:scale-95 transition-all"
                >
                  SELL
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[hsl(var(--muted-foreground))]">AMOUNT (USD)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[hsl(var(--primary))]" 
                />
              </div>
              <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">Est. Size: {(amount / (currentPrice || 1)).toFixed(6)} {symbol}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-4 flex items-center justify-between">
              Open Positions
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-bold">{openTrades?.length ?? 0}</span>
            </h3>
            <div className="space-y-3">
              {!openTrades || openTrades.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp size={32} className="mx-auto mb-2 text-[hsl(var(--muted-foreground))] opacity-20" />
                  <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">No active trades</p>
                </div>
              ) : (
                openTrades.map((trade) => {
                  const pnl = trade.side === "long" ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice;
                  const pnlPercent = (pnl / trade.entryPrice) * 100;
                  const isProfit = pnl >= 0;
                  
                  return (
                    <div key={trade._id} className="p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] group transition-all hover:border-[hsl(var(--primary)/0.3)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${trade.side === 'long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {trade.side}
                        </span>
                        <button 
                          onClick={() => { void handleCloseTrade(trade._id); }}
                          className="text-[10px] font-bold text-red-500 hover:underline"
                        >
                          CLOSE
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[hsl(var(--foreground))]">${trade.amount.toLocaleString()}</p>
                        <p className={`text-xs font-black tabular-nums ${isProfit ? 'text-[hsl(152_69%_42%)]' : 'text-[hsl(0_84%_61%)]'}`}>
                          {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
