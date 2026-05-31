import { useState } from "react";
import { MapPin, Search, X, PenSquare, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberAddressDirectoryDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  members: any[];
}

type StatusTab = "joined" | "invited" | "pending" | "to-invite";

export function MemberAddressDirectoryDrawer({ isOpen, onToggle, members }: MemberAddressDirectoryDrawerProps) {
  const [tab, setTab] = useState<StatusTab>("joined");
  const [search, setSearch] = useState("");
  const [addressFilter, setAddressFilter] = useState("All Addresses");
  const [sortOrder, setSortOrder] = useState("Name A-Z");

  const filteredMembers = members.filter(m => {
    if (m.status !== tab) return false;
    if (search && !m.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (addressFilter === "With Address" && !m.latitude) return false;
    if (addressFilter === "No Address" && m.latitude) return false;
    return true;
  }).sort((a, b) => {
    if (sortOrder === "Name A-Z") return (a.name || "").localeCompare(b.name || "");
    if (sortOrder === "Name Z-A") return (b.name || "").localeCompare(a.name || "");
    return 0;
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Drawer */}
      <div 
        className={cn(
          "fixed right-0 top-0 h-full bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] transition-all duration-300 z-50 flex flex-col shadow-2xl",
          isOpen ? "w-[400px] max-w-[100vw]" : "w-0 overflow-hidden border-none"
        )}
      >
        <div className="w-[400px] max-w-[100vw] h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between shrink-0">
            <h2 className="font-black text-sm uppercase tracking-wider text-[hsl(var(--foreground))] flex items-center gap-2">
              <MapPin size={18} className="text-[hsl(43,96%,48%)]" />
              ADDRESS DIRECTORY
            </h2>
            <button onClick={onToggle} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(["joined", "invited", "pending", "to-invite"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                    tab === t 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                      : "bg-transparent border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, role, address..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[hsl(var(--primary))]"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select 
                value={addressFilter}
                onChange={e => setAddressFilter(e.target.value)}
                className="flex-1 bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option>All Addresses</option>
                <option>With Address</option>
                <option>No Address</option>
              </select>
              <select 
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="flex-1 bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option>Name A-Z</option>
                <option>Name Z-A</option>
              </select>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3 mt-2">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No members found in this category.
                </div>
              ) : (
                filteredMembers.map(member => (
                  <div key={member.id} className="bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[hsl(43,96%,48%)/0.1] text-[hsl(43,96%,48%)] flex items-center justify-center font-black text-lg">
                          {member.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-bold text-[hsl(var(--foreground))] text-sm">{member.name}</h3>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{member.roleTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-[hsl(43,96%,48%)] p-1 hover:bg-[hsl(43,96%,48%)/0.1] rounded">
                          <ScanLine size={16} />
                        </button>
                        <button className="text-blue-500 p-1 hover:bg-blue-500/10 rounded">
                          <PenSquare size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-3 flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                      <MapPin size={14} className="opacity-50" />
                      <span className="text-xs italic">
                        {member.latitude && member.longitude 
                          ? `${member.city ?? ""}${member.province ? `, ${member.province}` : ""}${member.country ? `, ${member.country}` : ""}`.replace(/^, /, "") || `Lat: ${member.latitude.toFixed(4)}, Lng: ${member.longitude.toFixed(4)}`
                          : "No address set"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
