import { useRef, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  type NodeTypes,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { DUMMY_MEMBERS, buildOrgChartNodes, getSubtree, getBreadcrumbs } from "@/data/dummyMembers";
import { OrgCardNode, type OrgCardData } from "./OrgCardNode";
import { ChevronRight } from "lucide-react";

const BRANCH_COLORS = [
  "hsl(221, 83%, 53%)", // Blue
  "hsl(24, 90%, 55%)",  // Orange
  "hsl(142, 70%, 45%)", // Green
  "hsl(348, 83%, 53%)", // Red
  "hsl(262, 83%, 58%)", // Purple
  "hsl(180, 70%, 40%)", // Teal
];

function getBranchColors(members: typeof DUMMY_MEMBERS) {
  const colorMap = new Map<string, string>();
  const root = members.find((m) => m.uplineId === null);
  if (!root) return colorMap;

  colorMap.set(root.id, "hsl(43 96% 48%)");

  const children = members.filter((m) => m.uplineId === root.id);
  children.forEach((child, index) => {
    const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
    function setDescendantsColor(nodeId: string) {
      colorMap.set(nodeId, color);
      const nodeChildren = members.filter((m) => m.uplineId === nodeId);
      nodeChildren.forEach((c) => setDescendantsColor(c.id));
    }
    setDescendantsColor(child.id);
  });

  return colorMap;
}

const nodeTypes: NodeTypes = { orgCard: OrgCardNode };

function buildInitialNodes(viewRootId: string): Node<OrgCardData, "orgCard">[] {
  const positions = buildOrgChartNodes(viewRootId);
  const subtreeMembers = getSubtree(viewRootId);
  const branchColors = getBranchColors(subtreeMembers);

  return subtreeMembers.map((member) => ({
    id: member.id,
    type: "orgCard" as const,
    position: positions[member.id] ?? { x: 0, y: 0 },
    data: {
      member,
      isRoot: member.id === viewRootId,
      branchColor: branchColors.get(member.id),
    },
  }));
}

function buildInitialEdges(viewRootId: string): Edge[] {
  const subtreeMembers = getSubtree(viewRootId);
  const branchColors = getBranchColors(subtreeMembers);

  return subtreeMembers.filter((m) => m.uplineId !== null && m.id !== viewRootId).map((m) => ({
    id: `edge-${m.uplineId}-${m.id}`,
    source: m.uplineId!,
    target: m.id,
    type: "straight",
    animated: false,
    style: { stroke: branchColors.get(m.id) || "var(--oc-connector)", strokeWidth: 2 },
  }));
}

function OrgChartCanvas({ viewRootId, setViewRootId }: { viewRootId: string, setViewRootId: (id: string) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildInitialNodes(viewRootId));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildInitialEdges(viewRootId));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setViewport, getViewport, screenToFlowPosition, fitView } = useReactFlow();

  useEffect(() => {
    setNodes(buildInitialNodes(viewRootId));
    setEdges(buildInitialEdges(viewRootId));
    
    // Animate fitView to smoothly center the new sub-tree
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.1, minZoom: 0.02, maxZoom: 1 });
    }, 50);
  }, [viewRootId, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as OrgCardData;
    // Drill down only if they have downlines and they aren't already the root
    if (data.member.totalDownlines > 0 && node.id !== viewRootId) {
      setViewRootId(node.id);
    }
  }, [viewRootId, setViewRootId]);

  useEffect(() => {
    const elem = wrapperRef.current;
    if (!elem) return;

    const handleWheel = (e: WheelEvent) => {
      // Allow trackpad pinch-to-zoom to use default React Flow behavior
      if (e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();

      const currentZoom = getViewport().zoom;
      const delta = -e.deltaY;
      
      // Boss requested 4x less scrolling (4x faster)
      const SPEED_MULTIPLIER = 4; 
      const zoomMultiplier = Math.pow(2, (delta * 0.002) * SPEED_MULTIPLIER);
      
      let newZoom = currentZoom * zoomMultiplier;
      newZoom = Math.max(0.02, Math.min(newZoom, 1.8)); // Adhere to min/max zoom limits

      const pointerPos = { x: e.clientX, y: e.clientY };
      
      // Calculate coordinates so it zooms exactly where the mouse pointer is
      const flowPosBefore = screenToFlowPosition(pointerPos);
      const newX = pointerPos.x - flowPosBefore.x * newZoom;
      const newY = pointerPos.y - flowPosBefore.y * newZoom;
      
      setViewport({ x: newX, y: newY, zoom: newZoom });
    };

    // Use capture phase to intercept before React Flow's internal d3-zoom
    elem.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => elem.removeEventListener("wheel", handleWheel, { capture: true });
  }, [getViewport, setViewport, screenToFlowPosition]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.02, maxZoom: 1 }}
        minZoom={0.02}
        maxZoom={1.8}
        selectionOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={false} // Custom zoom handles mouse wheel now
        zoomOnPinch={true}   // Keep trackpad pinch zooming
        style={{ background: "hsl(var(--background))" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--border))"
        />
        <Controls
          style={{
            borderRadius: 12,
            overflow: "hidden",
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as OrgCardData;
            if (d?.member?.rank === "Master") return "hsl(43 96% 48%)";
            if (d?.member?.rank === "Diamond") return "hsl(221 83% 53%)";
            return "hsl(var(--muted-foreground))";
          }}
          style={{
            borderRadius: 12,
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function OrgChartPage() {
  const [viewRootId, setViewRootId] = useState("m-001");
  const breadcrumbs = getBreadcrumbs(viewRootId);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {/* Breadcrumb Trail */}
        <div className="flex flex-wrap items-center gap-1 px-6 py-2 border-b border-[hsl(var(--border))]">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.id} className="flex items-center gap-1">
              <button
                onClick={() => setViewRootId(crumb.id)}
                className={`text-sm font-semibold transition-colors hover:text-[hsl(var(--primary))] ${
                  idx === breadcrumbs.length - 1 ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {crumb.name}
              </button>
              {idx < breadcrumbs.length - 1 && (
                <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))]" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            Total Members
          </span>
          <span
            className="px-2.5 py-0.5 rounded-xl text-xs font-bold"
            style={{ background: "hsl(43 96% 48% / 0.12)", color: "hsl(43 96% 38%)" }}
          >
            {DUMMY_MEMBERS.length}
          </span>
        </div>
        <div className="w-px h-4 bg-[hsl(var(--border))]" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(152 69% 42%)" }} />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {DUMMY_MEMBERS.filter((m) => m.status === "active").length} Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(37 92% 50%)" }} />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {DUMMY_MEMBERS.filter((m) => m.status === "pending").length} Pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 84% 61%)" }} />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {DUMMY_MEMBERS.filter((m) => m.status === "inactive").length} Inactive
          </span>
        </div>
        <p className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
          Drag to rearrange · Scroll to zoom · Ctrl+scroll for zoom
        </p>
      </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <OrgChartCanvas viewRootId={viewRootId} setViewRootId={setViewRootId} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
