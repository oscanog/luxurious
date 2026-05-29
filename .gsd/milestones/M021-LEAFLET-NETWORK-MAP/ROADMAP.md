# M021: Leaflet Network Map

**Status:** `[pending]`\
**Created:** 2026-05-29\
**Last Updated:** 2026-05-29\
**Owner:** Luxurious Desktop (OrgChartPage)

## Objective

Add a **map view** to the existing `/org-chart` page. A single toggle switches
between the current ReactFlow org canvas and a Leaflet map showing member
locations as pins. Must be lightweight — the org chart canvas is already
resource-heavy, so Leaflet loads **only** when the map view is active.

---

## Answers to Your Questions

### 1. Schema — Location Fields

Add **optional** location fields to `networkMembers`. No existing data breaks.

```ts
// convex/schema.ts — networkMembers (new optional fields)
city: v.optional(v.string()),          // e.g. "Makati"
province: v.optional(v.string()),      // e.g. "Metro Manila"
country: v.optional(v.string()),       // e.g. "Philippines"
locationAddress: v.optional(v.string()), // freeform full address (see #2)
latitude: v.optional(v.number()),      // resolved lat
longitude: v.optional(v.number()),     // resolved lng
```

- `city`, `province`, `country` — **optional strings** (no migration needed).
- `latitude`, `longitude` — cached coords so we don't geocode on every load.

### 2. Can You Input a Location Address?

**Yes.** Add `locationAddress` as an optional freeform string. Use it for:

- Display in tooltips/popups on the map.
- Input field in the Add/Edit Member form.
- Geocoding source (resolve to lat/lng via a geocoding API or manual input).

Two geocoding strategies (pick during implementation):

| Strategy | Pros | Cons |
|---|---|---|
| **Client-side Nominatim** (free, OpenStreetMap) | Zero cost, no API key | Rate-limited, less accurate |
| **Server-side geocoding** (Google/Mapbox) | Accurate, fast | Requires API key + cost |

> Start with Nominatim. Upgrade later if accuracy matters.

### 3. Advanced Tools, Features, Search

Built into the map toolbar:

- **Member search** — reuse existing search bar; when map active, fly-to pin.
- **Filter by status** — reuse existing status filter; hide/show pins by status.
- **Filter by country/province** — dropdown to quickly scope geography.
- **Cluster markers** — auto-group nearby pins at low zoom (Leaflet.markercluster).
- **Fly-to-member** — click member in sidebar → map flies to their pin.
- **Pin popup** — shows name, role, status, city/country, investment date.
- **Fit all bounds** — button to zoom map to fit all visible pins.
- **Export view** — (future) screenshot map as image for presentations.

### 4. Lightweight Toggle (Boss Requirement)

Architecture constraints:

- **Lazy import** Leaflet + CSS only when map view activates. Zero bundle cost
  when using org chart.
- **Single `viewMode` state** — `"canvas" | "map"`. Toggle button in the
  existing toolbar (same row as filters/minimap/info buttons).
- Org canvas **unmounts** when map shows (no dual render).
- Map **unmounts** when canvas shows (memory freed immediately).
- No new route — same `/org-chart` URL, just a display toggle.

---

## Phase 1: Schema & Data Layer

- [x] Add optional location fields to `networkMembers` in `convex/schema.ts`:
      `city`, `province`, `country`, `locationAddress`, `latitude`, `longitude`.
- [x] Run `npx convex codegen` — confirm no breaking changes.
- [x] Add location fields to Add/Edit Member forms (city, province, country
      required group + optional address).
- [x] Add `updateMemberLocation` mutation in `convex/network.ts`.
- [x] Add location fields to `getDashboard` query tree node shape so they flow
      to the frontend.

## Phase 2: View Toggle

- [x] Add `viewMode` state (`"canvas" | "map"`) to `OrgChartContent`.
- [x] Add toggle button in the toolbar row (between hierarchy toggle and
      filter bar). Use `Network` icon for canvas, `MapPin` icon for map.
- [x] Conditionally render `OrgChartCanvas` (canvas mode) or `LeafletMapView`
      (map mode) — never both.
