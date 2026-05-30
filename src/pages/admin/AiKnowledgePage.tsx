import { FormEvent, useMemo, useState } from "react";
import { extractTextFromPdf } from "@/lib/pdfTextExtractor";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  BookOpenCheck,
  FileText,
  LoaderCircle,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
} from "@/components/dashboard/FinancePageHelpers";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type KnowledgeDocument = {
  _id: Id<"aiKnowledgeDocuments">;
  title: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "ready" | "failed";
  chunkCount: number;
  extractedCharCount: number;
  error?: string;
  createdAt: number;
  fileUrl: string | null;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function AiKnowledgePage() {
  const documents = useQuery(api.aiKnowledge.listDocuments) as
    | KnowledgeDocument[]
    | undefined;
  const generateUploadUrl = useMutation(api.aiKnowledge.generateUploadUrl);
  const ingestUploadedPdf = useAction(api.aiKnowledgeActions.ingestUploadedPdf);
  const deleteDocument = useMutation(api.aiKnowledge.deleteDocument);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<"pdf" | "text">("pdf");
  const [textContent, setTextContent] = useState("");
  const [query, setQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Id<"aiKnowledgeDocuments"> | null>(null);

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!documents || !needle) return documents ?? [];
    return documents.filter(
      (document) =>
        document.title.toLowerCase().includes(needle) ||
        document.fileName.toLowerCase().includes(needle),
    );
  }, [documents, query]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    let uploadFile = file;
    let extractedText = "";

    if (inputType === "pdf") {
      if (!uploadFile) {
        toast.error("Choose a PDF first");
        return;
      }
      if (!uploadFile.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are supported");
        return;
      }
      setIsUploading(true);
      toast.loading("Reading PDF text...", { id: "ai-knowledge-upload" });
      try {
        extractedText = await extractTextFromPdf(uploadFile);
      } catch (e) {
        toast.error("Failed to read PDF.");
        setIsUploading(false);
        return;
      }
    } else {
      if (!textContent.trim()) {
        toast.error("Enter some text first");
        return;
      }
      setIsUploading(true);
      extractedText = textContent;
      // Mock a text file for storage
      uploadFile = new File([textContent], `${title || "Knowledge"}.txt`, { type: "text/plain" });
    }

    try {
      if (extractedText.length < 10) {
        throw new Error(
          "Could not extract enough text from this PDF. Use text-based PDFs, not scanned images.",
        );
      }

      toast.loading(`Uploading PDF (${extractedText.length.toLocaleString()} chars)...`, { id: "ai-knowledge-upload" });

      // Step 2: Upload the file to Convex storage
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": uploadFile.type || "application/pdf" },
        body: uploadFile,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const { storageId } = (await response.json()) as { storageId?: string };
      if (!storageId) {
        throw new Error("Storage id missing");
      }

      toast.loading("Chunking & embedding...", { id: "ai-knowledge-upload" });

      // Step 3: Send extracted text + file reference to backend
      const result = await ingestUploadedPdf({
        title: title.trim() || uploadFile.name.replace(/\.(pdf|txt)$/i, ""),
        fileName: uploadFile.name,
        mimeType: uploadFile.type || "application/pdf",
        fileSize: uploadFile.size,
        storageId: storageId as Id<"_storage">,
        extractedText,
      });

      toast.success(`Knowledge added: ${result.chunkCount} chunks`, {
        id: "ai-knowledge-upload",
      });
      setTitle("");
      setFile(null);
      setTextContent("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "PDF ingestion failed",
        {
          id: "ai-knowledge-upload",
        },
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(documentId: Id<"aiKnowledgeDocuments">) {
    try {
      await deleteDocument({ documentId });
      toast.success("Knowledge source removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDocumentToDelete(null);
    }
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="AI Knowledge"
        title="PDF Knowledge Eater"
        description="Upload text-based PDF documents so Luxurious AI can search them as additional knowledge. Remove stale sources any time."
        icon={BookOpenCheck}
        badges={[
          { label: `${documents?.length ?? 0} sources`, tone: "primary" },
          { label: "Admin managed", tone: "success" },
        ]}
        metrics={[
          {
            label: "Ready",
            value:
              documents?.filter((doc) => doc.status === "ready").length ?? 0,
            tone: "success",
          },
          {
            label: "Chunks",
            value:
              documents?.reduce((sum, doc) => sum + doc.chunkCount, 0) ?? 0,
            tone: "primary",
          },
          {
            label: "Failed",
            value:
              documents?.filter((doc) => doc.status === "failed").length ?? 0,
            tone: "warning",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="p-5 sm:p-6">
          <DashboardSectionTitle
            eyebrow="Upload"
            title="Add Knowledge"
            description="Upload PDFs or write direct text templates."
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setInputType("pdf")}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
                inputType === "pdf"
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]"
              )}
            >
              PDF Document
            </button>
            <button
              type="button"
              onClick={() => setInputType("text")}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
                inputType === "text"
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]"
              )}
            >
              Raw Text / Template
            </button>
          </div>
          <form
            onSubmit={(event) => void handleUpload(event)}
            className="mt-5 space-y-4"
          >
            <label className="space-y-2 block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Display title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Trading onboarding guide"
                className="h-12 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
              />
            </label>

            {inputType === "pdf" ? (
              <label
                htmlFor="pdf-upload"
                className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.18)] px-5 py-8 text-center transition-colors hover:border-[hsl(var(--primary)/0.55)]"
              >
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <UploadCloud
                  size={32}
                  className="mb-3 text-[hsl(var(--primary))]"
                />
                <span className="text-sm font-black text-[hsl(var(--foreground))]">
                  {file ? file.name : "Drop PDF here or click to browse"}
                </span>
                <span className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {file
                    ? formatFileSize(file.size)
                    : "Text PDFs only for v1 ingestion"}
                </span>
              </label>
            ) : (
              <label className="block space-y-2">
                <span className="sr-only">Raw Text Content</span>
                <textarea
                  value={textContent}
                  onChange={(event) => setTextContent(event.target.value)}
                  placeholder="Type your knowledge rules, reminders, or templates here..."
                  className="h-[180px] w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={isUploading || (inputType === "pdf" ? !file : !textContent.trim())}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-5 text-sm font-black text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <UploadCloud size={18} />
              )}
              {isUploading ? "Eating PDF" : "Upload and ingest"}
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[hsl(var(--border))] p-5 sm:p-6">
            <DashboardSectionTitle
              eyebrow="Sources"
              title="Knowledge library"
              description="Ready sources are embedded into semantic AI search."
            />
            <div className="relative mt-4">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
                size={18}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or file name"
                className="h-11 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
              />
            </div>
          </div>

          <div className="divide-y divide-[hsl(var(--border))]">
            {documents === undefined ? (
              <p className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
                Loading knowledge sources...
              </p>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <FileText
                  size={36}
                  className="text-[hsl(var(--muted-foreground)/0.45)]"
                />
                <p className="text-sm font-bold text-[hsl(var(--muted-foreground))]">
                  No PDF knowledge sources yet.
                </p>
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <div
                  key={document._id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[hsl(var(--foreground))]">
                          {document.title}
                        </p>
                        <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                          {document.fileName}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1",
                          document.status === "ready"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : document.status === "failed"
                              ? "bg-red-500/10 text-red-600 dark:text-red-300"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-300",
                        )}
                      >
                        {document.status}
                      </span>
                      <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-[hsl(var(--muted-foreground))]">
                        {document.chunkCount} chunks
                      </span>
                      <span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-[hsl(var(--muted-foreground))]">
                        {formatFileSize(document.fileSize)}
                      </span>
                    </div>
                    {document.error && (
                      <p className="mt-2 text-xs font-semibold text-red-500">
                        {document.error}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {document.fileUrl && (
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-bold transition-colors hover:bg-[hsl(var(--muted))]"
                      >
                        Open
                      </a>
                    )}
                    <button
                      onClick={() => setDocumentToDelete(document._id)}
                      className="rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-red-500 transition-colors hover:bg-red-500/10"
                      title="Remove knowledge source"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>

      <ConfirmDialog
        isOpen={documentToDelete !== null}
        title="Remove Knowledge Source"
        description="Are you sure you want to remove this PDF knowledge source? The AI will no longer be able to answer questions using this document's contents."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => void handleDelete(documentToDelete!)}
        onCancel={() => setDocumentToDelete(null)}
      />
    </DashboardPageShell>
  );
}
