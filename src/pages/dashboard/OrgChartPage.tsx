import { useEffect, useMemo, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Position,
  type Edge,
  type Node,
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
} from "@xyflow/react";
import { 
  ArrowLeft, 
  Focus, 
  Users, 
  Search, 
  SlidersHorizontal,
  ChartColumn,
  Map as MapIcon,
  Info,
  Network,
  Check,
  Mail,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { OrgCardNode, type OrgCardData } from "../../components/org-chart/OrgCardNode";
import { MemberSidebar } from "../../components/org-chart/MemberSidebar";
import { MemberInspector } from "../../components/org-chart/MemberInspector";
import { AddMemberStepper } from "../../components/org-chart/AddMemberStepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContextMenu } from "../../components/ui/useContextMenu";
import { type ContextMenuItem } from "../../components/ui/ContextMenu";
import { cn } from "@/lib/utils";

const LeafletMapView = lazy(() => import("../../components/org-chart/LeafletMapView"));

type OrgStatus = OrgCardData["member"]["status"];

type OrgTreeNode = {
  id: string;
  name: string;
  roleTitle: string;
  status: OrgStatus;
  isViewer: boolean;
  directChildrenCount: number;
  totalDownlineCount: number;
  member: OrgCardData["member"];
  children: OrgTreeNode[];
};

export type OrgFlowData = {
  id: string;
  name: string;
  roleTitle: string;
  status: OrgStatus;
  isViewer: boolean;
  member: OrgCardData["member"];
};

const NODE_WIDTH = 240;
const HORIZONTAL_GAP = 92;
const VERTICAL_GAP = 230;

const nodeTypes = {
  "org-card": OrgCardNode,
};

function getMiniMapNodeColor(node: Node<OrgFlowData>) {
  if (node.data.isViewer) {
    return "hsl(43 96% 48%)";
  }

  switch (node.data.status) {
    case "joined":
      return "hsl(221 83% 53%)";
    case "invited":
      return "hsl(43 96% 48%)";
    case "pending":
      return "hsl(215 16% 47%)";
    case "to-invite":
      return "hsl(217 19% 27%)";
    default:
      return "hsl(var(--muted))";
  }
}

function getMiniMapNodeStroke(node: Node<OrgFlowData>) {
  if (node.data.isViewer) {
    return "hsl(43 96% 55%)";
  }

  return node.hidden ? "hsl(var(--border))" : "hsl(43 96% 48% / 0.55)";
}

function measureSubtree(node: OrgTreeNode): number {
  if (node.children.length === 0) {
    return NODE_WIDTH;
  }

  const childrenWidth =
    node.children.map(measureSubtree).reduce((sum, width) => sum + width, 0) +
    HORIZONTAL_GAP * (node.children.length - 1);

  return Math.max(NODE_WIDTH, childrenWidth);
}

function buildFlowTree(roots: OrgTreeNode[]): { nodes: Array<Node<OrgFlowData>>; edges: Edge[] } {
  const nodes: Array<Node<OrgFlowData>> = [];
  const edges: Edge[] = [];

  function visit(node: OrgTreeNode, depth: number, leftEdge: number, parentId?: string) {
    const subtreeWidth = measureSubtree(node);
    const nodeX = leftEdge + subtreeWidth / 2 - NODE_WIDTH / 2;
    const nodeY = depth * VERTICAL_GAP;

    nodes.push({
      id: node.id,
      type: "org-card",
      position: { x: nodeX, y: nodeY },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        id: node.id,
        name: node.name,
        roleTitle: node.roleTitle,
        status: node.status,
        isViewer: node.isViewer,
        member: {
          ...node.member,
          directChildrenCount: node.directChildrenCount,
          totalDownlines: node.totalDownlineCount,
        },
      },
      draggable: false,
      selectable: true,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "default",
        animated: false,
        style: {
          stroke: "hsl(43 96% 48% / 0.55)",
          strokeWidth: 2.4,
        },
      });
    }

    let cursor = leftEdge;
    for (const child of node.children) {
      const childWidth = measureSubtree(child);
      visit(child, depth + 1, cursor, node.id);
      cursor += childWidth + HORIZONTAL_GAP;
    }
  }

  let rootLeft = 0;
  for (const root of roots) {
    const rootWidth = measureSubtree(root);
    visit(root, 0, rootLeft);
    rootLeft += rootWidth + HORIZONTAL_GAP * 2;
  }

  return { nodes, edges };
}

