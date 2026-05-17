import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Seed Level 1
    await ctx.runMutation(internal.academy.seedLevel, {
      order: 1,
      title: "Market Foundations",
      subtitle: "Freshman",
      color: "hsl(221 83% 53%)",
      description: "Learn the basics of financial markets, how they operate, and the fundamental terminology every trader must know.",
      lessons: [
        {
          order: 1,
          slug: "1.1",
          title: "What is Trading?",
          duration: "5 min",
          content: "Trading involves the buying and selling of financial instruments like stocks, bonds, currencies, and commodities. The goal is simple: buy low, sell high."
        },
        {
          order: 2,
          slug: "1.2",
          title: "Understanding Brokers",
          duration: "8 min",
          content: "A broker acts as the middleman between you and the market. You cannot go directly to an exchange to buy stocks; you need a brokerage account."
        }
      ]
    });

    // Seed Level 2
    await ctx.runMutation(internal.academy.seedLevel, {
      order: 2,
      title: "Technical Analysis",
      subtitle: "Sophomore",
      color: "hsl(43 96% 48%)",
      description: "Master chart reading, candlesticks, and the technical indicators used by professionals to identify trends.",
      lessons: [
        {
          order: 1,
          slug: "2.1",
          title: "Candlestick Anatomy",
          duration: "10 min",
          content: "A candlestick tells a story of the battle between buyers and sellers over a specific timeframe. It has a real body and wicks (shadows)."
        },
        {
          order: 2,
          slug: "2.2",
          title: "Support & Resistance",
          duration: "15 min",
          content: "Support is a price level where a downtrend tends to pause due to a concentration of demand. Resistance is where an uptrend tends to pause due to selling interest."
        }
      ]
    });
    
    // Seed Level 3
    await ctx.runMutation(internal.academy.seedLevel, {
      order: 3,
      title: "Indicators & Oscillators",
      subtitle: "Junior",
      color: "hsl(43 96% 48%)",
      description: "Use RSI, MACD, Bollinger Bands, and multi-indicator strategies.",
      lessons: [
        {
          order: 1,
          slug: "3.1",
          title: "Moving Averages",
          duration: "7 min",
          content: "A moving average (MA) is a widely used technical indicator that smooths out price trends by filtering out the noise from random short-term price fluctuations."
        },
        {
          order: 2,
          slug: "3.2",
          title: "Relative Strength Index (RSI)",
          duration: "9 min",
          content: "The relative strength index (RSI) is a momentum indicator used in technical analysis that measures the magnitude of recent price changes."
        }
      ]
    });

    // Seed Level 4
    await ctx.runMutation(internal.academy.seedLevel, {
      order: 4,
      title: "Risk Management",
      subtitle: "Senior",
      color: "hsl(0 84% 60%)",
      description: "Position sizing, stop-losses, R:R ratios, and building your trading plan.",
      lessons: [
        {
          order: 1,
          slug: "4.1",
          title: "Position Sizing",
          duration: "12 min",
          content: "Position sizing refers to the size of a position within a particular portfolio, or the dollar amount that an investor is going to trade."
        },
        {
          order: 2,
          slug: "4.2",
          title: "Stop Losses",
          duration: "8 min",
          content: "A stop-loss order is an order placed with a broker to buy or sell a specific stock once the stock reaches a certain price."
        }
      ]
    });

    return "Academy seeded successfully with 4 levels!";
  }
});
