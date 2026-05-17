export type SocialAuthor = {
  userId: string;
  profileId: string | null;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
};

export type SocialMediaItem = {
  assetId: string;
  kind: "image" | "video";
  mimeType: string;
  url: string | null;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  processingStatus: "uploading" | "queued" | "processing" | "ready" | "failed";
  fileName: string | null;
  altText: string | null;
  sortOrder: number;
};

export type SocialCommentPreview = {
  id: string;
  body: string;
  status: "visible" | "deleted" | "removed";
  createdAt: number;
  relativeTime: string;
  author: SocialAuthor;
  canDelete: boolean;
};

export type SocialPost = {
  id: string;
  caption: string;
  hashtags: string[];
  visibility: "public" | "private";
  lifecycle: "draft" | "publishing" | "published" | "archived" | "deleted";
  moderationStatus: "clear" | "flagged" | "removed";
  mediaCount: number;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  publishedAt: number | null;
  updatedAt: number;
  relativeTime: string;
  sharePath: string;
  author: SocialAuthor;
  media: SocialMediaItem[];
  viewerState: {
    liked: boolean;
    saved: boolean;
    isOwner: boolean;
    isAdmin: boolean;
  };
  commentPreview: SocialCommentPreview[];
};
