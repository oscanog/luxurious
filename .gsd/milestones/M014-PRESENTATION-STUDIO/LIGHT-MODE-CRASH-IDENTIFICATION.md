# M014 Bug Identification: Presentation Editor Theme Toggle Crash

## Summary

- Bug: theme toggle on presentation editor hard-freezes browser tab.
- Repro URL: `/admin/presentations/q974v3wv2jwhjd3fb4jrbnvjp586xgx4/edit`
- Repro account: `alice@luxurious.trade`
- Repro result: clicking theme toggle causes renderer hang. Playwright click timed out. Follow-up snapshot/console calls also timed out, which means main thread locked, not simple handled exception.

## Reproduction

1. Sign in with `alice@luxurious.trade` / `password123`.
2. Open `/admin/presentations/q974v3wv2jwhjd3fb4jrbnvjp586xgx4/edit`.
3. Click theme toggle in left sidebar.
4. App freezes before console can flush usable stack.

## Observed Evidence

- Editor loads normally before toggle.
- Theme toggle elsewhere works.
- Freeze happens only on Fabric-backed presentation editor route.
- After click, browser automation cannot finish `click`, `snapshot`, or `console` calls. Strong sign of synchronous render/event loop lock.

## Root Cause

Most likely root cause is feedback loop between Fabric JSON reload and editor autosave state.

### Loop path

1. Theme toggle flips root `.dark` class in [src/lib/theme.ts](</c:/projects/convex/luxurious/src/lib/theme.ts:18>).
2. That rerenders app shell and editor.
3. Fabric canvas hook is fragile because it binds canvas lifecycle to `canvasElRef.current` in [src/components/presentations/useFabricCanvas.ts](</c:/projects/convex/luxurious/src/components/presentations/useFabricCanvas.ts:48>). On rerender/theme change, canvas can be disposed and recreated.
4. When canvas becomes ready again, editor reloads active slide JSON in [src/components/presentations/PresentationEditor.tsx](</c:/projects/convex/luxurious/src/components/presentations/PresentationEditor.tsx:159>).
5. `loadFromJSON()` repopulates canvas in [src/components/presentations/useFabricCanvas.ts](</c:/projects/convex/luxurious/src/components/presentations/useFabricCanvas.ts:100>).
6. Same hook treats `object:added` and `object:removed` as user edits in [src/components/presentations/useFabricCanvas.ts](</c:/projects/convex/luxurious/src/components/presentations/useFabricCanvas.ts:78>).
7. Those events call `scheduleSave()`, which mutates `slides` state in [src/components/presentations/PresentationEditor.tsx](</c:/projects/convex/luxurious/src/components/presentations/PresentationEditor.tsx:167>).
8. `slides` is dependency of load effect in [src/components/presentations/PresentationEditor.tsx](</c:/projects/convex/luxurious/src/components/presentations/PresentationEditor.tsx:159>), so editor loads JSON again.
9. Repeat until tab locks.

## Why Theme Toggle Triggers It

Theme toggle itself is not bad. It exposes existing editor bug:

- canvas lifecycle tied to rerender-sensitive ref dependency
- no guard to suppress change events during programmatic `loadFromJSON()`
- load effect depends on whole `slides` array, so synthetic save updates retrigger load

Any rerender or canvas reinit can trip same loop. Theme toggle is easiest repro.

## Exact Fault Lines

- `useFabricCanvas` listens to:
  - `object:modified`
  - `object:added`
  - `object:removed`
- `loadFromJSON()` is programmatic hydration, not user edit.
- Hydration events should not write back into editor state.

## Fix Direction

1. Add hydration guard in `useFabricCanvas`:
   - set `isHydratingRef.current = true` before `loadFromJSON()`
   - ignore `object:added` / `object:removed` / `object:modified` while hydrating
   - clear guard after render completes
2. Stop using `[canvasElRef.current]` as effect dependency.
   - initialize canvas once from stable ref/effect
3. Narrow slide-load effect dependency.
   - depend on active slide JSON, not full `slides` array when possible
4. Optional hardening:
   - compare next JSON before `setSlides`
   - do not schedule save for no-op JSON

## Severity

- Severity: high
- Impact: admin editor unusable when theme toggled
- Scope: M014 presentation editor route

## Confidence

- Repro confidence: high
- Root-cause confidence: medium-high
- Missing artifact: direct console stack, because browser thread freezes before console export completes