function getDownlineStats(children: OrgTreeNode[]): { total: number; joined: number; prospect: number } {
  return children.reduce(
    (stats, child) => {
      const isJoined = child.status === "joined";
      const isProspect = child.status !== "joined";
      
      const childStats = getDownlineStats(child.children);
      
      return {
        total: stats.total + 1 + childStats.total,
        joined: stats.joined + (isJoined ? 1 : 0) + childStats.joined,
        prospect: stats.prospect + (isProspect ? 1 : 0) + childStats.prospect,
      };
    },
    { total: 0, joined: 0, prospect: 0 }
  );
}

function projectOrgNode(
  node: OrgTreeNode,
  options: {
    isProjectionView: boolean;
    selectedId: string | null;
  },
): OrgTreeNode | null {
  const projectedChildren = node.children
    .map((child) => projectOrgNode(child, options))
    .filter((child): child is OrgTreeNode => child !== null);

  const statusVisible =
    node.isViewer || options.isProjectionView || node.status === "joined";
  const shouldKeep =
    statusVisible || projectedChildren.length > 0 || node.id === options.selectedId;

  if (!shouldKeep) {
    return null;
  }

  const directChildrenCount = projectedChildren.length;
  const stats = getDownlineStats(projectedChildren);

  return {
    ...node,
    directChildrenCount,
    totalDownlineCount: stats.total,
    member: {
      ...node.member,
      directChildrenCount,
      totalDownlines: stats.total,
      joinedDownlines: stats.joined,
      prospectDownlines: stats.prospect,
    },
    children: projectedChildren,
  };
}

function projectOrgTree(
  roots: OrgTreeNode[],
  options: {
    isProjectionView: boolean;
    selectedId: string | null;
  },
): OrgTreeNode[] {
  return roots
    .map((root) => projectOrgNode(root, options))
    .filter((root): root is OrgTreeNode => root !== null);
}

function flattenOrgTree(roots: OrgTreeNode[]): OrgTreeNode[] {
  const nodes: OrgTreeNode[] = [];

  const visit = (node: OrgTreeNode) => {
    nodes.push(node);
    node.children.forEach(visit);
  };

  roots.forEach(visit);
  return nodes;
}

// Using imported OrgCardNode from components

function FitViewOnLoad({ isReady }: { isReady: boolean }) {
  const { fitView } = useReactFlow();

  const hasFitted = useRef(false);

  useEffect(() => {
    if (!isReady || hasFitted.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fitView({ duration: 500, padding: 0.28, minZoom: 0.2, maxZoom: 1.15 });
      hasFitted.current = true;
    }, 80);
    return () => window.clearTimeout(timer);
  }, [fitView, isReady]);

  return null;
}

