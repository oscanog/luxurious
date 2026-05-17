import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Globe2,
  Hash,
  ImagePlus,
  LoaderCircle,
  Lock,
  Send,
  Text,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { SocialMediaItem } from "@/components/social/types";
import {
  DashboardPageShell,
  DashboardTextAreaField,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type DraftRecord = {
  id: string;
  caption: string;
  hashtags: string[];
  visibility: "public" | "private";
  lifecycle: "draft";
  mediaCount: number;
  updatedAt: number;
  lastEditedAt: number;
  media: SocialMediaItem[];
  readyMediaCount: number;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type ComposerStep = "media" | "caption" | "privacy" | "publish";

const STEP_ORDER: ComposerStep[] = ["media", "caption", "privacy", "publish"];

function localHashtags(caption: string) {
  return Array.from(
    new Set(
      Array.from(caption.matchAll(/(^|\s)#([a-z0-9]+)/gi))
        .map((match) => match[2]?.toLowerCase())
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 20);
}

export function SocialComposerPage() {
  const navigate = useNavigate();
  const draft = useQuery(api.socialFeed.getMyActiveDraft) as DraftRecord | null | undefined;
  const createDraft = useMutation(api.socialFeed.createDraft);
  const updateDraft = useMutation(api.socialFeed.updateDraft);
  const discardDraft = useMutation(api.socialFeed.discardDraft);
  const generateMediaUploadUrl = useMutation(api.socialFeed.generateMediaUploadUrl);
  const attachDraftMedia = useMutation(api.socialFeed.attachDraftMedia);
  const removeDraftMedia = useMutation(api.socialFeed.removeDraftMedia);
  const publishDraft = useMutation(api.socialFeed.publishDraft);

  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<ComposerStep>("media");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestedDraftRef = useRef(false);
  const syncedRef = useRef<{
    draftId: string | null;
    caption: string;
    visibility: "public" | "private";
  }>({
    draftId: null,
    caption: "",
    visibility: "public",
  });

  useEffect(() => {
    if (draft === null && !requestedDraftRef.current) {
      requestedDraftRef.current = true;
      void createDraft({}).catch((error) => {
        requestedDraftRef.current = false;
        toast.error(error instanceof Error ? error.message : "Draft create failed.");
      });
    }
  }, [createDraft, draft]);

  useEffect(() => {
    if (!draft) {
      return;
    }
    const synced = syncedRef.current;
    const shouldHydrate =
      synced.draftId !== draft.id ||
      (saveState !== "saving" &&
        (synced.caption !== draft.caption || synced.visibility !== draft.visibility));
    if (!shouldHydrate) {
      return;
    }
    setCaption(draft.caption);
    setVisibility(draft.visibility);
    syncedRef.current = {
      draftId: draft.id,
      caption: draft.caption,
      visibility: draft.visibility,
    };
  }, [draft, saveState]);

  useEffect(() => {
    if (!draft) {
      return;
    }
    const synced = syncedRef.current;
    if (
      synced.draftId === draft.id &&
      synced.caption === caption &&
      synced.visibility === visibility
    ) {
      return;
    }
    setSaveState("saving");
    const timeoutId = window.setTimeout(() => {
      void updateDraft({
        postId: draft.id as never,
        caption,
        visibility,
      })
        .then(() => {
          syncedRef.current = {
            draftId: draft.id,
            caption,
            visibility,
          };
          setSaveState("saved");
        })
        .catch((error) => {
          setSaveState("error");
          toast.error(error instanceof Error ? error.message : "Autosave failed.");
        });
    }, 800);
    return () => window.clearTimeout(timeoutId);
  }, [caption, draft, updateDraft, visibility]);

  async function ensureDraftId() {
    if (draft?.id) {
      return draft.id;
    }
    return await createDraft({});
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    setUploading(true);
    try {
      const postId = await ensureDraftId();
      for (const file of Array.from(files)) {
        const kind = file.type.startsWith("video/") ? "video" : "image";
        const postUrl = await generateMediaUploadUrl({});
        const response = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}.`);
        }
        const { storageId } = (await response.json()) as { storageId?: string };
        if (!storageId) {
          throw new Error("Storage id missing after upload.");
        }
        await attachDraftMedia({
          postId: postId as never,
          storageId: storageId as never,
          kind,
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
        });
      }
      toast.success("Media attached to draft.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveMedia(assetId: string) {
    if (!draft) {
      return;
    }
    try {
      await removeDraftMedia({
        postId: draft.id as never,
        assetId: assetId as never,
      });
      toast.success("Media removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed.");
    }
  }

  async function handleDiscard() {
    if (!draft) {
      void navigate("/social-feed");
      return;
    }
    if (!window.confirm("Discard current draft?")) {
      return;
    }
    try {
      await discardDraft({ postId: draft.id as never });
      toast.success("Draft discarded.");
      void navigate("/social-feed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Discard failed.");
    }
  }

  async function handlePublish() {
    if (!draft) {
      return;
    }
    try {
      const result = await publishDraft({ postId: draft.id as never });
      toast.success("Post published.");
      void navigate(`/social-feed/post/${result.postId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed.");
    }
  }

  if (draft === undefined) {
    return (
      <DashboardPageShell>
        <Skeleton className="h-48 rounded-[32px]" />
        <Skeleton className="h-96 rounded-[32px]" />
      </DashboardPageShell>
    );
  }

  const hashtags = localHashtags(caption);
  const stepIndex = STEP_ORDER.indexOf(step);
  const stepProgress = ((stepIndex + 1) / STEP_ORDER.length) * 100;
  const stepValidity: Record<ComposerStep, boolean> = {
    media: (draft?.media.length ?? 0) > 0,
    caption: caption.trim().length > 0,
    privacy: visibility === "public" || visibility === "private",
    publish:
      Boolean(draft) &&
      (draft?.media.length ?? 0) > 0 &&
      (draft?.readyMediaCount ?? 0) === (draft?.media.length ?? 0) &&
      saveState !== "saving" &&
      !uploading,
  };
  const canGoNext = step !== "publish" && stepValidity[step];
  const canGoPrevious = stepIndex > 0;
  const publishDisabled = !stepValidity.publish;

  function moveNext() {
    if (!canGoNext) {
      return;
    }
    setStep(STEP_ORDER[stepIndex + 1] ?? "publish");
  }

  function movePrevious() {
    if (!canGoPrevious) {
      return;
    }
    setStep(STEP_ORDER[stepIndex - 1] ?? "media");
  }

  const stepCards = [
    { key: "media", label: "Media", icon: ImagePlus },
    { key: "caption", label: "Caption", icon: Text },
    { key: "privacy", label: "Privacy", icon: Globe2 },
    { key: "publish", label: "Publish", icon: Send },
  ] as const;

  return (
    <DashboardPageShell>
      <div className="mx-auto max-w-[1120px] space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/social-feed"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
              aria-label="Back to social feed"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                New Post
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
                Draft open
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Step {stepIndex + 1} of {STEP_ORDER.length} • {Math.round(stepProgress)}%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleDiscard()}
            className="hidden rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-500 transition-colors hover:bg-red-500/16 md:inline-flex"
          >
            Discard
          </button>
        </div>

        <SurfaceCard className="overflow-hidden p-6">
          <div className="rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.4)] p-4">
            <div className="grid grid-cols-4 gap-3">
              {stepCards.map((item, index) => {
                const Icon = item.icon;
                const isActive = step === item.key;
                const isDone = index < stepIndex;
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "flex items-center gap-3 rounded-full border px-3 py-3 transition-colors",
                      isActive
                        ? "border-[hsl(var(--secondary)/0.38)] bg-[hsl(var(--secondary)/0.16)]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        isDone
                          ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
                          : isActive
                            ? "bg-[hsl(var(--primary))] text-white"
                            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
                      )}
                    >
                      {isDone ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-black uppercase tracking-[0.16em]",
                        isActive || isDone
                          ? "text-[hsl(var(--foreground))]"
                          : "text-[hsl(var(--muted-foreground))]",
                      )}
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 h-3 rounded-full bg-[hsl(var(--muted))]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(43_96%_48%),hsl(221_83%_53%))] transition-all"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </SurfaceCard>

        {step === "media" && (
          <SurfaceCard className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-[hsl(var(--foreground))]">
                  Media
                </h2>
                <p className="mt-3 text-lg text-[hsl(var(--muted-foreground))]">
                  Add photos or videos first.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-4 text-base font-black text-white"
              >
                {uploading ? <LoaderCircle size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                Add Media
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleUpload(event.target.files);
                }}
              />
            </div>

            {draft?.media.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {draft.media.map((item) => (
                  <div
                    key={item.assetId}
                    className="overflow-hidden rounded-[28px] border border-[hsl(var(--border)/0.6)] bg-[hsl(var(--accent)/0.6)]"
                  >
                    <div className="relative">
                      {item.kind === "image" && item.url ? (
                        <img
                          src={item.url}
                          alt={item.fileName ?? "Draft media"}
                          className="h-64 w-full object-cover"
                        />
                      ) : item.kind === "video" && item.url ? (
                        <video controls preload="metadata" className="h-64 w-full bg-black object-cover">
                          <source src={item.url} type={item.mimeType} />
                        </video>
                      ) : (
                        <div className="flex h-64 items-center justify-center text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                          Processing preview
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemoveMedia(item.assetId)}
                        className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                          {item.fileName ?? item.kind}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                          {item.kind}
                        </p>
                      </div>
                      <ToneBadge tone={item.processingStatus === "ready" ? "success" : "warning"}>
                        {item.processingStatus}
                      </ToneBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-8 flex w-full flex-col items-center justify-center rounded-[36px] border-2 border-dashed border-[hsl(var(--primary)/0.24)] bg-[hsl(var(--primary)/0.04)] px-8 py-24 text-center transition-colors hover:border-[hsl(var(--primary)/0.44)]"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]">
                  <UploadCloud size={34} />
                </div>
                <h3 className="mt-6 text-3xl font-black text-[hsl(var(--foreground))]">
                  Add photo or video
                </h3>
                <p className="mt-4 max-w-xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">
                  JPEG, PNG, WebP, MP4, MOV.
                </p>
              </button>
            )}
          </SurfaceCard>
        )}

        {step === "caption" && (
          <SurfaceCard className="p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-4xl font-black tracking-tight text-[hsl(var(--foreground))]">
                Caption
              </h2>
              <span className="text-lg font-black text-[hsl(var(--muted-foreground))]">
                {caption.length}/2200
              </span>
            </div>
            <div className="mt-8">
              <DashboardTextAreaField
                label="Post copy"
                value={caption}
                onChange={setCaption}
                rows={12}
                placeholder="Write what happened. Add #hashtags for feed filters."
              />
            </div>
            <div className="mt-8">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-[hsl(var(--muted-foreground))]" />
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Tags
                </p>
              </div>
              {hashtags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <ToneBadge key={tag} tone="primary">
                      #{tag}
                    </ToneBadge>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex h-16 items-center justify-center rounded-[22px] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.45)] text-[hsl(var(--muted-foreground))]">
                  <Hash size={18} />
                </div>
              )}
            </div>
          </SurfaceCard>
        )}

        {step === "privacy" && (
          <SurfaceCard className="p-8">
            <h2 className="text-4xl font-black tracking-tight text-[hsl(var(--foreground))]">
              Privacy
            </h2>
            <p className="mt-3 text-lg text-[hsl(var(--muted-foreground))]">
              Pick who can see this post.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {(
                [
                  {
                    value: "public",
                    label: "Public",
                    icon: Globe2,
                    tone: "bg-[hsl(var(--primary))] text-white",
                  },
                  {
                    value: "private",
                    label: "Private",
                    icon: Lock,
                    tone: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
                  },
                ] as const
              ).map(({ value, label, icon: Icon, tone }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={cn(
                    "rounded-[28px] border p-6 text-left transition-colors",
                    visibility === value
                      ? value === "public"
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                        : "border-[hsl(var(--secondary))] bg-[hsl(var(--secondary)/0.14)]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-16 w-16 items-center justify-center rounded-[24px]", tone)}>
                      <Icon size={26} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[hsl(var(--foreground))]">{label}</p>
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                        {value === "public"
                          ? "Visible to logged-in members."
                          : "Visible only to you and admins."}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SurfaceCard>
        )}

        {step === "publish" && (
          <SurfaceCard className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[hsl(var(--secondary)/0.16)] text-[hsl(var(--secondary-foreground))] dark:text-[hsl(var(--secondary))]">
                <Send size={24} />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight text-[hsl(var(--foreground))]">
                  Publish
                </h2>
                <p className="mt-3 text-lg text-[hsl(var(--muted-foreground))]">
                  Final review before post goes live.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <SummaryTile label="Media" value={`${draft?.media.length ?? 0}`} />
              <SummaryTile
                label="Ready"
                value={draft ? `${draft.readyMediaCount}/${draft.media.length}` : "0/0"}
              />
              <SummaryTile label="Visibility" value={visibility} />
            </div>

            <div className="mt-8 rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.45)] p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Caption
              </p>
              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[hsl(var(--foreground))]">
                {caption.trim() || "No caption yet."}
              </p>
            </div>

            <div className="mt-8 rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[hsl(var(--foreground))]">Publish gates</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                    Need at least one media item. All assets must be ready. Save must finish first.
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>
        )}

        <SurfaceCard className="sticky bottom-4 p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={movePrevious}
              disabled={!canGoPrevious}
              className={cn(
                "h-14 min-w-[148px] rounded-[22px] border text-base font-black transition-colors",
                canGoPrevious
                  ? "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.45)] text-[hsl(var(--muted-foreground))] opacity-60",
              )}
            >
              Previous
            </button>

            {step === "publish" ? (
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={publishDisabled}
                className={cn(
                  "flex-1 rounded-[22px] px-6 py-4 text-base font-black transition-opacity",
                  publishDisabled
                    ? "bg-[hsl(var(--primary)/0.45)] text-white opacity-70"
                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
                )}
              >
                Publish Post
              </button>
            ) : (
              <button
                type="button"
                onClick={moveNext}
                disabled={!canGoNext}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-base font-black transition-opacity",
                  canGoNext
                    ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
                    : "bg-[hsl(var(--secondary)/0.4)] text-[hsl(var(--secondary-foreground))] opacity-70",
                )}
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </SurfaceCard>
      </div>
    </DashboardPageShell>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black capitalize text-[hsl(var(--foreground))]">{value}</p>
    </div>
  );
}
