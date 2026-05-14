# M009: Trading Signals Module — Technical Specification

**Objective:** Full-featured trading signal command center. Admin manages signals, schedules, milestones. Users consume signals, track performance, unlock tiers.

---

## 1. Data Schema

### `tradingSignals` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `symbol` | `string` | Pair/instrument: "BTC/USDT", "GOLD", "EUR/USD" |
| `type` | `buy \| sell` | Direction |
| `entry` | `number` | Recommended entry price |
| `tp1` | `number` | Take Profit target 1 (primary) |
| `tp2` | `optional(number)` | Take Profit target 2 |
| `tp3` | `optional(number)` | Take Profit target 3 |
| `sl` | `number` | Stop Loss price |
| `status` | `pending \| active \| tp_hit \| sl_hit \| cancelled` | Current state |
| `result` | `optional(number)` | Actual P&L in pips/points when closed |
| `riskReward` | `optional(string)` | e.g., "1:3" computed from entry/tp/sl |
| `timeframe` | `string` | "1H", "4H", "D", "W" |
| `strategy` | `string` | e.g., "SMC", "ICT", "Price Action", "Breakout" |
| `notes` | `optional(string)` | Analyst commentary/rationale |
| `isFeatured` | `boolean` | "Last Promoted" / Signal of the week |
| `tier` | `free \| silver \| gold` | Access tier required to view |
| `analystId` | `id(users)` | Who posted |
| `closedAt` | `optional(number)` | When signal resolved |
| `createdAt` | `number` | Timestamp |

### `signalSchedules` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | "London Open", "NY Session", "Asia Sweep" |
| `session` | `london \| new_york \| asia \| custom` | Trading session |
| `dayOfWeek` | `number` | 0=Sun ... 6=Sat |
| `time` | `string` | "08:00" (UTC) |
| `timezone` | `string` | Display TZ: "UTC", "Asia/Manila", etc. |
| `analystName` | `string` | Scheduled expert |
| `isActive` | `boolean` | Toggle on/off |
| `createdAt` | `number` | Timestamp |

### `signalMilestones` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | "Bronze Trader", "Silver Analyst", "Gold Strategist" |
| `description` | `string` | What user needs to do |
| `tier` | `free \| silver \| gold` | Tier this milestone unlocks |
| `requiredSignals` | `number` | Signals needed to have followed |
| `requiredWinRate` | `optional(number)` | Min win rate % |
| `sortOrder` | `number` | Display order |
| `isActive` | `boolean` | Toggle |

---

## 2. Backend Mutations & Queries

### Admin Mutations
| Function | Args | Description |
| :--- | :--- | :--- |
| `signals.create` | Full signal fields | Create new signal |
| `signals.update` | `id` + partial fields | Edit active signal |
| `signals.updateStatus` | `id`, `status`, `result?` | Mark TP hit / SL hit / Cancel |
| `signals.toggleFeatured` | `id` | Set/unset "Last Promoted" |
| `schedules.create` | Schedule fields | Add schedule slot |
| `schedules.update` | `id` + partial | Edit schedule |
| `schedules.toggleActive` | `id` | Enable/disable |
| `milestones.create` | Milestone fields | Define new milestone |

### Queries (Both Roles)
| Function | Access | Description |
| :--- | :--- | :--- |
| `signals.listActive` | All | Live signals (filtered by user tier) |
| `signals.listHistory` | All | Past signals with results |
| `signals.getStats` | All | Win rate, total pips, active count |
| `signals.getFeatured` | All | Current "Last Promoted" signal |
| `schedules.list` | All | Active schedules |
| `milestones.list` | All | Tier progression milestones |

---

## 3. Page Architecture: `TradingSignalsPage.tsx`

### Admin View — Sections & Components

| Section | Component Type | Why This Component |
| :--- | :--- | :--- |
| **Stats Overview** | `StatsGrid` (4 metric cards) | Quick KPI scan: Win Rate, Active Count, Monthly Pips, Featured signal |
| **Create Signal** | `Inline Form Card` | Fast input. Symbol dropdown, entry/tp/sl numeric inputs, strategy select, tier radio. No modal — speed matters |
| **Active Signals** | `Table` with row actions | Table = best for dense data + quick actions (TP Hit, SL Hit, Cancel, Edit). Sortable by date/symbol |
| **Signal History** | `Table` with status pills | Filterable by status, date range, symbol. Color-coded result column (green/red) |
| **Schedule Manager** | `Card Grid` (day-of-week cards) | Visual weekly calendar. Each day-card shows scheduled sessions. Toggle active/inactive |
| **Milestone Editor** | `Ordered List Cards` | Drag-sortable tier cards showing progression path |

### User View — Sections & Components

| Section | Component Type | Why This Component |
| :--- | :--- | :--- |
| **Featured Signal** | `Hero Card` (full-width) | Maximum visibility for "Signal of the Week". Large BUY/SELL badge, entry/tp/sl, copy buttons |
| **Live Signals** | `Signal Cards` (grid) | Each card = one signal. Color-coded green (BUY) / red (SELL). Copy-to-clipboard for each level. Pulsing LIVE indicator |
| **My Stats** | `StatsGrid` (3 cards) | Win Rate, Signals Followed, Current Tier |
| **Schedule** | `Timeline` (vertical) | When next signals drop. Countdown timer to next session. Session labels (London/NY/Asia) |
| **How to Get More Signals** | `Milestone Progress Cards` | Vertical stepper showing tier progression. Current tier highlighted. Requirements for next tier |
| **Signal History** | `Compact Table` | Past signals user followed. Result column with P&L |

---

## 4. Access Control

| Tier | Signals Visible | Features |
| :--- | :--- | :--- |
| **Free** | Max 2 active signals | Basic stats, schedule view |
| **Silver** | Max 5 active signals | Full stats, milestone tracking |
| **Gold** | Unlimited | All features + analyst notes |

Admin: Full CRUD on all signals, schedules, milestones. Can override tier restrictions.

---

## 5. UI/UX Design Tokens

- **BUY Signal**: Green gradient `#22C55E` → `#16A34A`, white text
- **SELL Signal**: Red gradient `#EF4444` → `#DC2626`, white text
- **LIVE Pill**: Pulsing green dot + "LIVE" text
- **Featured Badge**: Gold gradient matching brand secondary
- **Tier Badges**: Free=Gray, Silver=`#94A3B8`, Gold=`#D4AF37`

---

## 6. Mobile Parity Requirements

- Push notification on new signal (tier-filtered)
- Real-time Convex subscriptions for live status updates
- Copy-to-clipboard for entry/tp/sl levels
- Countdown timer to next scheduled session
- Milestone progress synced across platforms

---

## 7. Implementation Slices

| Slice | Scope | Priority |
| :--- | :--- | :--- |
| S01 | Schema + Admin CRUD mutations + basic queries | P0 |
| S02 | Admin page: Stats + Create Form + Active Table | P0 |
| S03 | Admin page: History Table + Schedule Manager | P1 |
| S04 | User page: Featured + Live Cards + Stats | P1 |
| S05 | User page: Schedule Timeline + Milestones | P2 |
| S06 | Tier access control + filtering | P2 |
| S07 | Mobile parity + push notifications | P3 |
