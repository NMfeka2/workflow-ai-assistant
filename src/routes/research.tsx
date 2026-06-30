import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles, Copy, FileText, Save, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runResearch } from "@/lib/ai.functions";
import {
  KEYS, logHistory, readJSON, uid, writeJSON, type ResearchItem,
} from "@/lib/storage";
import { copy, downloadPDF } from "@/lib/exports";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      { name: "description", content: "Get structured research briefings with sources, takeaways and recommendations." },
    ],
  }),
  component: ResearchPage,
});

const PROMPT_EXAMPLES = [
  "Latest AI trends in customer service",
  "Best practices for remote onboarding",
  "Competitor analysis: top 5 CRM tools",
  "Risks of adopting LLMs in healthcare",
];

type R = Omit<ResearchItem, "id" | "createdAt" | "query" | "favorite">;

function ResearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const res = useServerFn(runResearch);

  const go = async (q?: string) => {
    const useQ = q ?? query;
    if (!useQ.trim()) { toast.error("Enter a research topic."); return; }
    if (q) setQuery(q);
    setLoading(true);
    try {
      const r = await res({ data: { query: useQ } });
      const clean: R = {
        ...r,
        sources: r.sources.map((s) => ({ title: s.title, url: s.url ?? undefined })),
      };
      setResult(clean);
      const item: ResearchItem = { id: uid(), createdAt: Date.now(), query: useQ, ...clean };
      const list = readJSON<ResearchItem[]>(KEYS.research, []);
      list.unshift(item);
      writeJSON(KEYS.research, list);
      logHistory({ tool: "Research", action: useQ, ref: item.id });
      toast.success("Research complete");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const text = result ? format(query, result) : "";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="AI Research Assistant"
        description="Ask anything about your industry and get a structured briefing in seconds."
        icon={<Search className="h-5 w-5" />}
      />

      <Card className="glass">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder='e.g. "Latest AI trends in customer service"'
              className="flex-1 min-w-[240px]"
            />
            <Button onClick={() => go()} disabled={loading} className="gradient-primary border-0 text-white">
              {loading ? <><Sparkles className="mr-2 h-4 w-4 animate-pulse" />Researching…</> : <><Sparkles className="mr-2 h-4 w-4" />Research</>}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROMPT_EXAMPLES.map((p) => (
              <button key={p} onClick={() => go(p)} className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent/10">
                {p}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-serif text-lg">{query}</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={async () => { await copy(text); toast.success("Copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" />Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={() => downloadPDF(`${query}.pdf`, query, text)}>
                <FileText className="mr-1 h-3.5 w-3.5" />PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toast.success("Saved to Library")}>
                <Save className="mr-1 h-3.5 w-3.5" />Saved
              </Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                const url = `${location.origin}/research?q=${encodeURIComponent(query)}`;
                await copy(url); toast.success("Share link copied");
              }}>
                <Share2 className="mr-1 h-3.5 w-3.5" />Share
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <Section title="Summary"><p className="leading-relaxed whitespace-pre-wrap">{result.summary}</p></Section>
            <div className="grid gap-5 md:grid-cols-2">
              <Section title="Key takeaways"><Bullets items={result.keyTakeaways} /></Section>
              <Section title="Important facts"><Bullets items={result.facts} /></Section>
              <Section title="Recommendations"><Bullets items={result.recommendations} /></Section>
              <Section title="Risks"><Bullets items={result.risks} /></Section>
              <Section title="Sources">
                <ul className="space-y-1">
                  {result.sources.map((s, i) => (
                    <li key={i} className="text-sm">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{s.title}</a>
                      ) : (
                        <span>{s.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Suggested reading"><Bullets items={result.suggestedReading} /></Section>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-muted-foreground">None</p>;
  return <ul className="ml-4 list-disc space-y-1">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>;
}

function format(q: string, r: R) {
  const join = (xs: string[]) => xs.map((x) => "• " + x).join("\n");
  return [
    q, "",
    "SUMMARY", r.summary, "",
    "KEY TAKEAWAYS", join(r.keyTakeaways), "",
    "FACTS", join(r.facts), "",
    "RECOMMENDATIONS", join(r.recommendations), "",
    "RISKS", join(r.risks), "",
    "SOURCES", r.sources.map((s) => `• ${s.title}${s.url ? ` — ${s.url}` : ""}`).join("\n"), "",
    "SUGGESTED READING", join(r.suggestedReading),
  ].join("\n");
}