- [x] Ensure search bar, status filter, and sidebar still work in both modes.

## Phase 3: Leaflet Map Component

- [x] Install `leaflet` + `react-leaflet` + `@types/leaflet`.
- [x] Create `src/components/org-chart/LeafletMapView.tsx` — lazy loaded via
      `React.lazy` + `Suspense`.
- [x] Load Leaflet CSS dynamically (import in component, not global).
- [x] Use OpenStreetMap tile layer (free, no API key needed).
- [x] Render member pins from `networkMembers` that have valid `latitude` +
      `longitude`.
- [x] Pin color matches status (same palette as org chart minimap):
      - Joined → blue `hsl(221 83% 53%)`
      - Invited → gold `hsl(43 96% 48%)`
      - Pending → gray `hsl(215 16% 47%)`
      - To-Invite → dark `hsl(217 19% 27%)`
- [x] Pin popup: member name, role, status badge, city/country, investment
      date.
- [x] Implement marker clustering via `leaflet.markercluster` for performance.
- [x] Add "Fit Bounds" control to zoom to all visible pins.
- [x] Style map container to match existing `h-[760px] rounded-[36px]`
      org chart wrapper.

## Phase 4: Map Tools & Search

- [x] Wire existing search bar to map: on match → `map.flyTo(member.latlng)`.
- [x] Wire existing status filter to map: filter visible pins by status.
- [x] Add country/province filter dropdown (populated from member data).
- [x] Click pin → set `selectedId` → `MemberInspector` shows (same as canvas).
- [x] Click member in sidebar → `map.flyTo()` to their pin.
- [x] Add member count overlay on map (e.g. "Showing 42 of 128 members").

## Phase 5: Geocoding & Polish

- [x] Add optional geocoding helper: resolve `locationAddress` or
      `city + province + country` → `latitude` + `longitude`.
- [x] Choose strategy: client-side Nominatim or server-side provider.
- [x] Add "Resolve Location" button in member edit form that triggers geocode.
- [x] Handle missing coords gracefully: members without lat/lng get listed in a
      "No Location" sidebar section.
- [x] Run `npx convex codegen`.
- [x] Run `npx tsc --noEmit`.
- [x] Run targeted ESLint on touched files.
- [x] Manual QA: toggle canvas ↔ map, verify no memory leak or stale renders.

---

## Acceptance Criteria

- [x] Toggle button switches between org canvas and Leaflet map in < 200ms
      perceived transition.
- [x] Leaflet bundle loads lazily — zero impact on org chart initial load.
- [x] Members with lat/lng display as colored pins on the map.
- [x] Pin popup shows member info; clicking pin opens `MemberInspector`.
- [x] Search and status filters work identically in both view modes.
- [x] Marker clustering activates at zoom levels showing > 50 pins.
- [x] Members without location data are excluded from map but still visible in
      canvas view.
- [x] No new route — same `/org-chart` URL for both views.
- [x] `npm run lint` passes on all M021-touched files.

## Files Touched (Estimated)

| File | Change |
|---|---|
| `convex/schema.ts` | Add 6 optional fields to `networkMembers` |
| `convex/network.ts` | Add `updateMemberLocation`, propagate fields in dashboard |
| `src/pages/dashboard/OrgChartPage.tsx` | Add `viewMode` toggle, conditional render |
| `src/components/org-chart/LeafletMapView.tsx` | **New** — lazy Leaflet map component |
| `src/components/org-chart/AddMemberStepper.tsx` | Add location input fields |
| `src/components/org-chart/MemberInspector.tsx` | Show location data |
| `package.json` | Add `leaflet`, `react-leaflet`, `leaflet.markercluster` |

## Notes

- Leaflet + OpenStreetMap tiles = **zero API cost**. No keys needed for tiles.
- Geocoding (Nominatim) is free but rate-limited to 1 req/sec. Batch geocode
  during member creation, cache result in `latitude`/`longitude`.
- If boss wants real-time "where are my members" → future milestone could add
  live location tracking via mobile app GPS. This milestone = static pins from
  stored address data only.
