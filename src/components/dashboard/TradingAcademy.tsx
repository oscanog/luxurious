import { useState } from "react";
import { BookOpen, Lock, CheckCircle, ChevronRight, ArrowLeft, Trophy, Zap, Star } from "lucide-react";

// -- Course Data --
const LEVELS = [
  {
    id: 1, title: "Market Foundations", subtitle: "Freshman", color: "hsl(221 83% 53%)",
    lessons: [
      { id: "1.1", title: "What Is Trading?", duration: "5 min", content: "Trading is the act of buying and selling financial assets—stocks, currencies, crypto, or commodities—with the goal of making a profit from price changes.\n\n**Key Concepts:**\n- **Buyers (Bulls)** believe the price will go up.\n- **Sellers (Bears)** believe the price will go down.\n- **Exchanges** are marketplaces where trades happen (e.g., NYSE, Binance).\n- Every trade has a buyer AND a seller—someone wins, someone loses.\n\n**Why It Matters:**\nUnderstanding the basic mechanics prevents you from blindly gambling. You're not \"playing the market\"—you're reading supply and demand." },
      { id: "1.2", title: "Asset Classes", duration: "6 min", content: "Not all assets are equal. Each class has unique characteristics:\n\n**Crypto** — Digital currencies like Bitcoin, Ethereum. 24/7 markets, high volatility.\n**Forex** — Currency pairs (EUR/USD). Largest market in the world, $6T daily volume.\n**Stocks** — Ownership in companies (Apple, Tesla). Driven by earnings and news.\n**Commodities** — Gold, oil, wheat. Influenced by supply chains and geopolitics.\n\n**Pro Tip:** Start with ONE asset class. Master it before diversifying." },
      { id: "1.3", title: "Reading a Price Chart", duration: "8 min", content: "Charts are the language of trading. Learn to read them:\n\n**Candlestick Anatomy:**\n- **Open** — Where price started\n- **Close** — Where price ended\n- **High/Low** — Maximum and minimum during the period\n- **Green candle** = Close > Open (bullish)\n- **Red candle** = Close < Open (bearish)\n\n**Timeframes:**\n- 1m, 5m, 15m = Scalping/Day trading\n- 1H, 4H = Swing trading\n- 1D, 1W = Position trading\n\nLook at the chart on your dashboard—each bar is a candlestick!" },
      { id: "1.4", title: "Order Types", duration: "6 min", content: "How you enter and exit matters:\n\n**Market Order** — Buy/sell NOW at current price. Fast but may slip.\n**Limit Order** — Buy/sell at YOUR price. Patient but might not fill.\n**Stop Order** — Triggers when price hits a level. Used for protection.\n**Stop-Limit** — Combo: triggers like a stop, executes like a limit.\n\n**Golden Rule:** Never enter a trade without knowing your exit." },
      { id: "1.5", title: "Your First Trade", duration: "4 min", content: "Time to practice! Use the Luxurious simulator:\n\n1. Go to the **Learn to Trade** dashboard\n2. Check the current BTC/USDT price\n3. Enter $100 in the Amount field\n4. Click **BUY**\n5. Watch your position in **Open Positions**\n\nCongratulations—you just made your first (simulated) trade! No real money at risk. This is how professionals practice before going live." },
    ],
  },
  {
    id: 2, title: "Technical Analysis", subtitle: "Sophomore", color: "hsl(152 69% 42%)",
    lessons: [
      { id: "2.1", title: "Support & Resistance", duration: "7 min", content: "Price doesn't move randomly. It respects invisible walls:\n\n**Support** — A price level where buying pressure stops the fall. Think of it as a floor.\n**Resistance** — A price level where selling pressure stops the rise. Think of it as a ceiling.\n\n**How to find them:**\n- Look for areas where price bounced multiple times\n- Round numbers often act as S/R (e.g., $60,000 for BTC)\n- When support breaks, it becomes resistance (and vice versa)\n\nThis single concept is the foundation of all technical analysis." },
      { id: "2.2", title: "Trend Lines & Channels", duration: "6 min", content: "The trend is your friend—until it ends.\n\n**Uptrend** — Higher highs + higher lows. Draw line connecting lows.\n**Downtrend** — Lower highs + lower lows. Draw line connecting highs.\n**Channel** — Two parallel trend lines containing price.\n\n**Trading Rules:**\n- Buy at the bottom of an uptrend channel\n- Sell at the top of a downtrend channel\n- A break of the channel = potential reversal" },
      { id: "2.3", title: "Moving Averages", duration: "7 min", content: "Smoothing out the noise:\n\n**SMA (Simple Moving Average)** — Average of last N candles. Equal weight.\n**EMA (Exponential Moving Average)** — More weight on recent prices. Faster reaction.\n\n**Key MAs to watch:**\n- 20 EMA = Short-term trend\n- 50 SMA = Medium-term trend\n- 200 SMA = Long-term trend (institutional favorite)\n\n**Golden Cross** = 50 MA crosses above 200 MA → Bullish\n**Death Cross** = 50 MA crosses below 200 MA → Bearish" },
      { id: "2.4", title: "Volume Analysis", duration: "5 min", content: "Price tells you WHAT happened. Volume tells you WHO was behind it.\n\n- **High volume + price up** = Strong buying (real move)\n- **Low volume + price up** = Weak buying (likely to reverse)\n- **Volume spike at support** = Institutions stepping in\n\n**Rule:** Never trust a breakout on low volume." },
      { id: "2.5", title: "Chart Patterns", duration: "8 min", content: "Patterns repeat because human psychology repeats:\n\n**Reversal Patterns:**\n- Double Top/Bottom — M and W shapes\n- Head & Shoulders — Three peaks, middle is highest\n\n**Continuation Patterns:**\n- Flags & Pennants — Brief pause before trend continues\n- Triangles — Ascending, Descending, Symmetrical\n\n**Pro Tip:** Patterns work best on higher timeframes (4H, 1D)." },
    ],
  },
  {
    id: 3, title: "Indicators & Oscillators", subtitle: "Junior", color: "hsl(43 96% 48%)",
    lessons: [
      { id: "3.1", title: "RSI", duration: "6 min", content: "Relative Strength Index measures momentum on a 0-100 scale.\n\n- **Above 70** = Overbought (might fall)\n- **Below 30** = Oversold (might rise)\n- **Divergence** = Price makes new high but RSI doesn't → reversal signal\n\nDefault period: 14. Don't change it unless you know why." },
      { id: "3.2", title: "MACD", duration: "7 min", content: "Moving Average Convergence Divergence. Two lines + histogram.\n\n- **MACD Line** crosses above **Signal Line** → Buy signal\n- **MACD Line** crosses below **Signal Line** → Sell signal\n- **Histogram** shows the distance between the lines\n\nBest used on 4H and Daily charts. Ignore on 1-minute charts." },
      { id: "3.3", title: "Bollinger Bands", duration: "6 min", content: "A volatility envelope around price:\n\n- **Middle band** = 20 SMA\n- **Upper band** = +2 standard deviations\n- **Lower band** = -2 standard deviations\n\n**Squeeze** = Bands tighten → Explosion incoming\n**Walk the band** = Strong trend, price rides upper/lower band" },
      { id: "3.4", title: "Stochastic Oscillator", duration: "5 min", content: "Similar to RSI but compares closing price to range:\n\n- **%K** (fast) and **%D** (slow) lines\n- Above 80 = Overbought, Below 20 = Oversold\n- Crossovers generate signals\n\nBest in ranging/sideways markets. Less useful in strong trends." },
      { id: "3.5", title: "Combining Indicators", duration: "8 min", content: "One indicator = guess. Multiple = conviction.\n\n**Don't stack similar indicators.** RSI + Stochastic = redundant (both momentum).\n\n**Good combos:**\n- Trend (EMA) + Momentum (RSI) + Volume\n- Bollinger Bands + MACD + Support/Resistance\n\n**Rule of 3:** Enter only when 3+ factors align. This filters out 80% of bad trades." },
    ],
  },
  {
    id: 4, title: "Risk Management", subtitle: "Senior", color: "hsl(0 84% 61%)",
    lessons: [
      { id: "4.1", title: "Position Sizing", duration: "6 min", content: "The #1 reason traders blow up: risking too much per trade.\n\n**The 1% Rule:** Never risk more than 1% of your account on a single trade.\n- $10,000 account → Max risk = $100 per trade\n- This lets you survive 20+ losing trades in a row\n\n**Formula:** Position Size = (Account × Risk%) / (Entry - Stop Loss)" },
      { id: "4.2", title: "Stop-Loss Strategies", duration: "7 min", content: "A stop-loss is your seatbelt. Always wear it.\n\n**Types:**\n- **Fixed** — Set at a specific price level\n- **Trailing** — Moves with price to lock in profits\n- **ATR-based** — Uses volatility to set dynamic stops\n\n**Never move your stop-loss further away.** That's hope, not strategy." },
      { id: "4.3", title: "Risk-Reward Ratio", duration: "5 min", content: "If you risk $1, how much can you make?\n\n- **1:1** — Break even at 50% win rate. Not good enough.\n- **1:2** — Profitable at 34% win rate. Good.\n- **1:3** — Profitable at 25% win rate. Excellent.\n\n**Rule:** Only take trades with minimum 1:2 R:R. This one rule will transform your results." },
      { id: "4.4", title: "Portfolio Diversification", duration: "5 min", content: "Don't put all eggs in one basket:\n\n- Trade multiple uncorrelated assets\n- BTC and ETH are correlated — that's NOT diversification\n- Mix crypto + forex + commodities for true diversification\n\n**Correlation trap:** During crashes, everything correlates. Keep cash reserves." },
      { id: "4.5", title: "The Trading Plan", duration: "8 min", content: "No plan = no edge. Your trading plan must include:\n\n1. **What** you trade (assets, timeframes)\n2. **When** you enter (setup criteria)\n3. **Where** your stop-loss goes\n4. **How much** you risk (position size)\n5. **When** you take profit\n6. **Review** schedule (daily/weekly journal)\n\nWrite it down. Follow it religiously. Update it monthly." },
    ],
  },
];

