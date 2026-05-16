import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function NetworkPulseChip() {
  const dashboard = useQuery(api.network.getDashboard);
  
  if (!dashboard) return null;

  const { joinedCount, invitedCount, pendingCount } = dashboard.stats;

  return (
    <div className="flex items-center gap-3 rounded-full bg-[hsl(var(--muted)/0.5)] px-4 py-1.5 text-[11px] font-bold">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </span>
        <span className="text-[hsl(var(--foreground))]">{joinedCount} Joined</span>
      </div>
      <div className="h-3 w-[1px] bg-[hsl(var(--border))]" />
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" style={{ animationDelay: '0.2s' }}></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
        </span>
        <span className="text-[hsl(var(--foreground))]">{invitedCount} Invited</span>
      </div>
      <div className="h-3 w-[1px] bg-[hsl(var(--border))]" />
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" style={{ animationDelay: '0.4s' }}></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
        </span>
        <span className="text-[hsl(var(--foreground))]">{pendingCount} Pending</span>
      </div>
    </div>
  );
}
