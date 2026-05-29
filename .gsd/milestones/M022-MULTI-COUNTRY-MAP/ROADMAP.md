# M022: Multi-Country Map Expansion (Philippines + Canada)

**Status:** `[completed]`\
**Created:** 2026-05-29\
**Last Updated:** 2026-05-29\
**Owner:** Luxurious Desktop

## Objective

Expand the network map and address management to support a second target country: Canada, alongside the Philippines. The user needs the ability to toggle between the two countries during member address updates, have the dropdowns populate properly, resolve geocoding based on the country, and use quick navigation actions on the map view to see specific country boundaries.

---

## Phase 1: Address Data Assets

- [x] Create `public/data/ca/region.json` mimicking the PH structure (Regions).
- [x] Create `public/data/ca/province.json` mapping all CA provinces/territories.
- [x] Create `public/data/ca/city.json` compiling ~130 major CA cities mapped to provinces.

## Phase 2: MemberInspector Address Form

- [x] Add a country toggle at the top of the Address Tab in `MemberInspector.tsx` (🇵🇭 Philippines / 🇨🇦 Canada).
- [x] Persist `selectedCountry` in state, initialized by `addressForm.country`.
- [x] Dynamically load `/data/ph/...` or `/data/ca/...` JSON definitions depending on `selectedCountry`.
- [x] Update the geocoding logic (Nominatim fetch) to append the appropriate country string.
- [x] Make sure saving the form persists the updated country metadata to `networkMembers`.

## Phase 3: Map Quick Fit Triggers

- [x] Refactor the singular "Fit Bounds" button in `LeafletMapView.tsx`.
- [x] Create a pill-shaped button group for:
  - **PH Only (🇵🇭):** Hardcoded bounds mapping to Philippine coordinates `[[4.5, 116.5], [21.5, 127]]`.
  - **CA Only (🇨🇦):** Hardcoded bounds mapping to Canadian coordinates `[[41.6, -141], [83.1, -52.6]]`.
  - **World View (🌍):** Dynamic fit to all active markers (previous default logic).

## Phase 4: Final Validation

- [x] Ensure components render seamlessly in Light and Dark mode.
- [x] Geocoding tests successful for Canadian addresses.
- [x] Map smoothly transitions bounds via `flyToBounds`/`fitBounds` on trigger click.