type View = "hub" | "lesson";

export function TradingAcademy() {
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(["1.1", "1.2", "1.3", "1.4", "1.5"]);
  const [view, setView] = useState<View>("hub");

  const xp = completed.length * 50;
  const totalLessons = LEVELS.reduce((sum, l) => sum + l.lessons.length, 0);

  function getUnlockedLevel() {
    for (let i = 0; i < LEVELS.length; i++) {
      const allDone = LEVELS[i].lessons.every((l) => completed.includes(l.id));
      if (!allDone) return i + 1;
    }
    return LEVELS.length + 1;
  }

  const unlockedLevel = getUnlockedLevel();

  function openLesson(levelId: number, lessonId: string) {
    setCurrentLevel(levelId);
    setCurrentLesson(lessonId);
    setView("lesson");
  }

  function completeLesson() {
    if (currentLesson && !completed.includes(currentLesson)) {
      setCompleted((prev) => [...prev, currentLesson]);
    }
    // Go to next lesson
    const level = LEVELS.find((l) => l.id === currentLevel);
    if (!level) return;
    const idx = level.lessons.findIndex((l) => l.id === currentLesson);
    if (idx < level.lessons.length - 1) {
      setCurrentLesson(level.lessons[idx + 1].id);
    } else {
      setView("hub");
    }
  }

  // -- Lesson View --
  if (view === "lesson" && currentLesson && currentLevel) {
    const level = LEVELS.find((l) => l.id === currentLevel)!;
    const lesson = level.lessons.find((l) => l.id === currentLesson)!;
    const lessonIdx = level.lessons.findIndex((l) => l.id === currentLesson);
    const isDone = completed.includes(currentLesson);

    return (
      <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-300">
        <button onClick={() => setView("hub")} className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Academy
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: `${level.color}15`, color: level.color }}>
            {level.subtitle} · Lesson {lessonIdx + 1}/{level.lessons.length}
          </span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{lesson.duration} read</span>
        </div>

        <h1 className="text-2xl font-black text-[hsl(var(--foreground))] mb-6">{lesson.title}</h1>

        <div className="p-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm mb-6">
          {lesson.content.split("\n\n").map((block, i) => {
            if (block.startsWith("**") && block.endsWith("**")) {
              return <h3 key={i} className="text-base font-black text-[hsl(var(--foreground))] mt-6 mb-2">{block.replace(/\*\*/g, "")}</h3>;
            }
            if (block.startsWith("- ") || block.startsWith("1. ")) {
              return (
                <ul key={i} className="space-y-1.5 my-3 ml-1">
                  {block.split("\n").map((line, j) => (
                    <li key={j} className="text-sm text-[hsl(var(--foreground)/0.85)] leading-relaxed flex gap-2">
                      <span className="text-[hsl(var(--primary))] mt-0.5 shrink-0">•</span>
                      <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-\d.]+\s*/, "").replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--foreground))]">$1</strong>') }} />
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={i} className="text-sm text-[hsl(var(--foreground)/0.85)] leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--foreground))]">$1</strong>') }} />;
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDone && <span className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle size={14} /> Completed</span>}
          </div>
          <button onClick={completeLesson} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[hsl(var(--primary))] text-white font-black text-sm shadow-lg shadow-[hsl(var(--primary)/0.25)] hover:scale-105 active:scale-95 transition-all">
            {lessonIdx < level.lessons.length - 1 ? "Complete & Next" : "Finish Level"} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // -- Hub View --
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Trading Academy</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Master trading from zero to hero. Self-paced. No fluff.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center gap-3">
            <Zap size={16} className="text-yellow-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">XP Earned</p>
              <p className="text-sm font-extrabold text-[hsl(var(--foreground))] tabular-nums">{xp}</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center gap-3">
            <Trophy size={16} className="text-yellow-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Progress</p>
              <p className="text-sm font-extrabold text-[hsl(var(--foreground))] tabular-nums">{completed.length}/{totalLessons}</p>
            </div>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Overall Progress</p>
          <p className="text-xs font-black text-[hsl(var(--foreground))]">{Math.round((completed.length / totalLessons) * 100)}%</p>
        </div>
        <div className="w-full h-2 bg-[hsl(var(--muted)/0.3)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(completed.length / totalLessons) * 100}%`, background: "linear-gradient(90deg, hsl(221 83% 53%), hsl(152 69% 42%))" }} />
        </div>
      </div>

      {/* Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LEVELS.map((level) => {
          const levelCompleted = level.lessons.filter((l) => completed.includes(l.id)).length;
          const isLocked = level.id > unlockedLevel;
          const isComplete = levelCompleted === level.lessons.length;
          const progress = (levelCompleted / level.lessons.length) * 100;

          return (
            <div key={level.id} className={`relative p-6 rounded-2xl border bg-[hsl(var(--card))] transition-all ${isLocked ? "opacity-50 border-[hsl(var(--border))]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] hover:shadow-lg"}`}>
              {isLocked && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[hsl(var(--background)/0.5)] backdrop-blur-[2px] z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Lock size={24} className="text-[hsl(var(--muted-foreground))]" />
                    <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Complete previous level</p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: `${level.color}15`, color: level.color }}>
                    {level.id}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: level.color }}>{level.subtitle}</p>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{level.title}</h3>
                  </div>
                </div>
                {isComplete ? (
                  <span className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase flex items-center gap-1"><Star size={10} /> Complete</span>
                ) : (
                  <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">{levelCompleted}/{level.lessons.length}</span>
                )}
              </div>

              {/* Progress */}
              <div className="w-full h-1.5 bg-[hsl(var(--muted)/0.3)] rounded-full overflow-hidden mb-5">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: isComplete ? "hsl(152 69% 42%)" : level.color }} />
              </div>

              {/* Lessons List */}
              <div className="space-y-2">
                {level.lessons.map((lesson) => {
                  const isDone = completed.includes(lesson.id);
                  return (
                    <button key={lesson.id} onClick={() => !isLocked && openLesson(level.id, lesson.id)} disabled={isLocked}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isDone ? "bg-green-500/5" : "hover:bg-[hsl(var(--muted)/0.3)]"}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${isDone ? "bg-green-500/10 text-green-500" : "bg-[hsl(var(--muted)/0.3)] text-[hsl(var(--muted-foreground))]"}`}>
                        {isDone ? <CheckCircle size={14} /> : lesson.id.split(".")[1]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDone ? "text-[hsl(var(--foreground)/0.6)]" : "text-[hsl(var(--foreground))]"}`}>{lesson.title}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{lesson.duration}</p>
                      </div>
                      <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
