import { useEffect, useMemo, useState, useCallback } from "react";
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

type OrgTreeNode = {
  id: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending" | "to-invite";
  isViewer: boolean;
  directChildrenCount: number;
  member: OrgCardData["member"];
  children: OrgTreeNode[];
};

type OrgFlowData = {
  id: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending" | "to-invite";
  isViewer: boolean;
  member: OrgCardData["member"];
};

const NODE_WIDTH = 176;
const HORIZONTAL_GAP = 92;
const VERTICAL_GAP = 230;

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

// Using imported OrgCardNode from components

function FitViewOnLoad({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodeCount === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fitView({ duration: 500, padding: 0.28, minZoom: 0.2, maxZoom: 1.15 });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [fitView, nodeCount]);

  return null;
}

function OrgChartCanvas({
  nodes,
  edges,
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
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={{ "org-card": OrgCardNode }}
      fitView
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
    >
      <FitViewOnLoad nodeCount={nodes.length} />
      <Background color="#ccc" variant={"dots" as any} />
      {showMinimap && (
        <MiniMap 
          style={{ 
            borderRadius: 16, 
            border: '2px solid hsl(43 96% 48%)', 
            background: 'hsl(var(--card))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px hsl(43 96% 48% / 0.3)',
            width: 180,
            height: 130,
          }}
          nodeColor={(n) => {
            const status = (n.data as any).status as string | undefined;
            if ((n.data as any).isViewer) return 'hsl(43 96% 48%)';
            if (status === 'joined') return 'hsl(210 60% 36%)';
            if (status === 'invited') return 'hsl(43 96% 48% / 0.7)';
            if (status === 'pending') return 'hsl(var(--muted-foreground))';
            return 'hsl(var(--muted))';
          }}
          nodeStrokeColor={(n) => (n.data as any).isViewer ? 'hsl(43 96% 48%)' : 'transparent'}
          nodeStrokeWidth={2}
          maskColor="hsl(var(--background) / 0.6)"
          pannable
          zoomable
        />
      )}
      <Controls />
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
  const [showMinimap, setShowMinimap] = useState(false);

  const [statusFilter, setStatusFilter] = useState("All");
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

  const { nodes, edges } = useMemo(() => {
    if (!dashboard) {
      return {
        nodes: [] as Array<Node<OrgFlowData>>,
        edges: [] as Edge[],
      };
    }

    return buildFlowTree(dashboard.tree as any);
  }, [dashboard]);

  const visibleMembers = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        name: n.data.name,
        role: n.data.roleTitle,
      })),
    [nodes]
  );

  const effectiveSelectedId =
    selectedId && nodes.some((node) => node.id === selectedId)
      ? selectedId
      : nodes.find((node) => node.data.isViewer)?.id ?? nodes[0]?.id ?? null;

  const flowNodes = useMemo(() => nodes.map((node) => ({
    ...node,
    selected: node.id === effectiveSelectedId,
    hidden: statusFilter !== "All" && node.data.status !== statusFilter.toLowerCase(),
  })), [nodes, effectiveSelectedId, statusFilter]);

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

  useEffect(() => {
    if (search.trim()) {
      const match = dashboard?.tree && nodes.find(node => 
        node.data.name.toLowerCase().includes(search.toLowerCase()) || 
        node.data.roleTitle.toLowerCase().includes(search.toLowerCase())
      );
      if (match) {
        setSelectedId(match.id);
        setCenter(match.position.x + 120, match.position.y + 100, { duration: 500, zoom: 0.8 });
      }
    }
  }, [search, nodes, setCenter, dashboard?.tree]);

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



  const handleReset = () => {
    void fitView({ duration: 500, padding: 0.28, minZoom: 0.2, maxZoom: 1.15 });
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-[18px] bg-[#1A2235] px-2 py-1.5 shadow-lg border border-[hsl(var(--border))] relative">
            <button 
              onClick={() => {
                setShowFilters(!showFilters);
                setShowStats(false);
                setShowInfo(false);
              }}
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", showFilters ? "bg-[hsl(43,96%,48%)] text-[#1A2235]" : "text-slate-400 hover:bg-white/10 hover:text-white")}
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
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", showStats ? "bg-[hsl(43,96%,48%)] text-[#1A2235]" : "text-slate-400 hover:bg-white/10 hover:text-white")}
              title="Statistics"
            >
              <ChartColumn size={18} />
            </button>
            <button 
              onClick={() => setShowMinimap(!showMinimap)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                showMinimap ? "bg-[hsl(43,96%,48%)] text-[#1A2235]" : "text-slate-400 hover:bg-white/10 hover:text-white"
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
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", showInfo ? "bg-[hsl(43,96%,48%)] text-[#1A2235]" : "text-slate-400 hover:bg-white/10 hover:text-white")}
              title="Info"
            >
              <Info size={18} />
            </button>

            {/* Filters Popover */}
            {showFilters && (
              <div className="absolute top-[120%] right-0 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Filter by Status</h4>
                <div className="flex flex-col gap-2">
                  {["All", "Joined", "Invited", "Pending", "To-Invite"].map((status) => (
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
            onClick={handleReset}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#1A2235] text-[hsl(43,96%,48%)] shadow-lg border border-[hsl(var(--border))] hover:bg-[#1f293f] hover:scale-[1.05] active:scale-[0.95] transition-all"
            title="Fit View"
          >
            <Network size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="h-[760px] w-full overflow-hidden rounded-[36px]">
        <OrgChartCanvas nodes={flowNodes} edges={flowEdges} onSelect={setSelectedId} onPaneContextMenu={handlePaneRightClick} showMinimap={showMinimap} />
      </div>

      <MemberInspector 
        memberId={selectedId} 
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
