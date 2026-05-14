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
    <section className="overflow-hidden rounded-[34px] border border-[#BCD2FA] bg-[#F5F8FF] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[#1E3A8A]">
      <div className="flex flex-col gap-6 px-[22px] py-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[hsl(var(--foreground))] sm:text-base max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

export function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}
