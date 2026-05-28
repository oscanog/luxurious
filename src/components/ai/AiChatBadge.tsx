import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  model?: string;
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
      "Reading workspace context",
      "Checking enabled skills",
      "Drafting concise answer",
      "Polishing response",
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

function AssistantMessage({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const display = useTypewriter(message.content, isLatest);
  const isTyping = display.length < message.content.length;

  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))] text-white shadow-[0_12px_30px_-18px_hsl(var(--primary))]">
        <Bot size={16} />
      </div>
      <div className="min-w-0 flex-1 rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm leading-6 text-[hsl(var(--foreground))] shadow-sm">
        <p className="whitespace-pre-wrap">
          {display}
          {isTyping ? (
            <span className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[hsl(var(--primary))]" />
          ) : null}
        </p>
        {message.model ? (
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            {message.model}
          </p>
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
  const [error, setError] = useState<string | null>(null);
  const sendMessage = useAction(api.aiAgent.sendMessage);
  const settings = useQuery(api.aiSettings.getPublicSettings);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantId = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.id,
    [messages],
  );
  const composingText = useComposingText(isSending);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    setError(null);
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
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed.");
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
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mx-4 mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-300">
              {error}
            </div>
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
                disabled={isSending || settings?.isEnabled === false}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending || settings?.isEnabled === false}
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
