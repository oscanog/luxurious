# Luxurious Trading Academy — Feature Spec

> Inspired by: **BabyPips School of Pipsology**, **Binance Academy**, **Investopedia Academy**

## Architecture

### Data Flow
```
docs/academy/*.md  →  seed-data.js  →  npx convex run academy:seedLevel  →  Convex DB
                                                                              ↓
                                                               TradingAcademy.tsx (useQuery)
```

### Stack
- **Backend**: Convex (`academyLevels`, `academyLessons`, `academyProgress` tables)
- **CRUD**: `convex/academy.ts` — `upsertLevel`, `upsertLesson`, `deleteLevel`, `deleteLesson`
- **Seed**: `docs/academy/seed-data.js` — JSON payloads matching docs content
- **Frontend**: `TradingAcademy.tsx` — DB-driven, reactive

### Content Parity
All lesson content lives in **two places** (kept in sync):
1. `docs/academy/level-*.md` — Human-readable reference (repo backbone)
2. Convex DB `academyLessons` table — Runtime data (what the app reads)

Seed script ensures parity. Admin CRUD updates DB. Docs updated manually.

---

## Course Structure (4 Levels, 20 Lessons)

| Level | Title | Subtitle | Lessons | Color |
|-------|-------|----------|---------|-------|
| 1 | Market Foundations | Freshman | 5 | Blue |
| 2 | Technical Analysis | Sophomore | 5 | Green |
| 3 | Indicators & Oscillators | Junior | 5 | Gold |
| 4 | Risk Management | Senior | 5 | Red |

---

## Convex Schema

```typescript
academyLevels: { order, title, subtitle, color, description }
  → index: by_order

academyLessons: { levelId, order, slug, title, duration, content }
  → index: by_level, by_slug

academyProgress: { userId, lessonSlug, completedAt }
  → index: by_user, by_user_and_slug
```

## API Reference

| Function | Type | Purpose |
|----------|------|---------|
| `academy:getLevels` | query | List all levels ordered |
| `academy:getLessons` | query | Get lessons for a level |
| `academy:getLesson` | query | Get single lesson by slug |
| `academy:getUserProgress` | query | Get user's completed lessons |
| `academy:completeLesson` | mutation | Mark lesson done |
| `academy:upsertLevel` | mutation | Create/update level (admin) |
| `academy:upsertLesson` | mutation | Create/update lesson (admin) |
| `academy:deleteLevel` | mutation | Delete level + lessons (admin) |
| `academy:deleteLesson` | mutation | Delete lesson (admin) |
| `academy:seedLevel` | internal | Bulk upsert level + lessons |

## Seed Command
```bash
npx convex run academy:seedLevel '{ "order": 1, "title": "Market Foundations", ... }'
```
