import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldCheck, Save, Users, Building, Upload, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export function WorkspaceSettingsPage() {
  const mobileStatus = useQuery(api.mobile.status);
  const generateUploadUrl = useMutation(api.teams.generateUploadUrl);
  const updateLogoMutation = useMutation(api.teams.updateLogo);
  const updateTeamMutation = useMutation(api.teams.updateTeam);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
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

  const activeTeamId = mobileStatus.activeTeamId;
  const activeTeam = mobileStatus.teams.find(t => t._id === activeTeamId);
  const activeTeamFull = useQuery(api.teams.getTeamBySlug, activeTeam?.slug ? { slug: activeTeam.slug } : "skip");

  const processImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Resize to 256x256 max for fast loading
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No 2d context"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Canvas to Blob failed"));
          const webpFile = new File([blob], "logo.webp", { type: "image/webp" });
          resolve(webpFile);
        }, "image/webp", 0.85); // 85% quality webp
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const webpFile = await processImage(file);
      setLogoFile(webpFile);
      setLogoPreview(URL.createObjectURL(webpFile));
    } catch (err) {
      toast.error("Failed to process image");
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamId) return;
    setIsSaving(true);
    try {
      if (logoFile) {
        setIsUploading(true);
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });
        const { storageId } = await result.json();
        await updateLogoMutation({ teamId: activeTeamId, logoId: storageId });
        setLogoFile(null);
      }
      
      const newName = formData.name || activeTeam?.name || "";
      const newSlug = formData.slug || activeTeam?.slug || "";
      
      if (newName !== activeTeam?.name || newSlug !== activeTeam?.slug) {
        await updateTeamMutation({ 
          teamId: activeTeamId, 
          name: newName, 
          slug: newSlug 
        });
      }

      toast.success("Workspace settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
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
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-[inset_0_2px_10px_hsl(var(--muted)/0.1)]">
              <div className="relative group">
                <div className="flex h-24 w-24 overflow-hidden items-center justify-center rounded-2xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all group-hover:border-[hsl(var(--primary))]">
                  {logoPreview ? (
                    <img src={logoPreview} alt="New Logo" className="h-full w-full object-cover" />
                  ) : activeTeamFull?.logoUrl ? (
                    <img src={activeTeamFull.logoUrl} alt="Current Logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                  <Upload size={14} strokeWidth={3} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-sm font-black text-[hsl(var(--foreground))]">Workspace Logo</h3>
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mt-1 max-w-[250px]">
                  Upload a square image. Auto-converts to WebP (optimized max 256px resolution).
                </p>
              </div>
            </div>

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
              disabled={isSaving || isUploading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] px-6 py-4 text-sm font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              <Save size={18} />
              {isUploading ? "Uploading Logo..." : isSaving ? "Saving..." : "Save Changes"}
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
