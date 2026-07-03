import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { Globe, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";

type TeamJoinModalProps = {
  onJoined: () => void;
};

export function TeamJoinModal({ onJoined }: TeamJoinModalProps) {
  const savedTeam = localStorage.getItem("lux_saved_team") ?? "";
  const [slug, setSlug] = useState(savedTeam);
  const [isJoining, setIsJoining] = useState(false);
  const autoJoinAttempted = useRef(false);

  const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
  const teamLookup = useQuery(
    api.teams.getTeamBySlug,
    normalizedSlug.length >= 2 ? { slug: normalizedSlug } : "skip",
  );

  const joinTeam = useMutation(api.teams.joinTeam);

  const handleJoin = useCallback(async () => {
    if (!teamLookup || isJoining) return;
    setIsJoining(true);
    try {
      const result = await joinTeam({ slug: normalizedSlug });
      if (result.alreadyMember) {
        toast.success("Already a member! Switched to this team.", {
          style: {
            borderRadius: "16px",
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
            fontWeight: "bold",
            fontSize: "13px",
          },
        });
      } else {
        toast.success(`Joined ${teamLookup.name}!`, {
          style: {
            borderRadius: "16px",
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
            fontWeight: "bold",
            fontSize: "13px",
          },
        });
      }
      onJoined();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to join team.", {
        style: {
          borderRadius: "16px",
          background: "hsl(var(--card))",
          color: "hsl(0 84% 61%)",
          border: "1px solid hsl(var(--border))",
          fontWeight: "bold",
          fontSize: "13px",
        },
      });
    } finally {
      setIsJoining(false);
    }
  }, [teamLookup, isJoining, joinTeam, normalizedSlug, onJoined]);

  // Auto-join if team slug was saved from login page
  useEffect(() => {
    if (autoJoinAttempted.current || !savedTeam) return;
    if (teamLookup && teamLookup._id) {
      autoJoinAttempted.current = true;
      void handleJoin();
    }
  }, [savedTeam, teamLookup, handleJoin]);

  const isValidSlug = normalizedSlug.length >= 2;
  const teamFound = isValidSlug && teamLookup !== undefined && teamLookup !== null;
  const teamNotFound = isValidSlug && teamLookup === null;
  const isSearching = isValidSlug && teamLookup === undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(221_49%_6%/0.85)] backdrop-blur-xl">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-[hsl(221_83%_53%/0.15)] blur-[120px]" />
        <div className="absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-[hsl(43_96%_48%/0.12)] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(221_83%_53%/0.08)] blur-[80px]" />
      </div>

      <div className="relative mx-4 w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-500">
        {/* Glass card */}
        <div className="rounded-[34px] border border-white/10 bg-[hsl(var(--card)/0.92)] p-8 shadow-[0_40px_100px_-20px_hsl(221_83%_20%/0.5)] backdrop-blur-2xl sm:p-10">
          {/* Logo / icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] shadow-[0_16px_48px_-24px_hsl(221_83%_53%/0.6)]">
            <Globe className="h-9 w-9 text-white" strokeWidth={2.2} />
          </div>

          {/* Heading */}
          <h1 className="mt-7 text-center text-[26px] font-black tracking-tight text-[hsl(var(--foreground))]">
            Join your team
          </h1>
          <p className="mt-2.5 text-center text-[14px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Enter the server address provided by your team leader to get started.
          </p>

          {/* Input */}
          <div className="mt-8">
            <label
              htmlFor="team-slug-input"
              className="mb-2 block text-[12px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
            >
              Server Address
            </label>
            <div className="relative">
              <input
                id="team-slug-input"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="luxxurious-team"
                autoFocus
                autoComplete="off"
                className="w-full rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-4 text-[16px] font-semibold text-[hsl(var(--foreground))] outline-none transition-all placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && teamFound) {
                    void handleJoin();
                  }
                }}
              />
              {/* Status indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isSearching && (
                  <Loader2
                    className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]"
                  />
                )}
                {teamFound && (
                  <CheckCircle className="h-5 w-5 text-[hsl(152_69%_42%)]" />
                )}
                {teamNotFound && (
                  <AlertCircle className="h-5 w-5 text-[hsl(0_84%_61%)]" />
                )}
              </div>
            </div>

            {/* Team name preview */}
            {teamFound && (
              <div className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-[hsl(152_69%_42%/0.3)] bg-[hsl(152_69%_42%/0.08)] px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(152_69%_42%/0.15)]">
                  <CheckCircle className="h-4 w-4 text-[hsl(152_69%_42%)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-[hsl(var(--foreground))]">
                    {teamLookup.name}
                  </p>
                  {teamLookup.description && (
                    <p className="truncate text-[12px] text-[hsl(var(--muted-foreground))]">
                      {teamLookup.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Not found */}
            {teamNotFound && (
              <p className="mt-3 text-[13px] font-medium text-[hsl(0_84%_61%)] animate-in fade-in duration-200">
                Team not found. Double-check the address.
              </p>
            )}
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!teamFound || isJoining}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-[linear-gradient(135deg,hsl(221_83%_53%),hsl(221_83%_45%))] px-6 py-4 text-[15px] font-bold text-white shadow-[0_12px_32px_-8px_hsl(221_83%_53%/0.5)] transition-all hover:shadow-[0_16px_40px_-8px_hsl(221_83%_53%/0.6)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100"
          >
            {isJoining ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Join Team
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Footer hint */}
          <p className="mt-5 text-center text-[12px] text-[hsl(var(--muted-foreground)/0.6)]">
            Don't have a server address? Contact your team leader.
          </p>
        </div>
      </div>
    </div>
  );
}
