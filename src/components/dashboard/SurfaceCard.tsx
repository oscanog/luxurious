import { cn } from "@/lib/utils";

export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_24px_80px_-56px_hsl(220_60%_20%_/_0.42)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
