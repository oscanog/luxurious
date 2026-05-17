import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ShieldCheck, Download, Search, Share2, ArrowDownUp, ArchiveX, Copy } from "lucide-react";
import { toast } from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";

export function ApkDownloadPage() {
  const releases = useQuery(api.apkReleases.listActiveReleases);
  const [searchParams] = useSearchParams();
  const highlightedVersion = searchParams.get("v");

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const filteredAndSorted = useMemo(() => {
    if (!releases) return [];
    
    if (highlightedVersion) {
      return releases.filter(r => r.version === highlightedVersion);
    }

    let list = releases.filter((r) => {
      const vMatch = r.version.toLowerCase().includes(search.toLowerCase());
      const notesMatch = r.releaseNotes.toLowerCase().includes(search.toLowerCase());
      return vMatch || notesMatch;
    });

    list.sort((a, b) => {
      if (sortOrder === "desc") {
        return b.publishedAt - a.publishedAt;
      }
      return a.publishedAt - b.publishedAt;
    });

    return list;
  }, [releases, search, sortOrder, highlightedVersion]);

  const handleShare = async (version: string) => {
    const url = `${window.location.origin}/download?v=${version}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Luxurious App v${version}`,
          text: `Download Luxurious App v${version}`,
          url: url,
        });
        toast.success("Link shared!");
        return;
      } catch (err) {
        // Fallback to clipboard if share was cancelled or failed
        if ((err as Error).name !== "AbortError") {
           copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Simple Markdown Renderer for release notes
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="mb-12 text-center">
          <img 
            src="/luxurious_logo.png" 
            alt="Luxurious Logo" 
            className="mx-auto mb-6 h-24 w-24 object-contain drop-shadow-[0_24px_60px_hsl(221_83%_53%/0.5)]"
          />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Luxurious for Android
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-[hsl(var(--muted-foreground))]">
            Download the latest builds directly. Fully secure, always up to date.
          </p>
        </div>

        {!highlightedVersion && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
              <input
                type="text"
                placeholder="Search versions or release notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 pl-11 pr-4 text-sm font-medium text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm"
              />
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-sm font-bold shadow-sm transition-colors hover:bg-[hsl(var(--muted))]"
            >
              <ArrowDownUp size={16} />
              Sort {sortOrder === "desc" ? "Newest" : "Oldest"}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {releases === undefined ? (
            <div className="rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent"></div>
              <p className="mt-4 text-sm font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                Fetching Builds...
              </p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <ArchiveX size={28} />
              </div>
              <p className="mt-4 font-bold text-lg text-[hsl(var(--foreground))]">No builds found</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your search criteria.</p>
            </div>
          ) : (
            filteredAndSorted.map((release) => {
              const isHighlighted = highlightedVersion === release.version;
              return (
                <div 
                  key={release._id} 
                  className={`overflow-hidden rounded-[32px] border bg-[hsl(var(--card))] shadow-sm transition-all ${
                    isHighlighted ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]" : "border-[hsl(var(--border))]"
                  }`}
                >
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-[hsl(var(--foreground))]">
                            Version {release.version}
                          </h2>
                          <div className="flex items-center gap-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mt-1">
                            <span>Build {release.buildNumber}</span>
                            <span>•</span>
                            <span>{new Date(release.publishedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{(release.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium leading-relaxed text-[hsl(var(--muted-foreground))]">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--foreground))] mb-3">Release Notes</h3>
                        <div className="space-y-1.5">
                          {renderMarkdown(release.releaseNotes)}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start gap-3 border-t border-[hsl(var(--border))] pt-6 sm:border-0 sm:pt-0 sm:pl-6 sm:border-l">
                      {release.fileUrl && (
                        <a
                          href={release.fileUrl}
                          download={release.fileName}
                          className="flex h-14 items-center justify-center gap-2 rounded-[20px] bg-[hsl(var(--primary))] px-6 text-sm font-bold text-white shadow-lg shadow-[hsl(var(--primary)/0.25)] transition-all hover:scale-105 hover:bg-[hsl(var(--primary)/0.9)] active:scale-95"
                        >
                          <Download size={20} />
                          <span className="hidden sm:inline">Download APK</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleShare(release.version)}
                        className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-all hover:bg-[hsl(var(--muted))] active:scale-95"
                        title="Share link"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-16 text-center text-sm font-semibold text-[hsl(var(--muted-foreground))]">
          <Link to="/" className="hover:text-[hsl(var(--foreground))] transition-colors">Return to Login</Link>
        </div>
      </div>
    </div>
  );
}
