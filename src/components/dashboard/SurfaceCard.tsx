import { cn } from "@/lib/utils";

export function SurfaceCard({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <section
      onClick={onClick}
      className={cn(
        "rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        className,
      )}
      style={{ boxShadow: "var(--shadow-surface)" }}

    >
      {children}
    </section>
  );
}
