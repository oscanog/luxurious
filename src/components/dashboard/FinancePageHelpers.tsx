/* eslint-disable react-refresh/only-export-components */
import type { LucideIcon } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const HERO_TONES = {
  primary: "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]",
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  warning: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
  danger: "bg-red-500/12 text-red-600 dark:text-red-300",
  neutral: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
} as const;

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Dividends", "Other"] as const;
export const EXPENSE_CATEGORIES = [
  "Food",
  "Dining Out",
  "Bills",
  "Shopping",
  "Fun",
  "Entertainment",
  "Transport",
  "Groceries",
  "Other",
] as const;

export function DashboardPageShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>;
}

export function DashboardPageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  badges = [],
  metrics = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badges?: Array<{ label: string; tone?: keyof typeof HERO_TONES }>;
  metrics?: Array<{ label: string; value: React.ReactNode; tone?: keyof typeof HERO_TONES }>;
}) {
  return (
    <section className="overflow-hidden rounded-[34px] border border-[#BCD2FA] bg-[#F5F8FF] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[#1E3A8A]">
      <div className="flex flex-col gap-6 px-[22px] pt-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
        <div className="flex-1 pb-[18px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--background)/0.6)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
              <Icon size={13} />
              {eyebrow}
            </span>
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                  HERO_TONES[badge.tone ?? "neutral"],
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[hsl(var(--foreground))] sm:text-base max-w-2xl">
            {description}
          </p>
        </div>

        {metrics.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:mb-[18px] xl:min-w-[420px] xl:grid-cols-3">
            {metrics.map((metric) => (
              <SurfaceCard key={metric.label} className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4 shadow-none">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {metric.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-2xl font-black tabular-nums",
                    metric.tone === "success"
                      ? "text-emerald-600 dark:text-emerald-300"
                      : metric.tone === "warning"
                        ? "text-amber-600 dark:text-amber-300"
                        : "text-[hsl(var(--foreground))]",
                  )}
                >
                  {metric.value}
                </p>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function DashboardMetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <SurfaceCard className={cn("p-4 sm:p-5", className)}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[hsl(var(--foreground))]">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{hint}</p> : null}
    </SurfaceCard>
  );
}

export function DashboardSectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-black text-[hsl(var(--foreground))]">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
      ) : null}
    </div>
  );
}

export function DashboardEmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <SurfaceCard className="border-dashed p-8 text-center">
      {Icon ? (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
          <Icon size={22} />
        </div>
      ) : null}
      <h3 className="mt-4 text-lg font-black text-[hsl(var(--foreground))]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
    </SurfaceCard>
  );
}

export function DashboardDataSkeleton({
  metricCount = 3,
  rowCount = 3,
}: {
  metricCount?: number;
  rowCount?: number;
}) {
  return (
    <DashboardPageShell>
      <Skeleton className="h-44 rounded-[28px]" />
      <div className={`grid gap-4 ${metricCount > 3 ? "lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {Array.from({ length: metricCount }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[28px]" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: rowCount }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[28px]" />
        ))}
      </div>
    </DashboardPageShell>
  );
}

export function DashboardTextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))]"
      />
    </label>
  );
}

export function DashboardTextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))]"
      />
    </label>
  );
}

export function DashboardSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DashboardDateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <DashboardTextField label={label} type="datetime-local" value={value} onChange={onChange} />;
}

export function DashboardProgressBar({
  value,
  max = 100,
  tone = "primary",
}: {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning";
}) {
  const width = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  const fillClassName =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-[hsl(var(--primary))]";

  return (
    <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
      <div className={cn("h-full rounded-full transition-all", fillClassName)} style={{ width: `${width}%` }} />
    </div>
  );
}

export function ToneBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof HERO_TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]",
        HERO_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function formatCurrency(amount: number, currencyCode = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDate(value: number | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

export function formatDateTimeInputValue(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}
