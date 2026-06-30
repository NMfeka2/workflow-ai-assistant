import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Library as LibraryIcon, Star, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  KEYS, useLocalState,
  type EmailItem, type MeetingItem, type ResearchItem, type ScheduleItem,
} from "@/lib/storage";
import { downloadText } from "@/lib/exports";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Workplace AI" },
      { name: "description", content: "All your saved emails, research, meetings and schedules in one place." },
    ],
  }),
  component: LibraryPage,
});

type Unified = {
  id: string;
  kind: "email" | "research" | "meeting" | "schedule";
  title: string;
  preview: string;
  createdAt: number;
  favorite?: boolean;
  raw: string;
};

function LibraryPage() {
  const [emails, setEmails] = useLocalState<EmailItem[]>(KEYS.emails, []);
  const [meetings, setMeetings] = useLocalState<MeetingItem[]>(KEYS.meetings, []);
  const [research, setResearch] = useLocalState<ResearchItem[]>(KEYS.research, []);
  const [schedules, setSchedules] = useLocalState<ScheduleItem[]>(KEYS.schedules, []);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");

  const all: Unified[] = useMemo(() => {
    const items: Unified[] = [
      ...emails.map<Unified>((e) => ({
        id: e.id, kind: "email", title: e.subject || "(no subject)", preview: e.body.slice(0, 140),
        createdAt: e.createdAt, favorite: e.favorite, raw: e.body,
      })),
      ...research.map<Unified>((r) => ({
        id: r.id, kind: "research", title: r.query, preview: r.summary.slice(0, 140),
        createdAt: r.createdAt, favorite: r.favorite, raw: r.summary,
      })),
      ...meetings.map<Unified>((m) => ({
        id: m.id, kind: "meeting", title: m.title || "Meeting", preview: m.summary.slice(0, 140),
        createdAt: m.createdAt, favorite: m.favorite, raw: m.summary,
      })),
      ...schedules.map<Unified>((s) => ({
        id: s.id, kind: "schedule", title: s.title, preview: s.content.slice(0, 140),
        createdAt: s.createdAt, raw: s.content,
      })),
    ].sort((a, b) => b.createdAt - a.createdAt);
    return items;
  }, [emails, meetings, research, schedules]);

  const filtered = all.filter((i) => {
    if (tab === "favorites" && !i.favorite) return false;
    if (tab !== "all" && tab !== "favorites" && i.kind !== tab) return false;
    if (q && !`${i.title} ${i.preview}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const toggleFav = (item: Unified) => {
    if (item.kind === "email") setEmails(emails.map((e) => e.id === item.id ? { ...e, favorite: !e.favorite } : e));
    if (item.kind === "research") setResearch(research.map((e) => e.id === item.id ? { ...e, favorite: !e.favorite } : e));
    if (item.kind === "meeting") setMeetings(meetings.map((e) => e.id === item.id ? { ...e, favorite: !e.favorite } : e));
  };

  const remove = (item: Unified) => {
    if (item.kind === "email") setEmails(emails.filter((e) => e.id !== item.id));
    if (item.kind === "research") setResearch(research.filter((e) => e.id !== item.id));
    if (item.kind === "meeting") setMeetings(meetings.filter((e) => e.id !== item.id));
    if (item.kind === "schedule") setSchedules(schedules.filter((e) => e.id !== item.id));
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Library"
        description="All your AI-generated work, searchable and exportable."
        icon={<LibraryIcon className="h-5 w-5" />}
      />

      <Card className="glass">
        <CardContent className="p-4">
          <div className="relative mb-3 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search library…" className="pl-9" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All ({all.length})</TabsTrigger>
              <TabsTrigger value="email">Emails ({emails.length})</TabsTrigger>
              <TabsTrigger value="research">Research ({research.length})</TabsTrigger>
              <TabsTrigger value="meeting">Meetings ({meetings.length})</TabsTrigger>
              <TabsTrigger value="schedule">Schedules ({schedules.length})</TabsTrigger>
              <TabsTrigger value="favorites">★ Favorites</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {filtered.map((item) => (
                    <li key={`${item.kind}-${item.id}`} className="rounded-xl border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{item.kind}</Badge>
                            <span className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-1 truncate font-medium">{item.title}</div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{item.preview}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {item.kind !== "schedule" && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleFav(item)}>
                              <Star className={`h-3.5 w-3.5 ${item.favorite ? "fill-current text-warning" : ""}`} />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => downloadText(`${item.title}.txt`, item.raw)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => remove(item)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
