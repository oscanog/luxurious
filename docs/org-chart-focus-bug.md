# 🎯 Org Chart Canvas Focus Centering — Definitive Architecture

> [!IMPORTANT]
> This document tracks the complete interaction flow, root causes, and the final "Powerful Approach" for the canvas focus bug. It serves as the ultimate blueprint to prevent lifecycle racing and ensure the map zooms correctly to a specific member.

---

## 🛑 The 5 Mistakes Made (Chronological Log)

1. **Relying on standard React `useEffect` with state**: Failed because state updates race with React Flow node updates. The target node could not be found because `flowNodes` had not yet re-rendered.
2. **Using `async fitView({ nodes: [{ id }] })` in a retry loop**: Failed because the Promise resolves `true` instantly even when the React Flow layout is unmeasured, causing the fallback code to never execute.
3. **Using a manual retry loop for `setCenter` outside React Flow's lifecycle**: Failed because the `<ReactFlow fitView>` prop was still present. It automatically refitted the entire graph whenever nodes changed, steamrolling our manual `setCenter` command.
4. **Removing the `fitView` prop and using a DOM presence check (`document.querySelector`)**: Failed because `FitViewOnLoad` or React's render-then-commit cycle still fired late, or the DOM check didn't guarantee the internal SVG node dimensions were fully computed by the canvas.
5. **Using `fitView({ nodes: [{ id }] })` inside a `FocusController` component**: Failed because React Flow has a known limitation: if the targeted node's internal dimension bounds are still `0` in the engine (even if `nodesInitialized` is true), it silently falls back to fitting the **entire graph**. This resulted in the exact same zoomed-out bug.

---

## 🗺️ The Flow (Step-by-Step)

When a user wants to focus on a specific member (e.g., "Jane Fernandez"), the system goes through this exact sequence:

1. **User Interaction**: User clicks the "Focus" button in the sidebar or clicks a search result.
2. **State Updates**: 
   - `setIsSidebarOpen(false)` triggers the sidebar to slide out of view.
   - **Filter Resets**: If the member is hidden, `setIsProjectionView(true)` and `setStatusFilter("All")` are called.
   - `setSelectedId(memberId)` highlights the node.
3. **Data Recalculation**: The `useMemo` hooks recalculate `flowNodes`, adding the previously hidden member to the array.
4. **ReactFlow Update**: The `OrgChartCanvas` receives the new `propNodes` and triggers its internal `setNodes`.
5. **ReactFlow Lifecycle (The Danger Zone)**: ReactFlow detects new nodes, sets `nodesInitialized` to `false`, and waits for the browser's `ResizeObserver` to measure the new DOM elements.

---

## 🚀 The Powerful Approach (Solution 6: Direct Coordinate Translation)

We must stop relying on React Flow's `fitView` to find the node for us. It falls back to the full graph if bounds aren't perfect.
Instead, we know the **exact mathematical coordinates** of the node because we calculated them in `buildFlowTree`! 

### The Implementation Plan:

1. **Find Member X Y Position in Canvas**:
   Inside `FocusController`, we use `useNodes()` to get the current reactive array of nodes directly from React Flow's engine.
   We find the node matching `focusNodeId`.
   We extract `node.position.x` and `node.position.y`.

2. **Calculate Center Offset**:
   Since the node's position is its top-left corner, and we know our `NODE_WIDTH` is 240px and `NODE_HEIGHT` is roughly 200px, the absolute center of the node is `x + 120, y + 100`.

3. **Force Translation via `setCenter`**:
   We use `setCenter(x + 120, y + 100, { zoom: 0.8, duration: 800 })`. This strictly forces the canvas coordinates, bypassing any internal dimension calculations or bounds fallbacks.

```typescript
function FocusController({ focusNodeId, onFocusComplete }) {
  const { setCenter } = useReactFlow();
  const nodes = useNodes();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (focusNodeId && nodesInitialized) {
      // 1. Find member X Y position in canvas
      const targetNode = nodes.find(n => n.id === focusNodeId);
      
      if (targetNode) {
        // 2. Add a tiny delay to ensure the sidebar transition has started
        const t = setTimeout(() => {
          // 3. Force coordinate centering (x + 120, y + 100)
          setCenter(
            targetNode.position.x + 120, 
            targetNode.position.y + 100, 
            { duration: 800, zoom: 0.8 }
          );
          onFocusComplete();
        }, 50);
        return () => clearTimeout(t);
      }
    }
  }, [focusNodeId, nodesInitialized, nodes, setCenter, onFocusComplete]);

  return null;
}
```

This guarantees that even if React Flow thinks the node dimensions are 0x0, it doesn't matter. The camera is strictly translating to the exact mathematical coordinates.
