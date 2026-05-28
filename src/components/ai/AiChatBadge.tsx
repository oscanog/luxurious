import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  model?: string;
  activity?: AiActivity[];
};

type AiActivity = {
  kind: "search" | "tool";
  name: string;
  status: "success" | "warning" | "error";
  label: string;
  detail: string;
  count: number | null;
};

type ChatError = {
  title: string;
  message: string;
  detail: string | null;
};

function useTypewriter(text: string, active: boolean) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!active) {
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += Math.max(1, Math.ceil((text.length - index) / 42));
      setDisplay(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, [active, text]);

  return active ? display : text;
}

function useComposingText(active: boolean) {
  const phrases = useMemo(
    () => [
      "Preparing request",
      "Searching memory",
      "Running workspace tools",
      "Checking access scope",
      "Formatting answer",
    ],
    [],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % phrases.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [active, phrases.length]);

  return phrases[index];
}

function cleanErrorMessage(error: unknown): ChatError {
  const raw = error instanceof Error ? error.message : "AI request failed.";
  const clean = raw
    .replace(/^Uncaught Error:\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/not authenticated/i.test(clean)) {
    return {
      title: "Sign in required",
      message: "Session expired. Sign in again, then retry.",
      detail: clean,
    };
  }
  if (/daily ai message limit|monthly ai token limit/i.test(clean)) {
    return {
      title: "Limit reached",
      message: clean,
      detail: null,
    };
  }
  if (/missing deepseek api key|disabled by admin/i.test(clean)) {
    return {
      title: "AI unavailable",
      message: clean,
      detail: null,
    };
  }
  if (/deepseek request failed/i.test(clean)) {
    const status = clean.match(/\((\d{3})\)/)?.[1];
    return {
      title: status ? `Provider error ${status}` : "Provider error",
      message: "DeepSeek request failed. Check provider status, key, or model settings.",
      detail: clean,
    };
  }

  return {
    title: "Request failed",
    message: clean || "AI request failed.",
    detail: clean && clean !== "AI request failed." ? clean : null,
  };
}

