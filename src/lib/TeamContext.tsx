import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type TeamInfo = {
  _id: Id<"teams">;
  name: string;
  slug: string;
  role: string;
  isDefault: boolean;
};

type TeamContextValue = {
  activeTeamId: Id<"teams"> | null;
  activeTeam: { _id: Id<"teams">; name: string; slug: string; isDefault: boolean } | null;
  teams: TeamInfo[];
  hasTeams: boolean;
  isLoading: boolean;
  switchTeam: (teamId: Id<"teams">) => Promise<void>;
};

const TeamContext = createContext<TeamContextValue>({
  activeTeamId: null,
  activeTeam: null,
  teams: [],
  hasTeams: false,
  isLoading: true,
  switchTeam: async () => {},
});

export function useTeam() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const mobileStatus = useQuery(api.mobile.status);
  const setActiveTeam = useMutation(api.teams.setActiveTeam);

  const value = useMemo<TeamContextValue>(() => {
    if (!mobileStatus) {
      return {
        activeTeamId: null,
        activeTeam: null,
        teams: [],
        hasTeams: false,
        isLoading: true,
        switchTeam: async () => {},
      };
    }

    const teams: TeamInfo[] = (mobileStatus.teams ?? []) as TeamInfo[];
    const activeTeamId = (mobileStatus.activeTeamId as Id<"teams"> | null) ?? null;
    const activeTeam = activeTeamId
      ? teams.find((t) => t._id === activeTeamId) ?? null
      : teams[0] ?? null;

    return {
      activeTeamId: activeTeam?._id ?? null,
      activeTeam: activeTeam
        ? {
            _id: activeTeam._id,
            name: activeTeam.name,
            slug: activeTeam.slug,
            isDefault: activeTeam.isDefault,
          }
        : null,
      teams,
      hasTeams: teams.length > 0,
      isLoading: false,
      switchTeam: async (teamId: Id<"teams">) => {
        await setActiveTeam({ teamId });
      },
    };
  }, [mobileStatus, setActiveTeam]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}
