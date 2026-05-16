import { useEffect, useState } from "react";

export function HeaderClocks() {
  const [phTime, setPhTime] = useState("");
  const [caTime, setCaTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const phFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      
      const caFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      setPhTime(phFormatter.format(now));
      setCaTime(caFormatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden min-w-0 items-center justify-center gap-4 md:flex xl:px-4">
      <div className="flex items-center gap-4 rounded-[22px] border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--primary)/0.06)] px-5 py-2.5 shadow-sm transition-all hover:bg-[hsl(var(--primary)/0.08)]">
        <div className="flex items-center gap-2 border-r border-[hsl(var(--primary)/0.2)] pr-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">PH</span>
          <span className="font-mono text-xs font-bold tabular-nums text-[hsl(var(--foreground))]">{phTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">CA</span>
          <span className="font-mono text-xs font-bold tabular-nums text-[hsl(var(--foreground))]">{caTime}</span>
        </div>
      </div>
    </div>
  );
}
