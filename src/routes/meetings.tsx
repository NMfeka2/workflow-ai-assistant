import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList, Sparkles, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { summarizeMeeting } from "@/lib/ai.functions";
import {
  KEYS, logHistory, readJSON, uid, writeJSON, type MeetingItem,
} from "@/lib/storage";
import { copy, downloadPDF } from "@/lib/exports";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Workplace AI" },
      { name: "description", content: "Paste a transcript and get summaries, action items, decisions, risks and deadlines." },
    ],
  }),
  component: MeetingsPage,
});

type Result = Omit<MeetingItem, "id" | "createdAt" | "transcript" | "title" | "favorite">;

function MeetingsPage() {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<null | string>(null);
  const sm = useServerFn(summarizeMeeting);

  const run = async (mode: "summary" | "actions" | "minutes" | "followup") => {
    if (!transcript.trim()) { toast.error("Paste a meeting transcript first."); return; }
    setLoading(mode);
    try {
      const r = await sm({ data: { transcript, mode } });
      const cleaned = {
        ...r,
        actionItems: r.actionItems.map((a) => ({ task: a.task, owner: a.owner ?? undefined, due: a.due ?? undefined })),
      };
      setResult(cleaned);
      if (!title && r.title) setTitle(r.title);
      const item: MeetingItem = {
        id: uid(), createdAt: Date.now(),
        title: title || r.title, transcript,
        ...cleaned,
      };
      const list = readJSON<MeetingItem[]>(KEYS.meetings, []);
      list.unshift(item);
      writeJSON(KEYS.meetings, list);
      logHistory({ tool: "Meeting", action: `${mode}: ${item.title}`, ref: item.id });
      toast.success("Done");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(null); }
  };

  const text = result ? formatReport(title, result) : "";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Turn raw transcripts into crisp summaries, action items and minutes."
        icon={<ClipboardList className="h-5 w-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardContent className="space-y-3 p-5">
            <Input placeholder="Meeting title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Paste your meeting transcript here…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[360px] font-mono text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => run("summary")} disabled={!!loading} className="gradient-primary border-0 text-white">
                <Sparkles className="mr-2 h-4 w-4" />{loading === "summary" ? "Summarizing…" : "Summarize"}
              </Button>
              <Button onClick={() => run("actions")} disabled={!!loading} variant="outline">
                {loading === "actions" ? "Extracting…" : "Extract Action Items"}
              </Button>
              <Button onClick={() => run("minutes")} disabled={!!loading} variant="outline">
                {loading === "minutes" ? "Drafting…" : "Create Minutes"}
              </Button>
              <Button onClick={() => run("followup")} disabled={!!loading} variant="outline">
                {loading === "followup" ? "Drafting…" : "Follow-up Email"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-serif text-lg">Output</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={!result} onClick={async () => { await copy(text); toast.success("Copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" />Copy
              </Button>
              <Button variant="ghost" size="sm" disabled={!result} onClick={() => downloadPDF(`${title || "meeting"}.pdf`, title || "Meeting", text)}>
                <FileText className="mr-1 h-3.5 w-3.5" />PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Your structured meeting report will appear here.
              </p>
            )}
            {result && (
              <div className="space-y-4 text-sm">
                <Section title="Summary"><p className="whitespace-pre-wrap">{result.summary}</p></Section>
                <Section title="Key decisions"><BulletList items={result.decisions} /></Section>
                <Section title="Action items">
                  {result.actionItems.length === 0 && <p className="text-muted-foreground">None</p>}
                  <ul className="space-y-1">
                    {result.actionItems.map((a, i) => (
                      <li key={i} className="rounded-md border bg-card/60 p-2">
                        <div className="font-medium">{a.task}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {a.owner ?? "unassigned"} {a.due ? ` • due ${a.due}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
                <Section title="Risks"><BulletList items={result.risks} /></Section>
                <Section title="Deadlines"><BulletList items={result.deadlines} /></Section>
                <Section title="Participants"><BulletList items={result.participants} /></Section>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-muted-foreground">None</p>;
  return <ul className="ml-4 list-disc space-y-1">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>;
}

function formatReport(title: string, r: Result) {
  return [
    title || "Meeting", "",
    "SUMMARY", r.summary, "",
    "DECISIONS", ...r.decisions.map((d) => "• " + d), "",
    "ACTION ITEMS", ...r.actionItems.map((a) => `• ${a.task} — ${a.owner ?? "unassigned"}${a.due ? ` (due ${a.due})` : ""}`), "",
    "RISKS", ...r.risks.map((d) => "• " + d), "",
    "DEADLINES", ...r.deadlines.map((d) => "• " + d), "",
    "PARTICIPANTS", ...r.participants.map((d) => "• " + d),
  ].join("\n");
}
