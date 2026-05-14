import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Position,
  type Edge,
  type Node,
} from "@xyflow/react";
import { ArrowLeft, Focus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { OrgCardNode, type OrgCardData } from "../../components/org-chart/OrgCardNode";
import { MemberSidebar } from "../../components/org-chart/MemberSidebar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContextMenu } from "../../components/ui/useContextMenu";
import { type ContextMenuItem } from "../../components/ui/ContextMenu";

type OrgTreeNode = {
  id: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending";
  isViewer: boolean;
  member: OrgCardData["member"];
  children: OrgTreeNode[];
};

type OrgFlowData = {
  id: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending";
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
        member: node.member,
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
}: {
  nodes: Array<Node<OrgFlowData>>;
  edges: Edge[];
  onSelect: (id: string) => void;
  onPaneContextMenu?: (e: React.MouseEvent | MouseEvent) => void;
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
  const dashboard = useQuery(api.users.getOrgTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSidebarMember, setSelectedSidebarMember] = useState<Doc<"users"> | null>(null);
  const [targetManagerId, setTargetManagerId] = useState<string>("");

  const { fitView } = useReactFlow();
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

  const { nodes, edges } = useMemo(() => {
    if (!dashboard) {
      return {
        nodes: [] as Array<Node<OrgFlowData>>,
        edges: [] as Edge[],
      };
    }

    return buildFlowTree(dashboard.tree);
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

  const effectiveSelectedId =
    selectedId && nodes.some((node) => node.id === selectedId)
      ? selectedId
      : nodes.find((node) => node.data.isViewer)?.id ?? nodes[0]?.id ?? null;

  const flowNodes = nodes.map((node) => ({
    ...node,
    selected: node.id === effectiveSelectedId,
  }));

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
      <div className="relative flex items-center justify-center pb-6">
        <Link
          to="/"
          className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={34} />
        </Link>
        <h1 className="text-center text-[34px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--foreground))] sm:text-[44px]">
          Org Chart
        </h1>
      </div>

      <div className="h-[760px] w-full overflow-hidden rounded-[36px]">
        <OrgChartCanvas nodes={flowNodes} edges={edges} onSelect={setSelectedId} onPaneContextMenu={handlePaneRightClick} />
      </div>
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
