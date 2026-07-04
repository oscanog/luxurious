import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Save, Users, Building } from "lucide-react";
import toast from "react-hot-toast";

export function WorkspaceSettingsPage() {
  const mobileStatus = useQuery(api.mobile.status);
  
  // Example dummy handlers for now, can be wired to real Convex mutations later
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  if (mobileStatus === undefined) return null;

  if (!mobileStatus.canManageWorkspace) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[hsl(var(--background))]">
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-black text-[hsl(var(--foreground))]">Restricted Access</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            You must be a Workspace Admin (Level 3 or higher) to manage this team.
          </p>
        </div>
      </div>
    );
  }

  // Active Team info from mobileStatus
  const activeTeamId = mobileStatus.activeTeamId;
  const activeTeam = mobileStatus.teams.find(t => t._id === activeTeamId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Wire up to a Convex mutation like `api.teams.updateTeam`
    setTimeout(() => {
      toast.success("Workspace settings updated placeholder.");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Workspace Settings</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))] text-sm">
          Manage your team configuration and roles for <strong className="text-[hsl(var(--primary))]">{activeTeam?.name ?? "your team"}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-[30px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
              <Building size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black">Team Details</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Update your server address and name</p>
            </div>
          </div>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Configuration</h3>
              <div>
                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] block mb-1">Team Name</label>
                <input
                  className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none"
                  placeholder={activeTeam?.name ?? "Team Name"}
                  value={formData.name || activeTeam?.name || ""}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] block mb-1">Server Address (Slug)</label>
                <input
                  className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none lowercase"
                  placeholder={activeTeam?.slug ?? "team-slug"}
                  value={formData.slug || activeTeam?.slug || ""}
                  onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] px-6 py-4 text-sm font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Placeholder for Membership Management */}
        <div className="rounded-[30px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(222_47%_11%)]">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black">Workspace Admins</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Manage who can configure this team</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={48} className="text-[hsl(var(--muted))] mb-4" />
            <h3 className="text-lg font-bold">Membership Portal</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mt-2">
              This area will house the management of workspace members, where you can promote members to Admin Role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