function OrgChartCanvas({
  nodes: propNodes,
  edges: propEdges,
  onSelect,
  onPaneContextMenu,
  showMinimap,
}: {
  nodes: Array<Node<OrgFlowData>>;
  edges: Edge[];
  onSelect: (id: string) => void;
  onPaneContextMenu?: (e: React.MouseEvent | MouseEvent) => void;
  showMinimap: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges);
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    setNodes((nds) => {
      const existingById = new Map(nds.map((node) => [node.id, node]));

      return propNodes.map((pn) => {
        const existing = existingById.get(pn.id);
        if (!existing) {
          return pn;
        }

        return {
          ...existing,
          ...pn,
          position: pn.position,
          data: pn.data,
          selected: pn.selected,
          hidden: pn.hidden,
        };
      });
    });
  }, [propNodes, setNodes]);

  useEffect(() => {
    setEdges((eds) => {
      const existingById = new Map(eds.map((edge) => [edge.id, edge]));

      return propEdges.map((pe) => {
        const existing = existingById.get(pe.id);
        if (!existing) {
          return pe;
        }

        return {
          ...existing,
          ...pe,
          style: pe.style,
          animated: pe.animated,
          selected: pe.selected,
        };
      });
    });
  }, [propEdges, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      minZoom={0.2}
      maxZoom={1.15}
      nodesDraggable={false}
      elementsSelectable
      panOnDrag
      zoomOnScroll={false}
      zoomOnPinch
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneContextMenu={onPaneContextMenu}
      defaultEdgeOptions={{ selectable: false, focusable: false }}
      style={{ background: "hsl(var(--background))" }}
      proOptions={{ hideAttribution: true }}
      colorMode="system"
    >
      <FitViewOnLoad isReady={nodesInitialized && nodes.length > 0} />
      <Background color="#ccc" variant={"dots" as any} />
      
      {showMinimap && nodesInitialized && (
        <MiniMap 
          position="top-right"
          pannable
          zoomable
          zoomStep={20}
          offsetScale={10}
          className="org-chart-minimap"
          style={{ 
            width: 200,
            height: 140,
          }}
          bgColor="hsl(var(--card))"
          maskColor="hsl(var(--background) / 0.6)"
          maskStrokeColor="hsl(43 96% 48% / 0.55)"
          maskStrokeWidth={1.2}
          nodeColor={getMiniMapNodeColor}
          nodeStrokeColor={getMiniMapNodeStroke}
          nodeStrokeWidth={2}
          nodeBorderRadius={14}
          ariaLabel="Organization chart minimap"
        />
      )}
      
      <Controls
        position="top-left"
        orientation="horizontal"
        showFitView={false}
        showInteractive={false}
        className="org-chart-controls"
      />
    </ReactFlow>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 text-center sm:px-6 lg:px-8">
      <p className="text-lg font-bold text-[hsl(var(--foreground))]">No org tree yet.</p>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Mobile-backed members have not loaded.</p>
    </div>
  );
}

