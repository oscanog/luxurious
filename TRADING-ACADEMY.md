# Luxurious Trading Academy — Feature Spec

> Inspired by: **BabyPips School of Pipsology**, **Binance Academy**, **Investopedia Academy**

## Vision
A structured, self-paced learning system embedded inside the Luxurious platform. Users graduate through levels—from absolute beginner to advanced strategist—using interactive lessons, quizzes, and the live simulation engine.

---

## Course Structure (6 Levels)

### Level 1 — Freshman: Market Foundations
| # | Lesson | Description |
|---|--------|-------------|
| 1.1 | What Is Trading? | How markets work, buyers vs sellers, exchanges |
| 1.2 | Asset Classes | Crypto, Forex, Stocks, Commodities overview |
| 1.3 | Reading a Price Chart | Candlesticks, timeframes, OHLC explained |
| 1.4 | Order Types | Market, Limit, Stop orders — when to use each |
| 1.5 | Your First Trade | Walkthrough using the Luxurious simulator |
| **Quiz** | Level 1 Assessment | 10 questions, 70% to pass |

### Level 2 — Sophomore: Technical Analysis Basics
| # | Lesson | Description |
|---|--------|-------------|
| 2.1 | Support & Resistance | Identifying key price levels |
| 2.2 | Trend Lines & Channels | Drawing and trading with trends |
| 2.3 | Moving Averages | SMA, EMA — the trader's compass |
| 2.4 | Volume Analysis | Why volume confirms price moves |
| 2.5 | Chart Patterns I | Double tops/bottoms, head & shoulders |
| **Quiz** | Level 2 Assessment | 10 questions, 70% to pass |

### Level 3 — Junior: Indicators & Oscillators
| # | Lesson | Description |
|---|--------|-------------|
| 3.1 | RSI (Relative Strength Index) | Overbought/oversold signals |
| 3.2 | MACD | Momentum and trend direction |
| 3.3 | Bollinger Bands | Volatility squeeze setups |
| 3.4 | Stochastic Oscillator | Timing entries in ranging markets |
| 3.5 | Combining Indicators | Building a multi-indicator strategy |
| **Quiz** | Level 3 Assessment | 10 questions, 70% to pass |

### Level 4 — Senior: Risk Management
| # | Lesson | Description |
|---|--------|-------------|
| 4.1 | Position Sizing | How much to risk per trade |
| 4.2 | Stop-Loss Strategies | Protect capital, cut losses early |
| 4.3 | Risk-Reward Ratio | Only take trades worth taking |
| 4.4 | Portfolio Diversification | Don't put all eggs in one basket |
| 4.5 | The Trading Plan | Building your personal playbook |
| **Quiz** | Level 4 Assessment | 10 questions, 70% to pass |

### Level 5 — Graduate: Advanced Strategies
| # | Lesson | Description |
|---|--------|-------------|
| 5.1 | Fibonacci Retracements | Finding hidden levels |
| 5.2 | Elliott Wave Theory | Market structure and cycles |
| 5.3 | Divergence Trading | When price and indicators disagree |
| 5.4 | Multiple Timeframe Analysis | The top-down approach |
| 5.5 | Algorithmic Thinking | Intro to automated strategy logic |
| **Quiz** | Level 5 Assessment | 10 questions, 70% to pass |

### Level 6 — Master: Trading Psychology
| # | Lesson | Description |
|---|--------|-------------|
| 6.1 | Emotional Discipline | Fear and greed — your biggest enemies |
| 6.2 | Journaling Your Trades | Why tracking everything matters |
| 6.3 | Handling Drawdowns | Surviving losing streaks |
| 6.4 | Cognitive Biases | Confirmation bias, anchoring, etc. |
| 6.5 | The Professional Mindset | Thinking in probabilities |
| **Final Exam** | Academy Graduation | 20 questions, 80% to pass |

---

## UI Components Required

1. **Academy Hub Page** — Grid of level cards with lock/unlock states
2. **Lesson Reader** — Full-width content area with rich text, images, key takeaways
3. **Quiz Engine** — Multiple choice with instant feedback, score tracking
4. **Progress Sidebar** — Current level, XP bar, lessons completed
5. **Achievement Badges** — "First Trade", "Chart Reader", "Risk Master", etc.

## Data Model (Convex)

```
academyProgress: {
  userId: Id<"users">,
  level: number,        // 1-6
  lesson: number,       // current lesson within level
  completedLessons: string[],  // ["1.1", "1.2", ...]
  quizScores: object,   // { "level1": 90, "level2": 80 }
  xp: number,
  badges: string[],
}
```

## Design References
- **BabyPips**: Level-based progression, school metaphor (Freshman → Graduate)
- **Binance Academy**: Clean cards, category filters, difficulty tags
- **Investopedia**: Professional tone, real-world examples
- **Duolingo**: Gamification, streaks, XP, unlock progression
