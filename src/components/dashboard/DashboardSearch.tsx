import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block w-full lg:w-[320px]", className)}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        size={16}
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 pl-11 pr-4 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.1)]"
      />
    </label>
  );
}

export function DashboardFilterGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}

export function DashboardFilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all",
        active
          ? "bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.25)]"
          : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
      )}
    >
      {label}
    </button>
  );
}
