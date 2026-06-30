import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Sparkle, Send, Trash2, Copy, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { readJSON, writeJSON, KEYS, logHistory } from "@/lib/storage";
import { copy } from "@/lib/exports";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Workplace AI" },
      { name: "description", content: "Chat with your AI workplace assistant for writing, planning and analysis." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Write a business proposal for a new SaaS product",
  "Improve this email: …",
  "Create a meeting agenda for a quarterly review",
  "Explain SWOT analysis with an example",
  "Summarize this report in 5 bullets",
  "Brainstorm 10 ideas for an internal hackathon",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

function ChatPage() {
  const initial = readJSON<UIMessage[]>(KEYS.chat, []);
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: "workplace-chat",
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message),
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { writeJSON(KEYS.chat, messages); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { taRef.current?.focus(); }, []);

  const send = async (text?: string) => {
    const val = (text ?? input).trim();
    if (!val) return;
    await sendMessage({ text: val });
    setInput("");
    logHistory({ tool: "Chat", action: val.slice(0, 80) });
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const clear = () => {
    setMessages([]);
    writeJSON(KEYS.chat, []);
    toast.success("Conversation cleared");
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="px-4 pt-4 md:px-6">
        <PageHeader
          title="AI Chat"
          description="Your always-on assistant for writing, planning and analysis."
          icon={<Sparkle className="h-5 w-5" />}
          actions={
            <Button variant="outline" size="sm" onClick={clear} disabled={messages.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" />Clear
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="space-y-4 py-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary shadow-glow">
                <Sparkle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl">How can I help today?</h2>
                <p className="text-sm text-muted-foreground">Try one of these prompts, or ask anything.</p>
              </div>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border bg-card p-3 text-left text-sm hover:bg-accent/10 hover:shadow-elegant transition-shadow"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                {!isUser && (
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary text-white">
                    <Sparkle className="h-4 w-4" />
                  </div>
                )}
                <div className={cn("max-w-[80%]", isUser && "order-1")}>
                  {isUser ? (
                    <Card className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5">
                      <div className="whitespace-pre-wrap text-sm">{text}</div>
                    </Card>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || " "}</ReactMarkdown>
                      <div className="mt-1 flex gap-1 not-prose">
                        <Button size="sm" variant="ghost" className="h-7" onClick={async () => { await copy(text); toast.success("Copied"); }}>
                          <Copy className="mr-1 h-3 w-3" />Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-white">
                <Sparkle className="h-4 w-4 animate-pulse" />
              </div>
              <span className="animate-pulse">Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-background/80 px-4 py-3 backdrop-blur-xl md:px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything…"
            className="min-h-[52px] max-h-40 resize-none"
          />
          {busy ? (
            <Button type="button" variant="outline" size="icon" onClick={stop} aria-label="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" className="gradient-primary border-0 text-white" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
