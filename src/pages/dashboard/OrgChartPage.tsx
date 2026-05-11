import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
  useNodesInitialized,
  type Edge,
  type Node,
} from "@xyflow/react";
import { OrgCardNode, type OrgCardData } from "./OrgCardNode";
import { ChevronRight, Users } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { MemberSidebar } from "./MemberSidebar";

// Helper for initials
const getInitials = (name?: string) => {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const BRANCH_COLORS = [
  "hsl(221, 83%, 53%)", // Blue
  "hsl(24, 90%, 55%)",  // Orange
  "hsl(142, 70%, 45%)", // Green
  "hsl(348, 83%, 53%)", // Red
  "hsl(262, 83%, 58%)", // Purple
  "hsl(180, 70%, 40%)", // Teal
];

const RADIUS_STEP = 1200;

function buildOrgChartPositions(rootId: string, members: Doc<"users">[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const childrenMap = new Map<string, string[]>();
  
  members.forEach(m => {
    if (m.uplineId) {
      const parentId = m.uplineId;
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(m._id);
    }
  });

  function assignRadial(id: string, depth: number, startAngle: number, endAngle: number) {
    const angle = (startAngle + endAngle) / 2;
    const radius = depth * RADIUS_STEP;
    
    positions[id] = {
      x: radius * Math.cos(angle) - 110,
      y: radius * Math.sin(angle) - 60
    };

    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) return;

    const sliceSize = (endAngle - startAngle) / children.length;
    let currentAngle = startAngle;
    
    for (const c of children) {
      assignRadial(c, depth + 1, currentAngle, currentAngle + sliceSize);
      currentAngle += sliceSize;
    }
  }

  assignRadial(rootId, 0, 0, 2 * Math.PI);
  return positions;
}

function getBranchColors(rootId: string, members: Doc<"users">[]) {
  const colorMap = new Map<string, string>();
  colorMap.set(rootId, "hsl(43 96% 48%)");

  const children = members.filter((m) => m.uplineId === rootId);
  children.forEach((child, index) => {
    const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
    function setDescendantsColor(nodeId: string) {
      colorMap.set(nodeId, color);
      const nodeChildren = members.filter((m) => m.uplineId === nodeId);
      nodeChildren.forEach((c) => setDescendantsColor(c._id));
    }
    setDescendantsColor(child._id);
  });

  return colorMap;
}

const nodeTypes: NodeTypes = { orgCard: OrgCardNode };

function OrgChartCanvas({ 
  viewRootId, 
  setViewRootId, 
  members 
}: { 
  viewRootId: string, 
  setViewRootId: (id: string) => void,
  members: Doc<"users">[]
}) {
  const positions = useMemo(() => buildOrgChartPositions(viewRootId, members), [viewRootId, members]);
  const branchColors = useMemo(() => getBranchColors(viewRootId, members), [viewRootId, members]);

  const initialNodes: Node<OrgCardData, "orgCard">[] = useMemo(() => {
    // Only show nodes that have positions (reachable from root)
    return members
      .filter(m => positions[m._id])
      .map((member) => ({
        id: member._id,
        type: "orgCard" as const,
        position: positions[member._id],
        data: {
          member: {
            id: member._id,
            name: member.name ?? "Anonymous",
            email: member.email ?? "",
            rank: (member.role === "admin" ? "Master" : "Bronze"), // Map role to rank for now
            status: "active",
            uplineId: member.uplineId ?? null,
            joinDate: new Date(member._creationTime).toLocaleDateString(),
            totalDownlines: members.filter(m => m.uplineId === member._id).length,
            invitedCount: 0,
            pendingCount: 0,
            avatarInitials: getInitials(member.name),
          },
          isRoot: member._id === viewRootId,
          branchColor: branchColors.get(member._id),
        },
      }));
  }, [members, positions, branchColors, viewRootId]);

  const initialEdges: Edge[] = useMemo(() => {
    return members
      .filter((m) => m.uplineId && positions[m._id] && m._id !== viewRootId)
      .map((m) => ({
        id: `edge-${m.uplineId}-${m._id}`,
        source: m.uplineId!,
        target: m._id,
        type: "straight",
        animated: false,
        style: { stroke: branchColors.get(m._id) || "var(--oc-connector)", strokeWidth: 2 },
      }));
  }, [members, positions, branchColors, viewRootId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setViewport, getViewport, screenToFlowPosition, fitView, setCenter } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (nodesInitialized && isMobile) {
      void setCenter(-30, 0, { zoom: 1.5, duration: 400 });
    }
  }, [nodesInitialized, setCenter]);

  useEffect(() => {
    setTimeout(() => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        void setCenter(-30, 0, { zoom: 1.5, duration: 800 });
      } else {
        void fitView({ duration: 800, padding: 0.1, minZoom: 0.02, maxZoom: 1 });
      }
    }, 400);
  }, [viewRootId, fitView, setCenter]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as OrgCardData;
    if (data.member.totalDownlines > 0 && node.id !== viewRootId) {
      setViewRootId(node.id);
    }
  }, [viewRootId, setViewRootId]);

  // Wheel handling...
  useEffect(() => {
    const elem = wrapperRef.current;
    if (!elem) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      const currentZoom = getViewport().zoom;
      const delta = -e.deltaY;
      const SPEED_MULTIPLIER = 4; 
      const zoomMultiplier = Math.pow(2, (delta * 0.002) * SPEED_MULTIPLIER);
      let newZoom = currentZoom * zoomMultiplier;
      newZoom = Math.max(0.02, Math.min(newZoom, 1.8));
      const pointerPos = { x: e.clientX, y: e.clientY };
      const flowPosBefore = screenToFlowPosition(pointerPos);
      const newX = pointerPos.x - flowPosBefore.x * newZoom;
      const newY = pointerPos.y - flowPosBefore.y * newZoom;
      void setViewport({ x: newX, y: newY, zoom: newZoom });
    };
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
        minZoom={0.1}
        maxZoom={2.0}
        translateExtent={[[-5000, -5000], [5000, 5000]]}
        panOnDrag={true}
        zoomOnScroll={false}
        zoomOnPinch={true}
        style={{ background: "hsl(var(--background))" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls style={{ borderRadius: 12, overflow: "hidden" }} />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as OrgCardData;
            if (d?.member?.rank === "Master") return "hsl(43 96% 48%)";
            return "hsl(var(--muted-foreground))";
          }}
          style={{ borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  );
}

export function OrgChartPage() {
  return (
    <ReactFlowProvider>
      <OrgChartPageContent />
    </ReactFlowProvider>
  );
}

function OrgChartPageContent() {
  const viewer = useQuery(api.users.viewer);
  const members = useQuery(api.users.listWithHierarchy) ?? [];
  const [viewRootId, setViewRootId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (viewer && !viewRootId) {
      setViewRootId(viewer._id);
    }
  }, [viewer, viewRootId]);

  const breadcrumbs = useMemo(() => {
    if (!viewRootId || members.length === 0) return [];
    const crumbs: { id: string; name: string }[] = [];
    let currId: string | null = viewRootId;
    while (currId) {
      const m = members.find(u => u._id === currId);
      if (!m) break;
      crumbs.unshift({ id: m._id, name: m.name ?? "Anonymous" });
      currId = m.uplineId ?? null;
    }
    return crumbs;
  }, [viewRootId, members]);

  const visibleMembersList = useMemo(() => {
    const positions = buildOrgChartPositions(viewRootId, members);
    return members
      .filter(m => positions[m._id])
      .map(m => ({ id: m._id, name: m.name ?? "Anonymous", role: m.role }));
  }, [viewRootId, members]);

  if (!viewRootId || members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-[hsl(var(--muted-foreground))]">Loading Organization Chart...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-[hsl(var(--border))] overflow-x-auto">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.id} className="flex items-center gap-1 shrink-0">
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

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">Total Members</span>
            <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold" style={{ background: "hsl(43 96% 48% / 0.12)", color: "hsl(43 96% 38%)" }}>
              {members.length}
            </span>
          </div>
          <div className="w-px h-4 bg-[hsl(var(--border))]" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(152 69% 42%)" }} />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Active</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] hidden lg:block">Click card to focus · Scroll to zoom</p>
            <button
              onClick={() => void fitView({ duration: 400, padding: 0.2 })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.8)] text-[hsl(var(--secondary-foreground))] text-xs font-bold transition-all active:scale-95"
            >
              <Users size={14} />
              Fit View
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <OrgChartCanvas viewRootId={viewRootId} setViewRootId={setViewRootId} members={members} />
        <MemberSidebar 
          currentPivotId={viewRootId} 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          visibleMembers={visibleMembersList}
          onSuccess={() => {
            setTimeout(() => {
              void fitView({ duration: 800, padding: 0.1 });
            }, 100);
          }}
        />
      </div>
    </div>
  );
}
