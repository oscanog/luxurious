import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { Download, Plus, Trash2, ShieldCheck, File, Archive } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export function ApkManagementPage() {
  const releases = useQuery(api.apkReleases.listActiveReleases);
  const generateUploadUrl = useMutation(api.apkReleases.generateUploadUrl);
  const publishRelease = useMutation(api.apkReleases.publishRelease);
  const deleteRelease = useMutation(api.apkReleases.deleteRelease);

  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [version, setVersion] = useState("");
  const [buildNumber, setBuildNumber] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version || !buildNumber || !releaseNotes) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (!file.name.endsWith(".apk")) {
      toast.error("File must be an APK");
      return;
    }

    try {
      setIsUploading(true);
      toast.loading("Uploading APK...", { id: "uploading" });

      // Step 1: Generate URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      // Step 3: Save release record
      await publishRelease({
        version,
        buildNumber: parseInt(buildNumber),
        releaseNotes,
        storageId: storageId as Id<"_storage">,
        fileSize: file.size,
        fileName: file.name,
      });

      toast.success("Release published successfully", { id: "uploading" });
      setShowModal(false);
      setVersion("");
      setBuildNumber("");
      setReleaseNotes("");
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload APK", { id: "uploading" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: Id<"apkReleases">) => {
    if (confirm("Are you sure you want to delete this release?")) {
      try {
        await deleteRelease({ id, hardDelete: true });
        toast.success("Release deleted");
      } catch (err) {
        toast.error("Failed to delete release");
      }
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">APK Management</h1>
          <p className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
            Upload and manage Android builds for public distribution.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[hsl(var(--primary)/0.9)] shadow-sm"
        >
          <Plus size={18} />
          New Release
        </button>
      </div>

      <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[hsl(var(--muted)/0.5)] text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-6 py-4">Version / Build</th>
                <th className="px-6 py-4">Release Date</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {releases === undefined ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    Loading releases...
                  </td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Archive size={32} className="text-[hsl(var(--muted-foreground)/0.5)]" />
                      <p>No active releases found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                releases.map((release) => (
                  <tr key={release._id} className="transition-colors hover:bg-[hsl(var(--muted)/0.5)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[hsl(var(--foreground))]">v{release.version}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Build {release.buildNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">
                      {new Date(release.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">
                      {(release.fileSize / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {release.fileUrl && (
                          <a
                            href={release.fileUrl}
                            download={release.fileName}
                            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                            title="Download APK"
                          >
                            <Download size={18} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(release._id)}
                          className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Delete Release"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-2xl lg:p-8">
            <h2 className="text-xl font-black text-[hsl(var(--foreground))] mb-6">Publish New Release</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 1.0.4"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm font-semibold text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Build Number</label>
                  <input
                    type="number"
                    value={buildNumber}
                    onChange={(e) => setBuildNumber(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm font-semibold text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Release Notes (Markdown)</label>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="What's new in this release..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm font-medium text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">APK File</label>
                <div className="relative rounded-xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    required
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <File size={32} className="text-[hsl(var(--primary)/0.7)]" />
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                      {file ? file.name : "Click or drag APK file to upload"}
                    </p>
                    {file && (
                      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-2 border-t border-[hsl(var(--border))]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-white hover:bg-[hsl(var(--primary)/0.9)] transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Publish Build"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
