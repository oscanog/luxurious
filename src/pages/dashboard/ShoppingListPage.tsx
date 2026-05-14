import { useMutation, useQuery } from "convex/react";
import { ShoppingBasket, Trash2, CheckCircle2, Filter } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function ShoppingListPage() {
  const items = useQuery(api.shopping.getItems);
  const addItem = useMutation(api.shopping.addItem);
  const toggleItem = useMutation(api.shopping.toggleItem);
  const removeItem = useMutation(api.shopping.removeItem);
  const clearChecked = useMutation(api.shopping.clearChecked);

  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newCat, setNewCat] = useState("General");
  const [newPri] = useState<"low" | "medium" | "high">("medium");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      await addItem({ name: newItem, quantity: newQty, category: newCat, priority: newPri });
      setNewItem("");
      setNewQty("1");
      toast.success("Item added");
    } catch {
      toast.error("Failed to add item");
    }
  }

  if (items === undefined) {
    return (
      <DashboardPageShell>
        <DashboardPageHero eyebrow="Inventory" title="Loading items..." description="Syncing your shopping list." icon={ShoppingBasket} />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </DashboardPageShell>
    );
  }

  const categories = Array.from(new Set(items.map(i => i.category)));
  const pendingCount = items.filter(i => !i.isChecked).length;

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Asset Management"
        title="Shopping List."
        description="Collaborative list for network assets, supplies, and office requirements. Grouped by budget category."
        icon={ShoppingBasket}
        badges={[
          { label: `${items.length} items`, tone: "neutral" },
          { label: pendingCount > 0 ? `${pendingCount} to buy` : "All clear", tone: pendingCount > 0 ? "primary" : "success" },
        ]}
        metrics={[
          { label: "Remaining", value: pendingCount },
          { label: "Completed", value: items.filter(i => i.isChecked).length, tone: "success" },
          { label: "Sync", value: "Real-time" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <form onSubmit={(e) => { void handleAdd(e); }} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5 block">Item Name</label>
                <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="e.g. Printer Paper"
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[hsl(var(--primary))]" />
              </div>
              <div className="w-20">
                <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5 block">Qty</label>
                <input type="text" value={newQty} onChange={e => setNewQty(e.target.value)}
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-[hsl(var(--primary))]" />
              </div>
              <div className="w-32">
                <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5 block">Category</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value)}
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-[hsl(var(--primary))]">
                  <option>General</option>
                  <option>Office</option>
                  <option>Tech</option>
                  <option>Home</option>
                </select>
              </div>
              <button type="submit"
                className="h-10 px-6 rounded-xl bg-[hsl(var(--primary))] text-white font-black text-xs shadow-lg shadow-[hsl(var(--primary)/0.2)] active:scale-95 transition-all">
                ADD ITEM
              </button>
            </form>
          </SurfaceCard>

          <div className="space-y-8">
            {categories.length === 0 && (
              <div className="py-20 text-center">
                <ShoppingBasket size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">List is empty</p>
              </div>
            )}
            
            {categories.sort().map(cat => (
              <div key={cat} className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] px-1 flex items-center gap-2">
                  <Filter size={10} /> {cat}
                </h3>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))] overflow-hidden shadow-sm">
                  {items.filter(i => i.category === cat).map(item => (
                    <div key={item._id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${item.isChecked ? "bg-[hsl(var(--muted)/0.15)]" : "hover:bg-[hsl(var(--muted)/0.1)]"}`}>
                      <button onClick={() => { void toggleItem({ id: item._id, isChecked: !item.isChecked }); }}
                        className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${item.isChecked ? "bg-[hsl(var(--primary))] text-white" : "border-2 border-[hsl(var(--border))] text-transparent"}`}>
                        <CheckCircle2 size={12} />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold transition-all ${item.isChecked ? "text-[hsl(var(--muted-foreground))] line-through" : "text-[hsl(var(--foreground))]"}`}>
                          {item.name}
                        </p>
                        <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{item.quantity}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <ToneBadge tone={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "neutral"}>
                          {item.priority}
                        </ToneBadge>
                        <button onClick={() => { void removeItem({ id: item._id }); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <button onClick={() => { void clearChecked(); }}
            className="w-full py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] text-xs font-black uppercase tracking-widest hover:bg-[hsl(var(--muted)/0.3)] transition-all">
            Clear Completed
          </button>

          <div className="grid gap-4">
            <DashboardMetricCard 
              label="Urgent Items" 
              value={items.filter(i => i.priority === "high" && !i.isChecked).length} 
              hint="High priority pending." 
            />
            <DashboardMetricCard 
              label="Total Estimate" 
              value={`$${(items.length * 25).toLocaleString()}`} 
              hint="Projected spend based on history." 
            />
          </div>

          <SurfaceCard className="p-6">
            <DashboardSectionTitle
              eyebrow="Automation"
              title="Recurring Lists"
              description="Automate office supplies and routine asset maintenance."
            />
            <div className="mt-5 space-y-3">
              <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] flex items-center justify-between">
                <span className="text-xs font-bold">Office Coffee</span>
                <span className="text-[10px] font-black text-[hsl(var(--primary))] uppercase">Every 1st</span>
              </div>
              <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] flex items-center justify-between">
                <span className="text-xs font-bold">Server Backup</span>
                <span className="text-[10px] font-black text-[hsl(var(--primary))] uppercase">Every Sun</span>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}

