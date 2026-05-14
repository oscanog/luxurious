/* eslint-disable react-refresh/only-export-components */
import { SurfaceCard } from "./SurfaceCard";

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="relative overflow-hidden p-6 sm:p-8">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at top left, hsl(221 83% 53% / 0.18), transparent 30%), radial-gradient(circle at top right, hsl(43 96% 48% / 0.16), transparent 28%)",
        }}
      />
      <div className="relative z-10 max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">{description}</p>
      </div>
    </SurfaceCard>
  );
}

export function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}
