// Shared dummy data — Phase 1 frontend
// Rule: max 6 downlines per member. Perfect 2-level symmetric tree to fit the circular layout.

export type MemberRank = "Master" | "Diamond" | "Gold" | "Silver" | "Bronze";
export type MemberStatus = "active" | "inactive" | "pending";

export interface DummyMember {
  id: string;
  name: string;
  email: string;
  rank: MemberRank;
  status: MemberStatus;
  uplineId: string | null;
  joinDate: string;
  totalDownlines: number;
  invitedCount: number;
  pendingCount: number;
  avatarInitials: string;
}

// Helper to generate members
function createMember(
  id: string, name: string, initials: string, rank: MemberRank,
  uplineId: string | null, status: MemberStatus = "active", downlines = 0
): DummyMember {
  return { 
    id, name, email: `${id}@luxurious.trade`, rank, status, uplineId, 
    joinDate: "2023-01-15", totalDownlines: downlines, 
    invitedCount: downlines > 0 ? downlines + 2 : 0, 
    pendingCount: status === 'pending' ? 1 : 0, 
    avatarInitials: initials 
  };
}

// ── Perfect 6x6 Symmetrical Tree (43 members) ────────────────────────────────────────

// ROOT
const root = createMember("m-001", "Alejandro Reyes", "AR", "Master", null, "active", 6);

// L1 (6 Branches)
const l1 = [
  createMember("m-002", "Sofia Mendoza", "SM", "Diamond", "m-001", "active", 6),
  createMember("m-003", "Carlos Bautista", "CB", "Diamond", "m-001", "active", 6),
  createMember("n-l1-1", "Bianca Reyes", "BR", "Diamond", "m-001", "active", 6),
  createMember("n-l1-2", "Dante Cruz", "DC", "Diamond", "m-001", "active", 6),
  createMember("n-l1-3", "Elena Santos", "ES", "Diamond", "m-001", "active", 6),
  createMember("n-l1-4", "Felix Garcia", "FG", "Diamond", "m-001", "active", 6),
];

// L2 (36 Leaves)
const l2: DummyMember[] = [];
let l2Counter = 1;

const ranks: MemberRank[] = ["Gold", "Silver", "Bronze"];
const statuses: MemberStatus[] = ["active", "active", "active", "pending", "inactive"];

l1.forEach((parent) => {
  for (let i = 0; i < 6; i++) {
    const rank = ranks[l2Counter % ranks.length];
    const status = statuses[l2Counter % statuses.length];
    l2.push(
      createMember(
        `l2-${l2Counter}`, 
        `Member ${l2Counter}`, 
        `M${l2Counter}`, 
        rank, 
        parent.id, 
        status, 
        0
      )
    );
    l2Counter++;
  }
});

// Replace some generic L2 names with original names for flavor
if(l2[0]) { l2[0].name = "Maria Santos"; l2[0].avatarInitials = "MS"; }
if(l2[1]) { l2[1].name = "Juan dela Cruz"; l2[1].avatarInitials = "JC"; }
if(l2[2]) { l2[2].name = "Ana Ramirez"; l2[2].avatarInitials = "AR"; }
if(l2[3]) { l2[3].name = "Marco Torres"; l2[3].avatarInitials = "MT"; }
if(l2[4]) { l2[4].name = "Isabella Cruz"; l2[4].avatarInitials = "IC"; }
if(l2[5]) { l2[5].name = "Ricardo Lim"; l2[5].avatarInitials = "RL"; }
if(l2[6]) { l2[6].name = "Vanessa Ong"; l2[6].avatarInitials = "VO"; }
if(l2[7]) { l2[7].name = "Dennis Tan"; l2[7].avatarInitials = "DT"; }
if(l2[8]) { l2[8].name = "Patricia Go"; l2[8].avatarInitials = "PG"; }

export const DUMMY_MEMBERS: DummyMember[] = [root, ...l1, ...l2];

// ── Constants ───────────────────────────────────────────────────
export const RANK_ORDER: Record<MemberRank, number> = { Master:5, Diamond:4, Gold:3, Silver:2, Bronze:1 };

export const RANK_COLORS: Record<MemberRank, string> = {
  Master:  "hsl(43 96% 48%)",
  Diamond: "hsl(221 83% 53%)",
  Gold:    "hsl(43 80% 55%)",
  Silver:  "hsl(215 20% 60%)",
  Bronze:  "hsl(25 65% 50%)",
};

export const STATUS_COLORS: Record<MemberStatus, string> = {
  active:   "hsl(152 69% 42%)",
  inactive: "hsl(0 84% 61%)",
  pending:  "hsl(37 92% 50%)",
};

// ── Helper Functions for Drill-Down ────────────────────────
export function getSubtree(rootId: string): DummyMember[] {
  const result: DummyMember[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const currId = queue.shift()!;
    const member = DUMMY_MEMBERS.find((m) => m.id === currId);
    if (member) {
      result.push(member);
      const children = DUMMY_MEMBERS.filter((m) => m.uplineId === currId).map((m) => m.id);
      queue.push(...children);
    }
  }
  return result;
}

export function getBreadcrumbs(targetId: string): DummyMember[] {
  const breadcrumbs: DummyMember[] = [];
  let currId: string | null = targetId;
  while (currId) {
    const member = DUMMY_MEMBERS.find((m) => m.id === currId);
    if (!member) break;
    breadcrumbs.unshift(member); // push to front so root is first
    currId = member.uplineId;
  }
  return breadcrumbs;
}

// ── Recursive 360-Degree Radial Layout ────────────────────────
function buildChildrenMap(members: DummyMember[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const m of members) {
    const key = m.uplineId ?? "__root__";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m.id);
  }
  return map;
}

export function buildOrgChartNodes(viewRootId: string = "m-001"): Record<string, { x: number; y: number }> {
  const subtreeMembers = getSubtree(viewRootId);
  const childrenMap = buildChildrenMap(subtreeMembers);
  const positions: Record<string, { x: number; y: number }> = {};
  
  // Radius step large enough for 220px cards
  // At depth 2 (radius 2400), circumference is 15000px. 36 cards = ~418px spacing each!
  const RADIUS_STEP = 1200; 

  function assignRadial(id: string, depth: number, startAngle: number, endAngle: number) {
    const angle = (startAngle + endAngle) / 2;
    const radius = depth * RADIUS_STEP;
    
    positions[id] = {
      x: radius * Math.cos(angle) - 110,
      y: radius * Math.sin(angle) - 60
    };

    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) return;

    // UNIFORM angle allocation guarantees perfect visual symmetry and prevents overlapping
    const sliceSize = (endAngle - startAngle) / children.length;
    let currentAngle = startAngle;
    
    for (const c of children) {
      assignRadial(c, depth + 1, currentAngle, currentAngle + sliceSize);
      currentAngle += sliceSize;
    }
  }

  // The center node is our viewRootId
  assignRadial(viewRootId, 0, 0, 2 * Math.PI);

  return positions;
}
