# AI Agent Scopes

All scopes the Luxurious AI agent can query for live workspace data.

## Scopes

| Scope | Tables | What AI Can Answer |
|-------|--------|--------------------|
| **network** | `networkMembers`, `memberAssets` | Member details, org chart, downline counts, status breakdown, latest Org Studio asset log per member |
| **trading** | `trades`, `tradingSignals` | Open positions, recent trades, active signals, P&L |
| **finance** | `financialAccounts`, `financialTransactions`, `budgetPlans`, `debtPlans`, `installmentPlans` | Finance Banking & Assets account balances, recent transactions, budget status |
| **academy** | `academyLevels`, `academyLessons`, `academyProgress` | Course progress, completed lessons, available levels |
| **social** | `socialPosts`, `socialPostComments`, `socialPostLikes` | Published posts, engagement stats |
| **support** | `tickets` | Open tickets, priorities, statuses |
| **admin** | `users`, `aiSettings`, `apkReleases` | User count, system health, APK versions (admin only) |
| **presentations** | `presentations` | User's decks, slide counts, last updated |
| **calendar** | `events` | Upcoming events by category |
| **shopping** | `shoppingItems` | Shopping list items, checked status |

## How It Works

1. User sends message via floating chat badge.
2. Agent detects relevant scopes from keywords in the message.
3. Agent calls `internal.aiContext.gatherContext` with detected scopes.
4. Query fetches bounded data from Convex tables for each scope.
5. Formatted workspace data injected into DeepSeek prompt as system context.
6. DeepSeek answers using live data.

## Asset Rules

- **Org Studio card asset / latest member asset** comes from `memberAssets`.
- `memberAssets` entries are asset logs tied to `networkMembers`.
- Latest Org Studio asset is newest `memberAssets.createdAt` for that member, with same-user and same-name matching used for unified org chart records.
- **Finance Banking & Assets** comes from `financialAccounts` and `financialTransactions`.
- Finance accounts are profile banking/cash/investment balances. They are separate from org chart member asset logs.
- If user asks "latest asset of Florence Nogoy" or similar member-name asset question, answer from **network** scope / `memberAssets`, not finance accounts.

## Keyword Detection

| Scope | Trigger Keywords |
|-------|-----------------|
| network | member, network, downline, upline, org, team, recruit, direct, joined, bonchat, yepbit, user, asset, investment, details |
| trading | trade, signal, portfolio, position, buy, sell, entry, stop |
| finance | finance, financial, banking, bank, account, accounts, currency, ledger, transaction, budget, balance, money, cash, debt, installment |
| academy | academy, lesson, course, learn, progress, level |
| social | social, post, feed, like, comment, hashtag |
| support | ticket, support, help, issue, priority |
| admin | admin, user, system, settings, apk, release |
| presentations | presentation, slide, deck, studio |
| calendar | event, calendar, schedule, upcoming |
| shopping | shopping, grocery, item, list, buy |

## Search Term Extraction

When a user asks about a specific entity (e.g. "details of Melvin Nogoy", "latest asset of Florence Nogoy"), the agent extracts the name and passes it as `searchTerm` to the network scope query, which filters members by name match and includes latest/recent org chart asset logs.

## Bounds

All queries are bounded — no `.collect()`, max `.take(100)` for members, `.take(20)` for transactions, `.take(10)` for most other entities.
