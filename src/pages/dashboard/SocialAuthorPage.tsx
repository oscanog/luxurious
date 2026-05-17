import { useMutation, useQuery } from "convex/react";
import { GalleryHorizontal } from "lucide-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { SocialAuthor, SocialPost } from "@/components/social/types";
import {
  DashboardEmptyState,
  DashboardPageHero,
  DashboardPageShell,
} from "@/components/dashboard/FinancePageHelpers";
import { Skeleton } from "@/components/ui/Skeleton";

type AuthorPayload = {
  author: SocialAuthor;
  posts: SocialPost[];
};

export function SocialAuthorPage() {
  const { userId } = useParams();
  const payload = useQuery(
    api.socialFeed.getAuthorPosts,
    userId ? { userId: userId as never, limit: 18 } : "skip",
  ) as AuthorPayload | undefined;
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

  if (payload === undefined) {
    return (
      <DashboardPageShell>
        <Skeleton className="h-48 rounded-[32px]" />
        <Skeleton className="h-[520px] rounded-[32px]" />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Author"
        title={payload.author.displayName}
        description="Public posts for other viewers. Own view and admin view include private posts."
        icon={GalleryHorizontal}
        badges={[
          { label: `${payload.posts.length} posts`, tone: "primary" },
        ]}
        metrics={[
          { label: "Public", value: payload.posts.filter((post) => post.visibility === "public").length },
          { label: "Private", value: payload.posts.filter((post) => post.visibility === "private").length },
          { label: "Media", value: payload.posts.reduce((sum, post) => sum + post.mediaCount, 0) },
        ]}
      />

      {payload.posts.length === 0 ? (
        <DashboardEmptyState
          title="No visible posts."
          description="Author has not published here yet, or private posts hidden for current viewer."
          icon={GalleryHorizontal}
        />
      ) : (
        <div className="space-y-6">
          {payload.posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              onToggleLike={async (value) => { await toggleLike({ postId: value as never }); }}
              onToggleSave={async (value) => { await toggleSave({ postId: value as never }); }}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </DashboardPageShell>
  );
}
