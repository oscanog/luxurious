# M009: Trading Signals Module — Technical Specification

**Objective:** Signal command center with **Schedule-First** focus. Downlines must easily track session times (e.g., 3pm, 8pm) to prepare for signal drops.

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

### `signalParticipation` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `signalId` | `id(tradingSignals)` | Which signal was traded |
| `userId` | `id(users)` | Who traded it |
| `status` | `success \| error` | Outcome |
| `notes` | `optional(string)` | Trade notes |
| `createdAt` | `number` | Timestamp |

### `sessionAttendance` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `date` | `string` | YYYY-MM-DD |
| `userId` | `id(users)` | Who attended |
| `sessionTime` | `string` | "3pm", "6pm", "8pm", "10pm" |
| `attended` | `boolean` | Did they trade? |

### `mobileProfiles.tier` Field
| Value | Signals Visible | Features |
| :--- | :--- | :--- |
| `free` | Max 2 active signals | Basic schedule view |
| `silver` | Max 5 active signals | Full access |
| `gold` | Unlimited | All features + analyst notes |

---

## 2. Backend API

### Mutations (Admin Only)
| Function | Description |
| :--- | :--- |
| `signals.create` | Create new signal with auto riskReward |
| `signals.update` | Partial update on active signal |
| `signals.updateStatus` | Mark TP hit / SL hit / Cancel |
| `signals.toggleFeatured` | Set/unset featured signal |
| `participation.recordParticipation` | Record user success/error per signal |
| `participation.toggleAttendance` | Toggle user session attendance (3pm/6pm/etc.) |

### Queries
| Function | Description |
| :--- | :--- |
| `signals.listActive` | Live signals (tier-filtered for non-admin) |
| `signals.listHistory` | Closed signals |
| `signals.getFeatured` | Current featured signal |
| `participation.getParticipationForSignal` | User list per signal code |
| `participation.getDailyAttendance` | Full attendance grid for a date |

---

## 3. Page Architecture: `TradingSignalsPage.tsx`

### Admin View Layout (Top → Bottom)

| Section | Component | Description |
| :--- | :--- | :--- |
| **Hero** | `DashboardPageHero` | Title + eyebrow badge |
| **Signal Logs** | `StatTile` grid (full-width, `grid-cols-4`) | Signal code cards (e.g., "29", "30") with success/error/pending status. Same design as MembersPage StatTile |
| **Tab Switcher** | Pill-style tab bar | Switches between two tables |
| **Tab 1: Daily Tracking** | `SurfaceCard` table | Columns: User, 3 PM, 6 PM, 8 PM, 10 PM, Actions. ✅/❌ per cell |
| **Tab 2: Access & Promotions** | `SurfaceCard` table | Columns: User, Current Tier (free/silver/gold badge), Promoted Date, Actions |

### User View Layout (Top → Bottom)

| Section | Component | Description |
| :--- | :--- | :--- |
| **Header** | Title + subtitle | "Trading Signals" |
| **Session Drops** | `SessionCard` grid | Today's signal drop times (3pm, 8pm) with session labels |
| **Featured** | `FeaturedSignalCard` | Hero card for Signal of the Week |
| **Live Alerts** | `UserSignalCard` grid | Active signals with copy-to-clipboard |

---

## 4. Implementation Status

| Slice | Scope | Status |
| :--- | :--- | :--- |
| S01 | Schema + indexes + codegen | ✅ Done |
| S02 | Admin CRUD mutations | ✅ Done |
| S03 | Queries (listActive, getFeatured, participation) | ✅ Done |
| S04 | Admin UI — Hero + Signal Logs + Tab Switcher + Tables | ✅ Done |
| S05 | User UI — Session Drops + Featured + Live Alerts | ✅ Done |
| S06 | **Wire real data to Daily Tracking table** | 🔲 Next |
| S07 | **Wire real data to Access & Promotions table** | 🔲 Next |
| S08 | Admin inline CRUD actions (promote tier, toggle attendance) | 🔲 Planned |
| S09 | Mobile parity + push notifications | 🔲 Planned |
