import { Sparkles } from "lucide-react";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";

export function PlaceholderSupportPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <SurfaceCard className="p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-lg font-black text-[hsl(var(--foreground))]">Parity placeholder shipped</p>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Route, label, and shell placement now match mobile. Full behavior can be expanded without changing user mental model.
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
