import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export function TeamManagementPage() {
  const navigate = useNavigate();
  const isAdmin = useQuery(api.admin.isAdmin);
  const createTeam = useMutation(api.teams.createTeam);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    masterName: "",
    masterEmail: "",
    masterPassword: "",
  });

  // Not yet determined (query loading)
  if (isAdmin === undefined) return null;

  if (!isAdmin) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[hsl(var(--background))]">
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-black text-[hsl(var(--foreground))]">Restricted Access</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            You must be a Super Admin to manage teams.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.masterName || !formData.masterEmail || !formData.masterPassword) {
      toast.error("Please fill all fields.");
      return;
    }
    
    setIsLoading(true);
    try {
      await createTeam({
        name: formData.name,
        slug: formData.slug.toLowerCase().trim(),
        masterUplineName: formData.masterName,
        masterUplineEmail: formData.masterEmail,
        masterUplinePassword: formData.masterPassword,
      });
      toast.success("Team created and Master Upline initialized!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Failed to create team.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Team Management</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))] text-sm">
          Super Admin controls for multi-team encapsulation.
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-[30px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-sm">
          <h2 className="text-xl font-black mb-6">Create New Team</h2>
          
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Team Details</h3>
              <input
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none"
                placeholder="Team Name (e.g. Dream Team)"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                disabled={isLoading}
              />
              <input
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none lowercase"
                placeholder="Team Slug (server address, e.g. dream-team)"
                value={formData.slug}
                onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Master Upline Account</h3>
              <input
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none"
                placeholder="Full Name"
                value={formData.masterName}
                onChange={(e) => setFormData(f => ({ ...f, masterName: e.target.value }))}
                disabled={isLoading}
              />
              <input
                type="email"
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none"
                placeholder="Email Address"
                value={formData.masterEmail}
                onChange={(e) => setFormData(f => ({ ...f, masterEmail: e.target.value }))}
                disabled={isLoading}
              />
              <input
                type="password"
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm font-bold placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] outline-none"
                placeholder="Initial Login Password"
                value={formData.masterPassword}
                onChange={(e) => setFormData(f => ({ ...f, masterPassword: e.target.value }))}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] px-6 py-4 text-sm font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <Plus size={18} />
                  Provision Team & Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
