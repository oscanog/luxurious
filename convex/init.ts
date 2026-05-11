import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const LEVEL_1 = {
  order: 1,
  title: "Market Foundations",
  subtitle: "Freshman",
  color: "hsl(221 83% 53%)",
  description: "Learn the basics of financial markets, price charts, and your first simulated trade.",
  lessons: [
    { order: 1, slug: "1.1", title: "What Is Trading?", duration: "5 min", content: "Trading is the act of buying and selling financial assets—stocks, currencies, crypto, or commodities—with the goal of making a profit from price changes.\n\n**Key Concepts:**\n- **Buyers (Bulls)** believe the price will go up.\n- **Sellers (Bears)** believe the price will go down.\n- **Exchanges** are marketplaces where trades happen (e.g., NYSE, Binance).\n- Every trade has a buyer AND a seller—someone wins, someone loses.\n\n**Why It Matters:**\nUnderstanding the basic mechanics prevents you from blindly gambling. You're not \"playing the market\"—you're reading supply and demand." },
    { order: 2, slug: "1.2", title: "Asset Classes", duration: "6 min", content: "Not all assets are equal. Each class has unique characteristics:\n\n**Crypto** — Digital currencies like Bitcoin, Ethereum. 24/7 markets, high volatility.\n**Forex** — Currency pairs (EUR/USD). Largest market in the world, $6T daily volume.\n**Stocks** — Ownership in companies (Apple, Tesla). Driven by earnings and news.\n**Commodities** — Gold, oil, wheat. Influenced by supply chains and geopolitics.\n\n**Pro Tip:** Start with ONE asset class. Master it before diversifying." },
    { order: 3, slug: "1.3", title: "Reading a Price Chart", duration: "8 min", content: "Charts are the language of trading. Learn to read them:\n\n**Candlestick Anatomy:**\n- **Open** — Where price started\n- **Close** — Where price ended\n- **High/Low** — Maximum and minimum during the period\n- **Green candle** = Close > Open (bullish)\n- **Red candle** = Close < Open (bearish)\n\n**Timeframes:**\n- 1m, 5m, 15m = Scalping/Day trading\n- 1H, 4H = Swing trading\n- 1D, 1W = Position trading\n\nLook at the chart on your dashboard—each bar is a candlestick!" },
    { order: 4, slug: "1.4", title: "Order Types", duration: "6 min", content: "How you enter and exit matters:\n\n**Market Order** — Buy/sell NOW at current price. Fast but may slip.\n**Limit Order** — Buy/sell at YOUR price. Patient but might not fill.\n**Stop Order** — Triggers when price hits a level. Used for protection.\n**Stop-Limit** — Combo: triggers like a stop, executes like a limit.\n\n**Golden Rule:** Never enter a trade without knowing your exit." },
    { order: 5, slug: "1.5", title: "Your First Trade", duration: "4 min", content: "Time to practice! Use the Luxurious simulator:\n\n1. Go to the **Learn to Trade** dashboard\n2. Check the current BTC/USDT price\n3. Enter $100 in the Amount field\n4. Click **BUY**\n5. Watch your position in **Open Positions**\n\nCongratulations—you just made your first (simulated) trade! No real money at risk. This is how professionals practice before going live." },
  ],
};

const LEVEL_2 = {
  order: 2,
  title: "Technical Analysis",
  subtitle: "Sophomore",
  color: "hsl(152 69% 42%)",
  description: "Master chart reading with support/resistance, trends, moving averages, and patterns.",
  lessons: [
    { order: 1, slug: "2.1", title: "Support & Resistance", duration: "7 min", content: "Price doesn't move randomly. It respects invisible walls:\n\n**Support** — A price level where buying pressure stops the fall. Think of it as a floor.\n**Resistance** — A price level where selling pressure stops the rise. Think of it as a ceiling.\n\n**How to find them:**\n- Look for areas where price bounced multiple times\n- Round numbers often act as S/R (e.g., $60,000 for BTC)\n- When support breaks, it becomes resistance (and vice versa)\n\nThis single concept is the foundation of all technical analysis." },
    { order: 2, slug: "2.2", title: "Trend Lines & Channels", duration: "6 min", content: "The trend is your friend—until it ends.\n\n**Uptrend** — Higher highs + higher lows. Draw line connecting lows.\n**Downtrend** — Lower highs + lower lows. Draw line connecting highs.\n**Channel** — Two parallel trend lines containing price.\n\n**Trading Rules:**\n- Buy at the bottom of an uptrend channel\n- Sell at the top of a downtrend channel\n- A break of the channel = potential reversal" },
    { order: 3, slug: "2.3", title: "Moving Averages", duration: "7 min", content: "Smoothing out the noise:\n\n**SMA (Simple Moving Average)** — Average of last N candles. Equal weight.\n**EMA (Exponential Moving Average)** — More weight on recent prices. Faster reaction.\n\n**Key MAs to watch:**\n- 20 EMA = Short-term trend\n- 50 SMA = Medium-term trend\n- 200 SMA = Long-term trend (institutional favorite)\n\n**Golden Cross** = 50 MA crosses above 200 MA → Bullish\n**Death Cross** = 50 MA crosses below 200 MA → Bearish" },
    { order: 4, slug: "2.4", title: "Volume Analysis", duration: "5 min", content: "Price tells you WHAT happened. Volume tells you WHO was behind it.\n\n- **High volume + price up** = Strong buying (real move)\n- **Low volume + price up** = Weak buying (likely to reverse)\n- **Volume spike at support** = Institutions stepping in\n\n**Rule:** Never trust a breakout on low volume." },
    { order: 5, slug: "2.5", title: "Chart Patterns", duration: "8 min", content: "Patterns repeat because human psychology repeats:\n\n**Reversal Patterns:**\n- Double Top/Bottom — M and W shapes\n- Head & Shoulders — Three peaks, middle is highest\n\n**Continuation Patterns:**\n- Flags & Pennants — Brief pause before trend continues\n- Triangles — Ascending, Descending, Symmetrical\n\n**Pro Tip:** Patterns work best on higher timeframes (4H, 1D)." },
  ],
};

