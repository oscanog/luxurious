import { Bookmark, Globe, Heart, Lock, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { cn } from "@/lib/utils";
import { SocialPost } from "./types";

function renderCaption(
  caption: string,
  onHashtagClick?: (hashtag: string) => void,
) {
  if (!caption.trim()) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">No caption.</p>;
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-6 text-[hsl(var(--foreground))]">
      {caption.split(/(\s+)/).map((token, index) => {
        const match = token.match(/^#([a-z0-9]+)$/i);
        if (!match) {
          return <span key={`${token}-${index}`}>{token}</span>;
        }
        const hashtag = match[1]?.toLowerCase() ?? "";
        return (
          <button
            key={`${token}-${index}`}
            type="button"
            onClick={() => onHashtagClick?.(hashtag)}
            className="font-bold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--secondary))]"
          >
            {token}
          </button>
        );
      })}
    </p>
  );
}

export function SocialPostCard({
  post,
  showComments = true,
  showFullCaption = false,
  onToggleLike,
  onToggleSave,
  onShare,
  onHashtagClick,
}: {
  post: SocialPost;
  showComments?: boolean;
  showFullCaption?: boolean;
  onToggleLike?: (postId: string) => void | Promise<void>;
  onToggleSave?: (postId: string) => void | Promise<void>;
  onShare?: (sharePath: string) => void | Promise<void>;
  onHashtagClick?: (hashtag: string) => void;
}) {
  const caption =
    showFullCaption || post.caption.length <= 180
      ? post.caption
      : `${post.caption.slice(0, 180).trimEnd()}...`;

  return (
    <SurfaceCard className="overflow-hidden border border-[hsl(var(--border)/0.55)]">
      <div className="border-b border-[hsl(var(--border)/0.5)] p-5">
        <div className="flex items-start gap-4">
          <Link
            to={`/social-feed/user/${post.author.userId}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(221_83%_53%),hsl(43_96%_48%))] text-sm font-black text-white"
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.displayName}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              post.author.initials
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/social-feed/user/${post.author.userId}`}
                className="truncate text-base font-black text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                {post.author.displayName}
              </Link>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                  post.visibility === "public"
                    ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                    : "bg-[hsl(var(--secondary)/0.16)] text-[hsl(var(--secondary-foreground))] dark:text-[hsl(var(--secondary))]",
                )}
              >
                {post.visibility === "public" ? <Globe size={11} /> : <Lock size={11} />}
                {post.visibility}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              {post.relativeTime}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex snap-x snap-mandatory">
          {post.media.map((item) => (
            <div
              key={item.assetId}
              className="min-w-full snap-center bg-[hsl(var(--accent))]"
            >
              {item.kind === "image" && item.url ? (
                <img
                  src={item.url}
                  alt={item.altText ?? post.author.displayName}
                  className="h-[320px] w-full object-cover sm:h-[420px]"
                />
              ) : item.kind === "video" && item.url ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={item.posterUrl ?? undefined}
                  className="h-[320px] w-full bg-black object-cover sm:h-[420px]"
                >
                  <source src={item.url} type={item.mimeType} />
                </video>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm font-semibold text-[hsl(var(--muted-foreground))] sm:h-[420px]">
                  Media unavailable
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => void onToggleLike?.(post.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              post.viewerState.liked
                ? "bg-red-500/12 text-red-500"
                : "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
            )}
          >
            <Heart size={16} className={post.viewerState.liked ? "fill-current" : ""} />
            {post.likeCount}
          </button>
          <Link
            to={`/social-feed/post/${post.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent))] px-4 py-2 text-sm font-bold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            <MessageCircle size={16} />
            {post.commentCount}
          </Link>
          <button
            type="button"
            onClick={() => void onToggleSave?.(post.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              post.viewerState.saved
                ? "bg-[hsl(var(--secondary)/0.18)] text-[hsl(var(--secondary-foreground))] dark:text-[hsl(var(--secondary))]"
                : "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
            )}
          >
            <Bookmark size={16} className={post.viewerState.saved ? "fill-current" : ""} />
            {post.saveCount}
          </button>
          <button
            type="button"
            onClick={() => void onShare?.(post.sharePath)}
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent))] px-4 py-2 text-sm font-bold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>

        {renderCaption(caption, onHashtagClick)}

        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onHashtagClick?.(tag)}
                className="rounded-full bg-[hsl(var(--primary)/0.1)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--secondary)/0.18)] hover:text-[hsl(var(--secondary-foreground))] dark:hover:text-[hsl(var(--secondary))]"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {showComments && post.commentPreview.length > 0 && (
          <div className="space-y-2 border-t border-[hsl(var(--border)/0.5)] pt-4">
            {post.commentPreview.map((comment) => (
              <div key={comment.id} className="rounded-2xl bg-[hsl(var(--accent)/0.72)] px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                  {comment.author.displayName} • {comment.relativeTime}
                </p>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--foreground))]">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
