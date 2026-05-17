import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { SocialCommentPreview, SocialPost } from "@/components/social/types";
import {
  DashboardEmptyState,
  DashboardPageShell,
  DashboardSectionTitle,
  DashboardTextAreaField,
} from "@/components/dashboard/FinancePageHelpers";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

type SocialPostDetail = SocialPost & {
  comments: SocialCommentPreview[];
};

export function SocialPostDetailPage() {
  const { postId } = useParams();
  const post = useQuery(
    api.socialFeed.getPostDetail,
    postId ? { postId: postId as never, commentLimit: 50 } : "skip",
  ) as SocialPostDetail | null | undefined;
  const toggleLike = useMutation(api.socialFeed.toggleLike);
  const toggleSave = useMutation(api.socialFeed.toggleSave);
  const createComment = useMutation(api.socialFeed.createComment);
  const deleteComment = useMutation(api.socialFeed.deleteComment);
  const [commentBody, setCommentBody] = useState("");

  async function handleShare(sharePath: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
      toast.success("Post link copied.");
    } catch {
      toast.error("Copy failed.");
    }
  }

  async function handleCreateComment() {
    if (!postId || !commentBody.trim()) {
      return;
    }
    try {
      await createComment({
        postId: postId as never,
        body: commentBody,
      });
      setCommentBody("");
      toast.success("Comment added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comment failed.");
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteComment({ commentId: commentId as never });
      toast.success("Comment removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  if (post === undefined) {
    return (
      <DashboardPageShell>
        <Skeleton className="h-[540px] rounded-[32px]" />
      </DashboardPageShell>
    );
  }

  if (post === null) {
    return (
      <DashboardPageShell>
        <DashboardEmptyState
          title="Post missing."
          description="Link old, deleted, or not visible for current viewer."
          icon={MessageSquare}
        />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <SocialPostCard
        post={post}
        showComments={false}
        showFullCaption
        onToggleLike={(value) => toggleLike({ postId: value as never })}
        onToggleSave={(value) => toggleSave({ postId: value as never })}
        onShare={handleShare}
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SurfaceCard className="p-6">
          <DashboardSectionTitle
            eyebrow="Reply"
            title="Comment on post"
            description="Flat thread. Edit not live. Delete own comment or moderate if you own post."
          />
          <div className="mt-5">
            <DashboardTextAreaField
              label="Comment"
              value={commentBody}
              onChange={setCommentBody}
              rows={4}
              placeholder="Add comment"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleCreateComment()}
            className="mt-5 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-black text-white"
          >
            Post Comment
          </button>
        </SurfaceCard>

        <div className="space-y-4">
          <DashboardSectionTitle
            eyebrow="Thread"
            title={`${post.comments.length} comments`}
            description="Oldest first."
          />
          {post.comments.length === 0 ? (
            <DashboardEmptyState
              title="No comments yet."
              description="First reply starts thread."
              icon={MessageSquare}
            />
          ) : (
            post.comments.map((comment) => (
              <SurfaceCard key={comment.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                      {comment.author.displayName} • {comment.relativeTime}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[hsl(var(--foreground))]">
                      {comment.body}
                    </p>
                  </div>
                  {comment.canDelete ? (
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(comment.id)}
                      className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-500"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </SurfaceCard>
            ))
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}