const LEVEL_3 = {
  order: 3,
  title: "Indicators & Oscillators",
  subtitle: "Junior",
  color: "hsl(43 96% 48%)",
  description: "Use RSI, MACD, Bollinger Bands, and multi-indicator strategies.",
  lessons: [
    { order: 1, slug: "3.1", title: "RSI", duration: "6 min", content: "Relative Strength Index measures momentum on a 0-100 scale.\n\n- **Above 70** = Overbought (might fall)\n- **Below 30** = Oversold (might rise)\n- **Divergence** = Price makes new high but RSI doesn't → reversal signal\n\nDefault period: 14. Don't change it unless you know why." },
    { order: 2, slug: "3.2", title: "MACD", duration: "7 min", content: "Moving Average Convergence Divergence. Two lines + histogram.\n\n- **MACD Line** crosses above **Signal Line** → Buy signal\n- **MACD Line** crosses below **Signal Line** → Sell signal\n- **Histogram** shows the distance between the lines\n\nBest used on 4H and Daily charts. Ignore on 1-minute charts." },
    { order: 3, slug: "3.3", title: "Bollinger Bands", duration: "6 min", content: "A volatility envelope around price:\n\n- **Middle band** = 20 SMA\n- **Upper band** = +2 standard deviations\n- **Lower band** = -2 standard deviations\n\n**Squeeze** = Bands tighten → Explosion incoming\n**Walk the band** = Strong trend, price rides upper/lower band" },
    { order: 4, slug: "3.4", title: "Stochastic Oscillator", duration: "5 min", content: "Similar to RSI but compares closing price to range:\n\n- **%K** (fast) and **%D** (slow) lines\n- Above 80 = Overbought, Below 20 = Oversold\n- Crossovers generate signals\n\nBest in ranging/sideways markets. Less useful in strong trends." },
    { order: 5, slug: "3.5", title: "Combining Indicators", duration: "8 min", content: "One indicator = guess. Multiple = conviction.\n\n**Don't stack similar indicators.** RSI + Stochastic = redundant (both momentum).\n\n**Good combos:**\n- Trend (EMA) + Momentum (RSI) + Volume\n- Bollinger Bands + MACD + Support/Resistance\n\n**Rule of 3:** Enter only when 3+ factors align. This filters out 80% of bad trades." },
  ],
};

const LEVEL_4 = {
  order: 4,
  title: "Risk Management",
  subtitle: "Senior",
  color: "hsl(0 84% 61%)",
  description: "Position sizing, stop-losses, R:R ratios, and building your trading plan.",
  lessons: [
    { order: 1, slug: "4.1", title: "Position Sizing", duration: "6 min", content: "The #1 reason traders blow up: risking too much per trade.\n\n**The 1% Rule:** Never risk more than 1% of your account on a single trade.\n- $10,000 account → Max risk = $100 per trade\n- This lets you survive 20+ losing trades in a row\n\n**Formula:** Position Size = (Account × Risk%) / (Entry - Stop Loss)" },
    { order: 2, slug: "4.2", title: "Stop-Loss Strategies", duration: "7 min", content: "A stop-loss is your seatbelt. Always wear it.\n\n**Types:**\n- **Fixed** — Set at a specific price level\n- **Trailing** — Moves with price to lock in profits\n- **ATR-based** — Uses volatility to set dynamic stops\n\n**Never move your stop-loss further away.** That's hope, not strategy." },
    { order: 3, slug: "4.3", title: "Risk-Reward Ratio", duration: "5 min", content: "If you risk $1, how much can you make?\n\n- **1:1** — Break even at 50% win rate. Not good enough.\n- **1:2** — Profitable at 34% win rate. Good.\n- **1:3** — Profitable at 25% win rate. Excellent.\n\n**Rule:** Only take trades with minimum 1:2 R:R. This one rule will transform your results." },
    { order: 4, slug: "4.4", title: "Portfolio Diversification", duration: "5 min", content: "Don't put all eggs in one basket:\n\n- Trade multiple uncorrelated assets\n- BTC and ETH are correlated — that's NOT diversification\n- Mix crypto + forex + commodities for true diversification\n\n**Correlation trap:** During crashes, everything correlates. Keep cash reserves." },
    { order: 5, slug: "4.5", title: "The Trading Plan", duration: "8 min", content: "No plan = no edge. Your trading plan must include:\n\n1. **What** you trade (assets, timeframes)\n2. **When** you enter (setup criteria)\n3. **Where** your stop-loss goes\n4. **How much** you risk (position size)\n5. **When** you take profit\n6. **Review** schedule (daily/weekly journal)\n\nWrite it down. Follow it religiously. Update it monthly." },
  ],
};

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.academy.seedLevel, LEVEL_1);
    await ctx.runMutation(internal.academy.seedLevel, LEVEL_2);
    await ctx.runMutation(internal.academy.seedLevel, LEVEL_3);
    await ctx.runMutation(internal.academy.seedLevel, LEVEL_4);
    await ctx.runMutation(internal.seed.seedUsers, {});
  },
});
