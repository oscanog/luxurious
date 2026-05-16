# Post-Mortem: Org Chart Minimap Bug (M011)

## Final Status
Fixed on 2026-05-16.

Desktop minimap now works. Toggle shows minimap reliably. Controls render reliably. No more "toggle does nothing" behavior.

## Real Bug
Bug was not one single thing. It was stack of 4 issues:

1. XYFlow stylesheet was imported through `index.css` with Tailwind v4.
   Result: React Flow panel positioning styles were not reliable.
   Fix: import `@xyflow/react/dist/style.css` directly in `src/main.tsx`.

2. Desktop viewport could not see bottom-corner overlays.
   Result: `<MiniMap />` and `<Controls />` could render, but user still read it as broken because panel sat below visible canvas area on desktop layout.
   Fix: move minimap to top-right and controls to top-left inside canvas.

3. Local node sync was too aggressive.
   Result: React Flow internal measured node state could be lost during prop-to-state sync, which makes v12 minimap behavior fragile.
   Fix: preserve existing node/edge objects first, then layer incoming `data`, `position`, `selected`, and `hidden` fields on top.

4. Minimap colors had no contrast.
   Result: minimap could appear blank even when mounted because node fill and panel background were too similar.
   Fix: restore explicit per-status minimap node colors and visible stroke colors.

## Actual Fix
Files changed:

- `src/main.tsx`
- `src/pages/dashboard/OrgChartPage.tsx`
- `src/index.css`

Implementation details:

- Added `import "@xyflow/react/dist/style.css";` in `src/main.tsx`.
- Switched org chart canvas to `useNodesState`, `useEdgesState`, and `useNodesInitialized`.
- Delayed `fitView` until nodes are initialized.
- Preserved React Flow internal node state during sync.
- Moved minimap panel to `position="top-right"`.
- Moved controls to `position="top-left"` and limited them to zoom buttons.
- Enabled minimap `pannable` and `zoomable`.
- Restored minimap node colors by member status.
- Matched tree layout width to actual org card width (`NODE_WIDTH = 240`).

## Wrong Assumptions We Made

### Wrong Assumption 1
"MiniMap is missing because v12 measurement crashed."

Partly true, not full truth.
Controls do not depend on node measurements the same way minimap node thumbnails do. Missing measurements alone could not explain both symptoms.

### Wrong Assumption 2
"If `<MiniMap />` is mounted, user will see it."

Wrong.
Desktop layout mattered. Bottom-right panel placement was effectively below fold for this canvas/view combination.

### Wrong Assumption 3
"No visible minimap means no rendered minimap."

Wrong.
In some states it could be mounted but visually unreadable because node colors matched panel background too closely.

### Wrong Assumption 4
"`useNodesState` alone solves v12 minimap."

Wrong.
State hook was necessary, but sync strategy still mattered. Internal React Flow state must survive parent updates.

## Learnings

1. For `@xyflow/react` v12, preserve internal node state during sync. Do not replace nodes blindly every render.
2. React Flow stylesheet should stay on direct JS import path in this Vite + Tailwind v4 setup.
3. Overlay placement is product behavior, not cosmetic detail. "Rendered but off-screen" is still broken UX.
4. Minimap needs contrast tuning. Default card-on-card coloring can look like "not rendering".
5. Fit view should wait until nodes initialize, especially with custom node components.

## Verification

Expected desktop behavior now:

1. Click Map icon -> minimap appears in top-right of canvas.
2. Click Map icon again -> minimap hides.
3. Minimap shows status-colored node thumbnails with gold-accent strokes.
4. Zoom controls render in top-left of canvas.
5. Build passes.

Verification done:

- `npm run build` passed after fix.
- `npx eslint src/pages/dashboard/OrgChartPage.tsx` passed after fix.

## Follow-up Guardrails

When touching this page again:

1. Keep React Flow CSS import in `src/main.tsx`.
2. Keep panel UI inside visible desktop viewport.
3. Preserve existing node objects during state sync.
4. Re-check minimap contrast in both light and dark modes.