function OrgChartContent() {
  const dashboard = useQuery(api.network.getDashboard);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSidebarMember, setSelectedSidebarMember] = useState<Doc<"users"> | null>(null);
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isProjectionView, setIsProjectionView] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [viewMode, setViewMode] = useState<"canvas" | "map">("canvas");

  const [statusFilter, setStatusFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const { fitView, setCenter } = useReactFlow();
  const { handleContextMenu, ContextMenuComponent } = useContextMenu();

  const handlePaneRightClick = useCallback((e: React.MouseEvent | MouseEvent) => {
    const items: ContextMenuItem[] = [
      {
        label: "Reset View",
        icon: <Focus size={14} />,
        onClick: () => void fitView({ duration: 500, padding: 0.28, minZoom: 0.2, maxZoom: 1.15 }),
      },
      {
        label: isSidebarOpen ? "Close Member Sidebar" : "Open Member Sidebar",
        icon: <Users size={14} />,
        onClick: () => setIsSidebarOpen(!isSidebarOpen),
      },
    ];
    handleContextMenu(e, items);
  }, [fitView, isSidebarOpen, handleContextMenu]);

  const [stepperParentId, setStepperParentId] = useState<string | null>(null);
  
  useEffect(() => {
    (window as any).triggerAddMember = (id: string) => {
      setStepperParentId(id);
    };
    return () => {
      delete (window as any).triggerAddMember;
    };
  }, []);

  const rawTree = useMemo(
    () => (dashboard?.tree as OrgTreeNode[] | undefined) ?? [],
    [dashboard],
  );

  const allTreeNodes = useMemo(() => flattenOrgTree(rawTree), [rawTree]);

  const projectedTree = useMemo(
    () =>
      projectOrgTree(rawTree, {
        isProjectionView,
        selectedId,
      }),
    [isProjectionView, rawTree, selectedId],
  );

  const { nodes, edges } = useMemo(() => {
    if (!dashboard) {
      return {
        nodes: [] as Array<Node<OrgFlowData>>,
        edges: [] as Edge[],
      };
    }

    return buildFlowTree(projectedTree);
  }, [dashboard, projectedTree]);

  const visibleMembers = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        name: n.data.name,
        role: n.data.roleTitle,
        uplineId: n.data.member.uplineId,
        latestAsset: n.data.member.latestAsset,
      })),
    [nodes]
  );

  const effectiveSelectedId =
    selectedId && nodes.some((node) => node.id === selectedId)
      ? selectedId
      : nodes.find((node) => node.data.isViewer)?.id ?? nodes[0]?.id ?? null;

  const selectedViewStats = useMemo(() => {
    if (!selectedId) {
      return null;
    }

    const selectedNode = nodes.find((node) => node.id === selectedId);
    if (!selectedNode) {
      return null;
    }

    return {
      directChildrenCount: selectedNode.data.member.directChildrenCount ?? 0,
      totalDownlines: selectedNode.data.member.totalDownlines ?? 0,
    };
  }, [nodes, selectedId]);

  const availableStatusFilters = isProjectionView
    ? ["All", "Joined", "Invited", "Pending", "To-Invite"]
    : ["All", "Joined"];

  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    allTreeNodes.forEach(n => {
      if (n.member.country) countries.add(n.member.country);
    });
    return ["All", ...Array.from(countries).sort()];
  }, [allTreeNodes]);

  const flowNodes = useMemo(() => nodes.map((node) => ({
    ...node,
    selected: node.id === effectiveSelectedId,
    hidden: (statusFilter !== "All" && node.data.status !== statusFilter.toLowerCase()) ||
            (countryFilter !== "All" && node.data.member.country !== countryFilter),
  })), [nodes, effectiveSelectedId, statusFilter, countryFilter]);

  const flowEdges = useMemo(() => edges.map((edge) => {
    const isConnectedToSelected = edge.source === effectiveSelectedId || edge.target === effectiveSelectedId;
    return {
      ...edge,
      animated: isConnectedToSelected,
      style: {
        ...edge.style,
        stroke: isConnectedToSelected ? "hsl(43 96% 48%)" : "hsl(43 96% 48% / 0.55)",
        strokeWidth: isConnectedToSelected ? 3 : 2.4,
      },
    };
  }), [edges, effectiveSelectedId]);


  const flowNodesRef = useRef(flowNodes);
  useEffect(() => {
    flowNodesRef.current = flowNodes;
  }, [flowNodes]);

  const triggerFocusNode = useCallback((nodeId: string) => {
    // We do NOT store X/Y in Convex DB. They are mathematically calculated
    // client-side in buildFlowTree. 
    // Wait 350ms for the sidebar slide transition to complete so the React Flow
    // wrapper dimension stabilizes before we force the camera translation.
    setTimeout(() => {
      const node = flowNodesRef.current.find(n => n.id === nodeId);
      if (node) {
        void setCenter(node.position.x + 120, node.position.y + 100, { duration: 800, zoom: 0.8 });
      }
    }, 350);
  }, [setCenter]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);

    const trimmedValue = value.trim().toLowerCase();
    if (!trimmedValue) {
      return;
    }

    const match = allTreeNodes.find(
      (node) =>
        node.name.toLowerCase().includes(trimmedValue) ||
        node.roleTitle.toLowerCase().includes(trimmedValue)
    );

    if (!match) {
      return;
    }

    if (!isProjectionView && match.status !== "joined" && !match.isViewer) {
      setIsProjectionView(true);
    }

    if (statusFilter !== "All" && statusFilter.toLowerCase() !== match.status) {
      setStatusFilter("All");
    }

    setSelectedId(match.id);
    triggerFocusNode(match.id);
  }, [allTreeNodes, isProjectionView, statusFilter, triggerFocusNode]);

  if (dashboard === undefined || dashboard === null) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center pb-6">
          <Skeleton className="absolute left-0 h-12 w-12 rounded-full" />
          <Skeleton className="h-14 w-72 rounded-2xl" />
        </div>
        <Skeleton className="h-[760px] rounded-[36px]" />
      </div>
    );
  }

  if (dashboard.tree.length === 0) {
    return <EmptyState />;
  }



  const handleToggleHierarchyView = () => {
    setIsProjectionView((current) => {
      const next = !current;
      if (!next && !["All", "Joined"].includes(statusFilter)) {
        setStatusFilter("All");
      }
      return next;
    });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-[1200px] flex-col px-4 py-6 sm:px-6 lg:px-8">
      <MemberSidebar
        currentPivotId={effectiveSelectedId || ""}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        visibleMembers={visibleMembers}
        selectedMember={selectedSidebarMember}
        setSelectedMember={setSelectedSidebarMember}
        targetManagerId={targetManagerId}
        setTargetManagerId={setTargetManagerId}
        onSuccess={() => setIsSidebarOpen(false)}
        onFocusNode={(id) => {
          setIsSidebarOpen(false);
          const match = allTreeNodes.find((node) => node.id === id);
          if (match) {
            if (!isProjectionView && match.status !== "joined" && !match.isViewer) {
              setIsProjectionView(true);
            }
            if (statusFilter !== "All" && statusFilter.toLowerCase() !== match.status) {
              setStatusFilter("All");
            }
            setSelectedId(match.id);
            triggerFocusNode(match.id);
          }
        }}
        viewMode={viewMode}
        unmappedMembers={allTreeNodes
          .filter(n => n.member.latitude == null && !n.isViewer)
          .map(n => ({ id: n.id, name: n.name, role: n.roleTitle, email: n.member.email }))
        }
      />
      <div className="flex items-center justify-between gap-4 pb-6">
        <Link
          to="/"
          className="flex h-12 w-12 items-center justify-center rounded-full text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={34} />
        </Link>
        
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
            <input 
              type="text" 
              placeholder="Search member..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-[18px] bg-[hsl(var(--card))] px-2 py-1.5 shadow-lg border border-[hsl(var(--border))]">
            <button
              onClick={() => setViewMode("canvas")}
              className={cn("flex h-10 px-3 gap-2 items-center justify-center rounded-xl transition-colors font-bold text-sm", viewMode === "canvas" ? "bg-[hsl(43,96%,48%)] text-black" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]")}
              title="Canvas View"
            >
              <Network size={16} />
              <span className="hidden sm:inline">Canvas</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn("flex h-10 px-3 gap-2 items-center justify-center rounded-xl transition-colors font-bold text-sm", viewMode === "map" ? "bg-[hsl(43,96%,48%)] text-black" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]")}
              title="Map View"
            >
              <MapIcon size={16} />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-[18px] bg-[hsl(var(--card))] px-2 py-1.5 shadow-lg border border-[hsl(var(--border))] relative">
            <button 
              onClick={() => {
                setShowFilters(!showFilters);
                setShowStats(false);
                setShowInfo(false);
              }}
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", showFilters ? "bg-[hsl(43,96%,48%)] text-black" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]")}
              title="Filters"
            >
              <SlidersHorizontal size={18} />
            </button>
            <button 
              onClick={() => {
                setShowStats(!showStats);
                setShowFilters(false);
                setShowInfo(false);
              }}
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", showStats ? "bg-[hsl(43,96%,48%)] text-black" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]")}
              title="Statistics"
            >
              <ChartColumn size={18} />
            </button>
            <button 
              onClick={() => setShowMinimap(!showMinimap)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                showMinimap ? "bg-[hsl(43,96%,48%)] text-black" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              )}
              title="Minimap"
            >
              <MapIcon size={18} />
            </button>
            <button 
              onClick={() => {
                setShowInfo(!showInfo);
                setShowFilters(false);
                setShowStats(false);
              }}
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", showInfo ? "bg-[hsl(43,96%,48%)] text-black" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]")}
              title="Info"
            >
              <Info size={18} />
            </button>

            {/* Filters Popover */}
            {showFilters && (
              <div className="absolute top-[120%] right-0 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Filter by Status</h4>
                <div className="flex flex-col gap-2 mb-4">
                  {availableStatusFilters.map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="statusFilter" 
                        value={status}
                        checked={statusFilter === status}
                        onChange={() => setStatusFilter(status)}
                        className="accent-[hsl(43,96%,48%)] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[hsl(var(--foreground))] group-hover:text-[hsl(43,96%,48%)] transition-colors">{status}</span>
                    </label>
                  ))}
                </div>

                <h4 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 pt-4 border-t border-[hsl(var(--border)/0.5)]">Filter by Country</h4>
                <div className="relative">
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-2 text-sm font-semibold outline-none cursor-pointer focus:border-[hsl(var(--primary))]"
                  >
                    {availableCountries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Statistics Popover */}
            {showStats && dashboard && (
              <div className="absolute top-[120%] right-0 w-64 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Network Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[hsl(var(--muted)/0.5)] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-[hsl(var(--foreground))]">{dashboard.stats.joinedCount}</p>
                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Joined</p>
                  </div>
                  <div className="bg-[hsl(var(--muted)/0.5)] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-[hsl(var(--foreground))]">{dashboard.stats.invitedCount}</p>
                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Invited</p>
                  </div>
                  <div className="bg-[hsl(var(--muted)/0.5)] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-[hsl(var(--foreground))]">{dashboard.stats.pendingCount}</p>
                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Pending</p>
                  </div>
                  <div className="bg-[hsl(var(--muted)/0.5)] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-[hsl(var(--foreground))]">{dashboard.stats.toInviteCount}</p>
                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">To Invite</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Legend Popover */}
            {showInfo && (
              <div className="absolute top-[120%] right-0 w-72 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xl font-bold text-[hsl(var(--foreground))] tracking-tight mb-5">Status Legend</h4>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] dark:bg-[#273B7A] flex items-center justify-center">
                      <Check size={16} className="text-[hsl(43,96%,48%)] dark:text-[#FFD700] stroke-[3]" />
                    </div>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Joined</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[hsl(43,96%,48%)] dark:bg-[#FFD700] flex items-center justify-center">
                      <Mail size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Invited</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted-foreground))] dark:bg-[#4B5563] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Pending</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] dark:bg-[#374151] flex items-center justify-center">
                      <UserPlus size={16} className="text-[hsl(var(--foreground))] dark:text-white" />
                    </div>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">To-Invite</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleToggleHierarchyView}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[hsl(var(--card))] text-[hsl(43,96%,48%)] shadow-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:scale-[1.05] active:scale-[0.95] transition-all"
            title={isProjectionView ? "Projection View (All)" : "Real Hierarchy (Joined Only)"}
          >
            {isProjectionView ? (
              <Users size={22} strokeWidth={2.5} />
            ) : (
              <Network size={22} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <div className="relative h-[760px] w-full rounded-[36px] overflow-hidden">
        {viewMode === "canvas" ? (
          <OrgChartCanvas 
            nodes={flowNodes} 
            edges={flowEdges} 
            onSelect={setSelectedId} 
            onPaneContextMenu={handlePaneRightClick} 
            showMinimap={showMinimap} 
          />
        ) : (
          <Suspense fallback={
            <div className="absolute inset-0 bg-[hsl(var(--card))] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-[hsl(var(--muted-foreground))]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
                <p className="text-sm font-bold tracking-widest uppercase">Loading Map...</p>
              </div>
            </div>
          }>
            <LeafletMapView 
              nodes={flowNodes.filter(n => !n.hidden)} 
              onSelectNode={(id) => {
                setSelectedId(id);
              }} 
              selectedId={selectedId} 
            />
            <div className="absolute bottom-4 left-4 z-[400] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 shadow-lg">
              <p className="text-xs font-bold text-[hsl(var(--foreground))]">
                Showing {flowNodes.filter(n => !n.hidden && n.data.member.latitude != null).length} pins
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                Out of {allTreeNodes.length} members
              </p>
            </div>
          </Suspense>
        )}
      </div>

      <MemberInspector 
        memberId={selectedId} 
        networkStats={selectedViewStats}
        onClose={() => setSelectedId(null)} 
      />

      {stepperParentId && (
        <AddMemberStepper 
          parentId={stepperParentId}
          isOpen={!!stepperParentId}
          onClose={() => setStepperParentId(null)}
          onSuccess={() => {
            // Success handled by stepper, but we could refresh here if needed
            // Convex queries refresh automatically
          }}
        />
      )}
      
      {ContextMenuComponent}
    </div>
  );
}

export function OrgChartPage() {
  return (
    <ReactFlowProvider>
      <OrgChartContent />
    </ReactFlowProvider>
  );
}
