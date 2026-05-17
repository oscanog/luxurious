import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Camera } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { SocialPost } from "@/components/social/types";
import {
  DashboardDataSkeleton,
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardPageShell,
} from "@/components/dashboard/FinancePageHelpers";
import {
  DashboardFilterButton,
  DashboardFilterGroup,
  DashboardSearch,
} from "@/components/dashboard/DashboardSearch";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";

type FeedScope = "all" | "mine" | "saved";

const FEED_SCOPES: Array<{ value: FeedScope; label: string }> = [
  { value: "all", label: "All Posts" },
  { value: "mine", label: "My Posts" },
  { value: "saved", label: "Saved" },
];

export function SocialFeedPage() {
  const [scope, setScope] = useState<FeedScope>("all");
  const [hashtag, setHashtag] = useState("");
  const posts = useQuery(api.socialFeed.getHomeFeed, {
    scope,
    hashtag: hashtag.trim() ? hashtag.trim().replace(/^#/, "") : undefined,
    limit: 15,
  }) as SocialPost[] | undefined;
  const toggleLike = useMutation(api.socialFeed.toggleLike);
  const toggleSave = useMutation(api.socialFeed.toggleSave);

  async function handleShare(sharePath: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
      toast.success("Post link copied.");
    } catch {
      toast.error("Copy failed.");
    }
  }

  async function handleToggleLike(postId: string) {
    try {
      await toggleLike({ postId: postId as never });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Like failed.");
    }
  }

  async function handleToggleSave(postId: string) {
    try {
      await toggleSave({ postId: postId as never });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    }
  }

  if (posts === undefined) {
    return <DashboardDataSkeleton metricCount={3} rowCount={3} />;
  }

  const publicCount = posts.filter((post) => post.visibility === "public").length;
  const privateCount = posts.filter((post) => post.visibility === "private").length;

  return (
    <DashboardPageShell>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <DashboardFilterGroup>
            {FEED_SCOPES.map((item) => (
              <DashboardFilterButton
                key={item.value}
                label={item.label}
                active={scope === item.value}
                onClick={() => setScope(item.value)}
              />
            ))}
          </DashboardFilterGroup>
          <DashboardSearch
            value={hashtag}
            onChange={setHashtag}
            placeholder="Filter hashtag. Example: win or #lux"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardMetricCard label="Posts Loaded" value={posts.length} hint={`${publicCount} public • ${privateCount} private`} />
          <SurfaceCard className="p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              Composer
            </p>
            <Link to="/social-feed/new" className="mt-2 block text-2xl font-black text-[hsl(var(--primary))]">
              New Testimonial
            </Link>
            <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
              Single active draft auto-resumes.
            </p>
          </SurfaceCard>
        </div>
      </div>

      {posts.length === 0 ? (
        <DashboardEmptyState
          title="No testimonials found."
          description="Change scope, clear hashtag, or make first testimonial."
          icon={Camera}
        />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onShare={handleShare}
              onHashtagClick={(value) => setHashtag(value)}
            />
          ))}
        </div>
      )}

    </DashboardPageShell>
  );
}