function isMarkdownBoundary(line: string) {
  return (
    /^#{1,4}\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^>\s+/.test(line) ||
    /^```/.test(line) ||
    /\|/.test(line)
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;
    if (token.startsWith("`")) {
      parts.push(
        <code key={key} className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[0.88em] font-bold">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (link) {
        parts.push(
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[hsl(var(--primary))] underline underline-offset-4"
          >
            {link[1]}
          </a>,
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```\s*(\w+)?\s*$/);
    if (fence) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += index < lines.length ? 1 : 0;
      blocks.push(
        <pre key={`code-${index}`} className="overflow-x-auto rounded-2xl bg-[hsl(var(--foreground))] p-3 text-xs leading-5 text-[hsl(var(--background))]">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push(
        <h4 key={`heading-${index}`} className="text-sm font-black text-[hsl(var(--foreground))]">
          {renderInline(heading[2], `heading-${index}`)}
        </h4>,
      );
      index += 1;
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && /^[\s|:-]+$/.test(lines[index + 1])) {
      const tableLines: string[] = [line];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const rows = tableLines.map((row) =>
        row
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => cell.trim()),
      );
      const [head, ...body] = rows;
      blocks.push(
        <div key={`table-${index}`} className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))]">
          <table className="w-full min-w-72 border-collapse text-left text-xs">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
              <tr>
                {head.map((cell, cellIndex) => (
                  <th key={cellIndex} className="px-3 py-2 font-black">
                    {renderInline(cell, `th-${index}-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-[hsl(var(--border))]">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top">
                      {renderInline(cell, `td-${index}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ol-${index}-${itemIndex}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^>\s+/.test(line)) {
      const quote = line.replace(/^>\s+/, "");
      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-2 border-[hsl(var(--primary))] pl-3 text-[hsl(var(--muted-foreground))]">
          {renderInline(quote, `quote-${index}`)}
        </blockquote>,
      );
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isMarkdownBoundary(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {renderInline(paragraph.join(" "), `p-${index}`)}
      </p>,
    );
  }

  return <div className="space-y-3">{blocks}</div>;
}

function ActivityTrail({ activity, pending }: { activity?: AiActivity[]; pending?: boolean }) {
  const pendingItems: AiActivity[] = [
    {
      kind: "search",
      name: "memory",
      status: "success",
      label: "Memory search",
      detail: "Thread context",
      count: null,
    },
    {
      kind: "tool",
      name: "tools",
      status: "success",
      label: "Workspace tools",
      detail: "Access scoped",
      count: null,
    },
  ];
  const items = pending ? pendingItems : activity ?? [];
  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item, index) => {
        const Icon = item.status === "error" ? XCircle : item.kind === "search" ? Search : Wrench;
        const tone =
          item.status === "error"
            ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300"
            : item.status === "warning"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.55)] text-[hsl(var(--muted-foreground))]";
        return (
          <span
            key={`${item.name}-${index}`}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
              pending ? "animate-pulse" : "",
              tone,
            )}
            title={item.detail}
          >
            {item.status === "success" && !pending ? <CheckCircle2 size={12} /> : <Icon size={12} />}
            <span className="truncate">{item.label}</span>
            {typeof item.count === "number" ? <span>{item.count}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function AssistantMessage({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const display = useTypewriter(message.content, isLatest);
  const isTyping = display.length < message.content.length;

  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))] text-white shadow-[0_12px_30px_-18px_hsl(var(--primary))]">
        <Bot size={16} />
      </div>
      <div className="min-w-0 flex-1 rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm leading-6 text-[hsl(var(--foreground))] shadow-sm">
        <MarkdownMessage content={display} />
        {isTyping ? (
          <span className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[hsl(var(--primary))]" />
        ) : null}
        {!isTyping ? <ActivityTrail activity={message.activity} /> : null}
        {message.model ? (
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            {message.model}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
}: {
  error: ChatError;
  onRetry: (() => void) | null;
}) {
  return (
    <div className="mx-4 mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-black">{error.title}</p>
          <p className="mt-1 leading-5">{error.message}</p>
          {error.detail ? (
            <details className="mt-2">
              <summary className="cursor-pointer font-bold">Details</summary>
              <p className="mt-1 break-words font-mono text-[11px] leading-5 opacity-90">{error.detail}</p>
            </details>
          ) : null}
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-red-500/10 px-2 py-1 font-black uppercase tracking-[0.12em] hover:bg-red-500/20"
          >
            <RotateCcw size={12} />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[84%] rounded-[24px] bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold leading-6 text-white shadow-[0_16px_34px_-24px_hsl(var(--primary))]">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

export function AiChatBadge() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<Id<"aiChatThreads"> | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [failedInput, setFailedInput] = useState<string | null>(null);
  const sendMessage = useAction(api.aiAgent.sendMessage);
  const settings = useQuery(api.aiSettings.getPublicSettings);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantId = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.id,
    [messages],
  );
  const composingText = useComposingText(isSending);
  const aiUnavailable = settings?.isEnabled === false || settings?.hasApiKey === false;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    setError(null);
    setFailedInput(null);
    setIsSending(true);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages((current) => [...current, userMessage]);

    try {
      const result = await sendMessage({ threadId, message: content });
      setThreadId(result.threadId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.content,
          model: result.model,
          activity: result.activity,
        },
      ]);
    } catch (err) {
      setError(cleanErrorMessage(err));
      setFailedInput(content);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {open ? (
        <section className="mb-4 flex h-[min(680px,calc(100vh-7rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.92)] shadow-[0_34px_100px_-48px_hsl(220_70%_20%_/_0.65)] backdrop-blur-xl">
          <header className="border-b border-[hsl(var(--border))] bg-[linear-gradient(135deg,hsl(var(--primary)/0.16),hsl(var(--secondary)/0.14))] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-[hsl(var(--foreground))]">Luxurious AI</h2>
                    <p className="text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                      {settings?.defaultModel ?? "deepseek-v4-flash"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background)/0.72)] hover:text-[hsl(var(--foreground))]"
                aria-label="Close AI chat"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                  <MessageCircle size={24} />
                </div>
                <h3 className="mt-4 text-lg font-black text-[hsl(var(--foreground))]">
                  Ask anything about your workspace.
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  Network, finance, academy, support, or admin workflows. Replies reveal like a typing assistant.
                </p>
              </div>
            ) : (
              messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    isLatest={message.id === latestAssistantId}
                  />
                ),
              )
            )}

            {isSending ? (
              <div className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))] text-white">
                  <Bot size={16} />
                </div>
                <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  <span>{composingText}</span>
                  <span className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[hsl(var(--primary))]" />
                  <ActivityTrail pending />
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <ErrorPanel
              error={error}
              onRetry={
                failedInput
                  ? () => {
                      setInput(failedInput);
                      setError(null);
                    }
                  : null
              }
            />
          ) : null}

          <form onSubmit={(event) => void handleSubmit(event)} className="border-t border-[hsl(var(--border))] p-3">
            <div className="flex items-end gap-2 rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.72)] p-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder={settings?.hasApiKey ? "Message Luxurious AI..." : "Admin must add DeepSeek key first."}
                disabled={isSending || aiUnavailable}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending || aiUnavailable}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white transition",
                  input.trim() && !isSending
                    ? "bg-[hsl(var(--primary))] shadow-[0_12px_28px_-16px_hsl(var(--primary))]"
                    : "bg-[hsl(var(--muted-foreground)/0.35)]",
                )}
                aria-label="Send AI message"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))] text-white shadow-[0_24px_60px_-28px_hsl(var(--primary))] transition hover:-translate-y-0.5"
        aria-label="Open AI chat"
      >
        <span className="absolute inset-0 rounded-[26px] bg-white/20 opacity-0 blur-xl transition group-hover:opacity-100" />
        <MessageCircle size={25} className="relative" />
      </button>
    </div>
  );
}
