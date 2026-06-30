import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History as HistoryIcon, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { KEYS, useLocalState, type HistoryEntry } from "@/lib/storage";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Workplace AI" },
      { name: "description", content: "Timeline of every AI activity across your workspace." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [history, setHistory] = useLocalState<HistoryEntry[]>(KEYS.history, []);
  const [tool, setTool] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (tool !== "all" && h.tool !== tool) return false;
      if (q && !`${h.tool} ${h.action}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [history, tool, q]);

  const tools = Array.from(new Set(history.map((h) => h.tool)));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "workplace-ai-history.json";
    a.click();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="History"
        description="Every AI action across your workspace, all in one timeline."
        icon={<HistoryIcon className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportJson} disabled={history.length === 0}>
              <Download className="mr-2 h-4 w-4" />Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setHistory([]); toast.success("Cleared"); }} disabled={history.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" />Clear
            </Button>
          </>
        }
      />

      <Card className="glass">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search history…" className="max-w-md" />
            <Select value={tool} onValueChange={setTool}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tools</SelectItem>
                {tools.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <ol className="space-y-2">
              {filtered.map((h) => (
                <li key={h.id} className="flex items-start gap-3 rounded-lg border bg-card/60 p-3">
                  <Badge variant="outline" className="shrink-0">{h.tool}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{h.action}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(h.at).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
