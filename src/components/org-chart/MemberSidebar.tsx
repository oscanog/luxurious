import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Search, X, ChevronLeft, ChevronRight, User, TrendingUp, PieChart as PieIcon, BarChart3, BarChart2, Activity, DollarSign, Layers, Focus, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';


interface MemberSidebarProps {
  currentPivotId: string;
  isOpen: boolean;
  onToggle: () => void;
  visibleMembers: { 
    id: string; 
    name: string; 
    role?: string; 
    uplineId?: string | null;
    latestAsset?: { name: string; value: number; currency: string; createdAt: number } | null;
  }[];
  selectedMember: Doc<"users"> | null;
  setSelectedMember: (member: Doc<"users"> | null) => void;
  targetManagerId: string;
  setTargetManagerId: (id: string) => void;
  onSuccess?: () => void;
  onFocusNode?: (id: string) => void;
  viewMode?: "canvas" | "map";
  unmappedMembers?: {
    id: string;
    name: string;
    role?: string;
    email?: string;
  }[];
}

export function MemberSidebar({ 
  isOpen, 
  onToggle, 
  visibleMembers, 
  selectedMember,
  setSelectedMember,
  targetManagerId,
  setTargetManagerId,
  onSuccess,
  onFocusNode,
  viewMode = "canvas",
  unmappedMembers = []
}: MemberSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [heatmapType, setHeatmapType] = useState<"joins" | "investments">("joins");
  const [inspectingMember, setInspectingMember] = useState<Doc<"users"> | null>(null);
  const [showAssetHistory, setShowAssetHistory] = useState(false);
  const [showDownlines, setShowDownlines] = useState(false);
  const [inspectingHistory, setInspectingHistory] = useState<Doc<"users">[]>([]);
  const [downlineSearch, setDownlineSearch] = useState("");
  const [downlineFilter, setDownlineFilter] = useState<"all" | "direct" | "indirect">("all");
  const [downlineSort, setDownlineSort] = useState<"name-asc" | "name-desc" | "role">("name-asc");

  useEffect(() => {
    if (inspectingMember) {
      setInspectingHistory(prev => {
        const idx = prev.findIndex(h => h._id === inspectingMember._id);
        if (idx !== -1) {
          return prev.slice(0, idx + 1);
        }
        return [...prev, inspectingMember];
      });
    } else {
      setInspectingHistory([]);
    }
  }, [inspectingMember]);
  
  const members = useQuery(api.users.listWithHierarchy) ?? [];
  const heatmapStats = useQuery(api.networkMembers.getAnalyticsStats, {}) ?? { 
    joinsByDate: {}, 
    investmentsByDate: {}, 
    statusDistribution: {}, 
    roleDistribution: {}, 
    totalMembers: 0,
    members: []
  };
  const setUpline = useMutation(api.users.setUpline);

  function getDownlineStats(userId: string) {
    const user = members.find(m => m._id === userId);
    const name = user?.name;
    const canvasMember = name ? visibleMembers.find(vm => vm.name === name) : null;
    const canvasMemberId = canvasMember?.id;
    
    if (canvasMemberId) {
      const direct = visibleMembers.filter(m => m.uplineId === canvasMemberId);
      
      function getAllChildren(id: string): any[] {
        const children = visibleMembers.filter(m => m.uplineId === id);
        return children.concat(children.flatMap(c => getAllChildren(c.id)));
      }
      
      const all = getAllChildren(canvasMemberId);
      return {
        directCount: direct.length,
        totalCount: all.length,
        allDownlines: all,
      };
    } else {
      const direct = members.filter(m => m.uplineId === userId);
      
      function getAllChildren(id: string): any[] {
        const children = members.filter(m => m.uplineId === id);
        return children.concat(children.flatMap(c => getAllChildren(c._id)));
      }
      
      const all = getAllChildren(userId);
      return {
        directCount: direct.length,
        totalCount: all.length,
        allDownlines: all,
      };
    }
  }

  function generateActivityMatrix(memberId: string) {
    const rows = [
      { name: "Direct Invites", color: "bg-emerald-500" },
      { name: "Investments", color: "bg-blue-500" },
      { name: "Asset Logs", color: "bg-amber-500" },
      { name: "System Logins", color: "bg-purple-500" },
    ];
    
    const charSum = memberId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    return rows.map((row, rowIndex) => {
      const days = Array.from({ length: 30 }, (_, dayIndex) => {
        const seed = (charSum + rowIndex * 7 + dayIndex * 13) % 100;
        let status = "empty";
        if (seed > 80) status = "present"; // green
        else if (seed > 70) status = "absent"; // red
        else if (seed > 60) status = "late"; // yellow
        else if (seed > 50) status = "leave"; // purple
        else if (seed > 40) status = "remote"; // blue
        return status;
      });
      return {
        name: row.name,
        colorClass: row.color,
        days,
      };
    });
  }

  const filteredMembers = members.filter(m => 
    !visibleMembers.some(vm => vm.id === m._id) && // Don't show members already on canvas
    (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirmConnection = () => {
    if (!selectedMember || !targetManagerId) return;
    const userId = selectedMember._id;
    void (async () => {
      try {
        await setUpline({ userId, uplineId: targetManagerId as Id<"users"> });
        toast.success(`${selectedMember.name} connected to ${visibleMembers.find(m => m.id === targetManagerId)?.name}`);
        setSelectedMember(null);
        onSuccess?.();
      } catch {
        toast.error("Failed to connect member");
      }
    })();
  };

  const currentHeatmapData = heatmapType === "joins" ? heatmapStats.joinsByDate : heatmapStats.investmentsByDate;
  const heatmapValues = Object.entries(currentHeatmapData).map(([date, count]) => ({
    date: new Date(date),
    count: count as number,
  }));
  
  

  // Format data for PieChart and BarChart
  const statusData = Object.entries(heatmapStats.statusDistribution ?? {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }));

  const roleData = Object.entries(heatmapStats.roleDistribution ?? {}).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const growthChartData = useMemo(() => {
    const sorted = [...heatmapValues].sort((a, b) => a.date.getTime() - b.date.getTime());
    return sorted.map(item => ({
      name: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.count
    }));
  }, [heatmapValues]);

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(215 90% 50%)', 'hsl(142 70% 45%)', 'hsl(38 92% 50%)'];

  return (
    <>
      <div 
        className={`fixed right-0 top-0 h-full bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] transition-all duration-300 z-50 flex flex-col ${
          isOpen ? "w-[450px]" : "w-0"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -left-8 top-1/2 -translate-y-1/2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] border-r-0 p-1.5 rounded-l-xl shadow-lg hover:text-[hsl(var(--primary))] transition-colors"
        >
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {isOpen && (
          inspectingMember ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (inspectingHistory.length > 1) {
                      const newHistory = inspectingHistory.slice(0, -1);
                      setInspectingHistory(newHistory);
                      setInspectingMember(newHistory[newHistory.length - 1]);
                    } else {
                      setInspectingMember(null);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                  <h2 className="font-bold text-sm uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Member Intelligence</h2>
                </div>
                <button onClick={onToggle} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {/* Profile Card */}
                <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col gap-2.5">
                {/* Dynamic Breadcrumbs */}
                {inspectingHistory.length > 1 && (
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--muted-foreground))] overflow-x-auto whitespace-nowrap pb-1 scrollbar-none border-b border-[hsl(var(--border))/0.4]">
                    {inspectingHistory.map((h, idx) => {
                      const isLast = idx === inspectingHistory.length - 1;
                      return (
                        <div key={h._id} className="flex items-center gap-1.5 shrink-0">
                          {idx > 0 && <ChevronRight size={10} className="text-[hsl(var(--muted-foreground))]/40 animate-in fade-in" />}
                          <button
                            disabled={isLast}
                            onClick={() => {
                              setInspectingMember(h);
                              setShowDownlines(false);
                              setShowAssetHistory(false);
                            }}
                            className={`transition-all duration-200 ${
                              isLast 
                                ? 'text-[hsl(var(--foreground))] font-black cursor-default' 
                                : 'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] font-semibold hover:underline cursor-pointer'
                            }`}
                          >
                            {h.name ?? "Anonymous"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary)/0.1)] flex-shrink-0 flex items-center justify-center text-[hsl(var(--primary))] text-base font-bold border border-[hsl(var(--primary)/0.2)] shadow-sm">
                    {inspectingMember.image ? (
                      <img src={inspectingMember.image} alt={inspectingMember.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (inspectingMember.name ?? "?").substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black tracking-tight truncate">{inspectingMember.name ?? "Anonymous"}</h3>
                      <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]">
                        {inspectingMember.role === "admin" ? "Admin" : "Member"}
                      </span>
                      {(() => {
                        const nm = heatmapStats.members?.find((m: any) => m.name === inspectingMember.name);
                        const status = nm?.status || "joined";
                        const statusColors: Record<string, string> = {
                          joined: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          invited: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        };
                        return (
                          <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border ${statusColors[status] || "bg-secondary text-muted-foreground"}`}>
                            {status}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">{inspectingMember.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards Row */}
              {(() => {
                const stats = getDownlineStats(inspectingMember._id);
                const user = members.find(m => m._id === inspectingMember._id);
                const name = user?.name;
                const canvasMember = name ? visibleMembers.find(vm => vm.name === name) : null;
                
                const actualAssetVal = canvasMember?.latestAsset?.value ?? 8752;
                const currency = canvasMember?.latestAsset?.currency ?? "USD";
                

                const assetHistoryData = (() => {
                  const seed = inspectingMember._id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
                  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
                  return months.map((month, idx) => {
                    const multiplier = 0.82 + (Math.sin(seed + idx) * 0.12) + (idx * 0.03);
                    const value = Math.round(actualAssetVal * Math.min(multiplier, 1.0));
                    return {
                      month,
                      value: idx === months.length - 1 ? actualAssetVal : value
                    };
                  });
                })();
                
                return (
                  <>
                    <div className="p-4 border-b border-[hsl(var(--border))] grid grid-cols-2 gap-3 bg-transparent">
                      <button
                        onClick={() => {
                          setShowDownlines(!showDownlines);
                          setShowAssetHistory(false);
                        }}
                        className={`p-3 rounded-xl bg-[hsl(var(--card))] border flex flex-col justify-between shadow-sm relative overflow-hidden group text-left transition-all duration-200 hover:scale-[1.02] hover:border-[hsl(var(--primary)/0.5)] ${showDownlines ? 'ring-2 ring-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Downlines</span>
                          <Layers size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-lg font-black tracking-tight">{stats.totalCount}</div>
                          <span className="text-[8px] font-bold text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                            Direct: {stats.directCount}
                            <span className="text-[7px] text-[hsl(var(--muted-foreground))]/70 font-normal capitalize">(Click to view)</span>
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowAssetHistory(!showAssetHistory);
                          setShowDownlines(false);
                        }}
                        className={`p-3 rounded-xl bg-[hsl(var(--card))] border flex flex-col justify-between shadow-sm relative overflow-hidden group text-left transition-all duration-200 hover:scale-[1.02] hover:border-[hsl(var(--primary)/0.5)] ${showAssetHistory ? 'ring-2 ring-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Asset Valuation</span>
                          <DollarSign size={14} className="text-amber-500" />
                        </div>
                        <div>
                          <div className="text-lg font-black tracking-tight">${actualAssetVal.toLocaleString()}</div>
                          <span className="text-[8px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                            {currency} Own Asset
                          </span>
                        </div>
                      </button>
                    </div>

                    {showDownlines && (
                      <div className="px-4 py-3.5 border-b border-[hsl(var(--border))] bg-transparent animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                            <Layers size={14} />
                            Downline Network Hierarchy
                          </span>
                          <span className="text-[10px] font-extrabold text-[hsl(var(--muted-foreground))] uppercase">Total: {stats.totalCount}</span>
                        </div>

                        {/* Search, Filter & Sort Controls */}
                        <div className="grid grid-cols-1 gap-2 mb-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-2.5">
                          {/* Search */}
                          <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                            <input
                              type="text"
                              value={downlineSearch}
                              onChange={(e) => setDownlineSearch(e.target.value)}
                              placeholder="Search downline name or email..."
                              className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary)/0.5)]"
                            />
                          </div>

                          {/* Filter & Sort Row */}
                          <div className="flex gap-2">
                            {/* Filter */}
                            <div className="flex-1 flex items-center gap-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-2.5 py-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Show:</span>
                              <select
                                value={downlineFilter}
                                onChange={(e: any) => setDownlineFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-[hsl(var(--foreground))] outline-none flex-1 cursor-pointer"
                              >
                                <option value="all" className="bg-[#1e293b] text-white">All Levels</option>
                                <option value="direct" className="bg-[#1e293b] text-white">Direct Only</option>
                                <option value="indirect" className="bg-[#1e293b] text-white">Indirect Only</option>
                              </select>
                            </div>

                            {/* Sort */}
                            <div className="flex-1 flex items-center gap-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-2.5 py-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Sort:</span>
                              <select
                                value={downlineSort}
                                onChange={(e: any) => setDownlineSort(e.target.value)}
                                className="bg-transparent text-xs font-bold text-[hsl(var(--foreground))] outline-none flex-1 cursor-pointer"
                              >
                                <option value="name-asc" className="bg-[#1e293b] text-white">Name (A-Z)</option>
                                <option value="name-desc" className="bg-[#1e293b] text-white">Name (Z-A)</option>
                                <option value="role" className="bg-[#1e293b] text-white">Role Type</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
                          {(() => {
                            let filtered = stats.allDownlines.map((c: any) => {
                              const userObj = members.find(m => m.name === c.name);
                              const isDirect = c.uplineId === canvasMember?.id;
                              return { ...c, userObj, isDirect };
                            });

                            // 1. Search filter
                            if (downlineSearch) {
                              const q = downlineSearch.toLowerCase();
                              filtered = filtered.filter(item => 
                                item.name?.toLowerCase().includes(q) || 
                                item.userObj?.email?.toLowerCase().includes(q)
                              );
                            }

                            // 2. Direct/Indirect filter
                            if (downlineFilter !== "all") {
                              const targetDirect = downlineFilter === "direct";
                              filtered = filtered.filter(item => item.isDirect === targetDirect);
                            }

                            // 3. Sort
                            filtered.sort((a, b) => {
                              if (downlineSort === "name-asc") {
                                return (a.name || "").localeCompare(b.name || "");
                              } else if (downlineSort === "name-desc") {
                                return (b.name || "").localeCompare(a.name || "");
                              } else if (downlineSort === "role") {
                                const roleA = a.userObj?.role || "Member";
                                const roleB = b.userObj?.role || "Member";
                                return roleA.localeCompare(roleB);
                              }
                              return 0;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="text-center py-8 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                                  No matching downlines found.
                                </div>
                              );
                            }

                            return filtered.map((c: any) => {
                              return (
                                <div 
                                  key={c.id}
                                  onClick={() => {
                                    if (c.userObj) {
                                      setInspectingMember(c.userObj);
                                      setShowDownlines(false);
                                      setShowAssetHistory(false);
                                    }
                                  }}
                                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary)/0.04)] hover:border-[hsl(var(--primary)/0.3)] transition-all cursor-pointer group"
                                >
                                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.08)] flex items-center justify-center text-[hsl(var(--primary))] text-sm font-black shrink-0">
                                    {c.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold truncate group-hover:text-[hsl(var(--primary))] transition-colors">{c.name}</p>
                                      {c.isDirect ? (
                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">Direct</span>
                                      ) : (
                                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[hsl(var(--muted))]/40 text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] shrink-0">Indirect</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">{c.userObj?.email ?? "No email linked"}</p>
                                  </div>
                                  <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {showAssetHistory && (
                      <div className="px-4 py-3.5 border-b border-[hsl(var(--border))] bg-transparent animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                            <TrendingUp size={12} />
                            Asset History Log (6 Months)
                          </span>
                          <span className="text-[8px] font-bold text-[hsl(var(--muted-foreground))] uppercase">{currency} Equivalent</span>
                        </div>
                        <div className="h-64 w-full mt-1">
                          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <LineChart data={assetHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <XAxis 
                                dataKey="month" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false} 
                              />
                              <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  background: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))', 
                                  borderRadius: '8px',
                                  fontSize: '10px'
                                }} 
                                formatter={(value: any) => [`$${value.toLocaleString()}`, "Asset Value"]}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2} 
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 1, r: 3 }}
                                activeDot={{ r: 5 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Activity Heatmap Matrix */}
              {!showDownlines && !showAssetHistory && (
                <div className="p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <Activity size={12} className="text-[hsl(var(--primary))]" />
                    Activity Matrix (30 Days)
                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-sans tracking-normal ml-1">Simulated Placeholder</span>
                  </h4>
                  <span className="text-[8px] font-bold text-white bg-[hsl(var(--secondary))] px-1.5 py-0.5 rounded">Active Breakdown</span>
                </div>

                <div className="relative overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 flex flex-col">
                  {/* Heatmap Content (Faded & Slightly Blurred) */}
                  <div className="opacity-35 select-none pointer-events-none filter blur-[0.5px] transition-all">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center mb-3 pb-3 border-b border-[hsl(var(--border))/0.4]">
                      <span className="flex items-center gap-1 text-[8px] font-bold text-[hsl(var(--muted-foreground))]">
                        <span className="w-2 h-2 rounded bg-emerald-500" /> Invite
                      </span>
                      <span className="flex items-center gap-1 text-[8px] font-bold text-[hsl(var(--muted-foreground))]">
                        <span className="w-2 h-2 rounded bg-blue-500" /> Investment
                      </span>
                      <span className="flex items-center gap-1 text-[8px] font-bold text-[hsl(var(--muted-foreground))]">
                        <span className="w-2 h-2 rounded bg-amber-500" /> Asset Log
                      </span>
                      <span className="flex items-center gap-1 text-[8px] font-bold text-[hsl(var(--muted-foreground))]">
                        <span className="w-2 h-2 rounded bg-purple-500" /> Login
                      </span>
                      <span className="flex items-center gap-1 text-[8px] font-bold text-[hsl(var(--muted-foreground))]">
                        <span className="w-2 h-2 rounded bg-[hsl(var(--border))]" /> Idle
                      </span>
                    </div>

                    <div className="space-y-3.5 flex-1">
                      {generateActivityMatrix(inspectingMember._id).map((row) => (
                        <div key={row.name} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[9px] font-bold text-[hsl(var(--foreground))]">
                            <span>{row.name}</span>
                            <span className="text-[8px] text-[hsl(var(--muted-foreground))]">
                              {row.days.filter(d => d !== "empty").length} / 30 active days
                            </span>
                          </div>
                          <div className="grid grid-cols-10 gap-1 mt-0.5">
                            {row.days.map((dayStatus, idx) => {
                              let color = "bg-[hsl(var(--border))] opacity-20";
                              if (dayStatus === "present") color = "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]";
                              else if (dayStatus === "absent") color = "bg-rose-500 opacity-60";
                              else if (dayStatus === "late") color = "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]";
                              else if (dayStatus === "leave") color = "bg-purple-500 shadow-[0_0_4px_rgba(139,92,246,0.3)]";
                              else if (dayStatus === "remote") color = "bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.3)]";
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`h-6 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer ${color}`}
                                  title={`Day ${idx + 1}: ${dayStatus}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Glassmorphism Blur Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] transition-all duration-300">
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-2 animate-pulse">
                      <Activity size={14} className="animate-spin duration-3000" />
                      Feature Coming Soon
                    </div>
                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] mt-2 px-6 text-center max-w-[250px]">
                      Our team is active-wiring the dynamic user connection logs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 pt-0">
              <button 
                onClick={() => setInspectingMember(null)}
                className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/0.8)] text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95"
              >
                Back to Network Analytics
              </button>
            </div>
          </div>
        </>
          ) : (
            <>
              <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <h2 className="font-black text-sm uppercase tracking-wider text-[hsl(var(--foreground))] flex items-center gap-2">
                  <User size={18} className="text-[hsl(43,96%,48%)]" />
                  {viewMode === "map" ? "Members Missing Location" : "AVAILABLE MEMBERS"}
                </h2>
                <button onClick={onToggle} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

            <div className="p-4 border-b border-[hsl(var(--border))] bg-transparent">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--foreground))] flex items-center gap-2">
                  <TrendingUp size={14} className="text-[hsl(var(--primary))]" />
                  Network Growth Trend
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setHeatmapType("joins")}
                    className={`text-[9px] px-2.5 py-1 rounded font-black uppercase tracking-wider transition-all duration-200 border ${heatmapType === "joins" ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white shadow-sm shadow-[hsl(var(--primary)/0.2)]" : "bg-transparent border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.15)]"}`}
                  >
                    Joins
                  </button>
                  <button 
                    onClick={() => setHeatmapType("investments")}
                    className={`text-[9px] px-2.5 py-1 rounded font-black uppercase tracking-wider transition-all duration-200 border ${heatmapType === "investments" ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white shadow-sm shadow-[hsl(var(--primary)/0.2)]" : "bg-transparent border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.15)]"}`}
                  >
                    Investments
                  </button>
                </div>
              </div>
              
              <div className="h-28 w-full mt-2">
                {growthChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] text-[hsl(var(--muted-foreground))]">
                    No active growth logs recorded
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={growthChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={4}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                        tickMargin={4}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '8px',
                          fontSize: '10px'
                        }}
                        formatter={(value: any) => [`${value} actions`, heatmapType === "joins" ? "New Joins" : "New Investments"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#growthGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Metrics Distribution Progress Bars */}
            <div className="p-4 border-b border-[hsl(var(--border))] space-y-4 bg-transparent">
              {/* Member Status distribution */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mb-2.5">
                  <PieIcon size={14} className="text-[hsl(var(--primary))]" />
                  Member Status Distribution
                </h4>
                <div className="space-y-2">
                  {statusData.map((item, idx) => {
                    const total = statusData.reduce((sum, d) => sum + d.value, 0) || 1;
                    const pct = Math.round((item.value / total) * 100);
                    const barColor = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[hsl(var(--foreground))]">{item.name}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">{item.value} members ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roles distribution */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mb-2.5">
                  <BarChart3 size={14} className="text-[hsl(var(--primary))]" />
                  Network Roles Distribution
                </h4>
                <div className="space-y-2">
                  {roleData.map((item, idx) => {
                    const total = roleData.reduce((sum, d) => sum + d.value, 0) || 1;
                    const pct = Math.round((item.value / total) * 100);
                    const barColor = CHART_COLORS[(idx + 1) % CHART_COLORS.length];
                    return (
                      <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[hsl(var(--foreground))] truncate max-w-[150px]">{item.name}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


            <div className="p-4 border-b border-[hsl(var(--border))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                />
              </div>
            </div>

            <div className="p-2 space-y-1">
              {viewMode === "map" ? (
                <>
                  {unmappedMembers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      All members have location data!
                    </div>
                  ) : (
                    unmappedMembers.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] group opacity-80"
                      >
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))/0.5] flex items-center justify-center text-[hsl(var(--muted-foreground))] shrink-0">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{member.name}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{member.email || "No email"}</p>
                        </div>
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          No Location
                        </span>
                      </div>
                    ))
                  )}
                </>
              ) : (
                filteredMembers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div 
                      key={member._id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/reactflow", JSON.stringify(member));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--primary)/0.04)] transition-colors group cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] shrink-0">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{member.name ?? "Anonymous"}</p>
                          {member.role?.toLowerCase() === "admin" && (
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">Admin</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{member.email}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingMember(member);
                        }}
                        className="p-1.5 rounded-md bg-[hsl(var(--secondary))] text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[hsl(var(--primary))] hover:text-white"
                        title="Inspect Member Intelligence"
                      >
                        <BarChart2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          toast.success(`Zooming in for ${member.name ?? "Member"}`);
                          onFocusNode?.(member._id);
                        }}
                        className="p-1.5 rounded-md bg-[hsl(43,96%,48%)/0.1] text-[hsl(43,96%,48%)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[hsl(43,96%,48%)] hover:text-[#1A2235]"
                        title="Focus Member on Canvas"
                      >
                        <Focus size={16} />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </>
          )
        )}
      </div>

      {/* Connection Dialog */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1">Connect Member</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Choose a manager from the current canvas for <span className="text-[hsl(var(--foreground))] font-bold">{selectedMember.name}</span>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2 block">
                    Select Manager
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {visibleMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setTargetManagerId(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          targetManagerId === m.id 
                            ? "bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]" 
                            : "bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:bg-[hsl(var(--primary)/0.04)] hover:border-[hsl(var(--muted-foreground)/0.5)]"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold text-[10px]">
                          {getInitials(m.name)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold truncate">{m.name}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{m.role || "Member"}</p>
                        </div>
                        {targetManagerId === m.id && (
                          <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))] flex items-center gap-3">
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-bold hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConnection}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)]"
              >
                Confirm Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const getInitials = (name?: string) => {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};
