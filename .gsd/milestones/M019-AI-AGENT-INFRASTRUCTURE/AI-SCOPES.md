# AI Agent Scopes

All scopes the Luxurious AI agent can query for live workspace data.

## Scopes

| Scope | Tables | What AI Can Answer |
|-------|--------|--------------------|
| **network** | `networkMembers`, `memberAssets` | Member details, org chart, downline counts, status breakdown |
| **trading** | `trades`, `tradingSignals` | Open positions, recent trades, active signals, P&L |
| **finance** | `financialAccounts`, `financialTransactions`, `budgetPlans`, `debtPlans`, `installmentPlans` | Account balances, recent transactions, budget status |
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

## Keyword Detection

| Scope | Trigger Keywords |
|-------|-----------------|
| network | member, network, downline, upline, org, team, recruit, direct, joined, bonchat, yepbit, user, asset, investment, details |
| trading | trade, signal, portfolio, position, buy, sell, entry, stop |
| finance | finance, account, transaction, budget, balance, money, debt, installment |
| academy | academy, lesson, course, learn, progress, level |
| social | social, post, feed, like, comment, hashtag |
| support | ticket, support, help, issue, priority |
| admin | admin, user, system, settings, apk, release |
| presentations | presentation, slide, deck, studio |
| calendar | event, calendar, schedule, upcoming |
| shopping | shopping, grocery, item, list, buy |

## Search Term Extraction

When a user asks about a specific entity (e.g. "details of Melvin Nogoy"), the agent extracts the name and passes it as `searchTerm` to the network scope query, which filters members by name match.

## Bounds

All queries are bounded — no `.collect()`, max `.take(100)` for members, `.take(20)` for transactions, `.take(10)` for most other entities.
