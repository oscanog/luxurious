import { useQuery } from "convex/react";
import { CalendarDays, CalendarCheck, Clock, Plus } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function CalendarPage() {
  const events = useQuery(api.planning.getEvents);

  if (events === undefined) {
    return (
      <DashboardPageShell>
        <DashboardPageHero
          eyebrow="Planning"
          title="Loading calendar..."
          description="Fetching your scheduled events and reminders."
          icon={CalendarDays}
        />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </DashboardPageShell>
    );
  }

  const upcomingCount = events.filter(e => !e.isDone && new Date(e.date) >= new Date()).length;
  const financialCount = events.filter(e => e.category === "financial").length;

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Network Planning"
        title="Scheduled events."
        description="Dynamic agenda view syncs with your mobile planning schedule and network reminders."
        icon={CalendarDays}
        badges={[
          { label: `${events.length} total events`, tone: "neutral" },
          { label: upcomingCount > 0 ? `${upcomingCount} upcoming` : "No pending", tone: upcomingCount > 0 ? "success" : "neutral" },
        ]}
        metrics={[
          { label: "Financial", value: financialCount },
          { label: "Network", value: events.filter(e => e.category === "network").length },
          { label: "Done", value: events.filter(e => e.isDone).length, tone: "success" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              Agenda View
            </h3>
            <button className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--primary))] hover:underline">
              <Plus size={14} /> New Event
            </button>
          </div>
          
          <div className="divide-y divide-[hsl(var(--border))]">
            {events.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarCheck size={40} className="mx-auto mb-3 opacity-20 text-[hsl(var(--muted-foreground))]" />
                <p className="text-sm font-bold text-[hsl(var(--muted-foreground))]">No events scheduled.</p>
              </div>
            ) : (
              [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event) => (
                <div key={event._id} className="flex items-center gap-4 px-6 py-5 hover:bg-[hsl(var(--muted)/0.2)] transition-colors group">
                  <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-transparent group-hover:border-[hsl(var(--border))] transition-all">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-[hsl(var(--muted-foreground))]">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black leading-none text-[hsl(var(--foreground))]">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className={`text-sm font-bold truncate ${event.isDone ? "text-[hsl(var(--muted-foreground))] line-through" : "text-[hsl(var(--foreground))]"}`}>
                        {event.title}
                      </p>
                      <ToneBadge tone={event.category === "financial" ? "warning" : event.category === "network" ? "primary" : "neutral"}>
                        {event.category}
                      </ToneBadge>
                    </div>
                    {event.description && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{event.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                      <Clock size={12} />
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.isDone && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[hsl(152_69%_42%)]">
                        <CalendarCheck size={12} /> Done
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardMetricCard 
              label="Next Event" 
              value={events.find(e => !e.isDone)?.title ?? "None"} 
              hint="Soonest pending item." 
            />
            <DashboardMetricCard 
              label="Sync Status" 
              value="Live" 
              hint="Connected to Convex." 
            />
          </div>

          <SurfaceCard className="p-6">
            <DashboardSectionTitle
              eyebrow="Reminders"
              title="Finance cadences"
              description="Automatically derived from your installment and debt plan payment dates."
            />
            <div className="mt-5 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <p>• Installment due dates appear 3 days before expiry.</p>
              <p>• Budget check-ins occur every Sunday morning.</p>
              <p>• Debt milestone reminders trigger at 25% increments.</p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
