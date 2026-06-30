import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  ClipboardList,
  ListTodo,
  Search,
  MessageSquare,
  Clock,
  Pin,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  KEYS,
  useLocalState,
  type EmailItem,
  type MeetingItem,
  type TaskItem,
  type ResearchItem,
  type HistoryEntry,
  type PinnedDoc,
} from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      {
        name: "description",
        content: "Your AI workplace productivity dashboard with stats, charts and quick actions.",
      },
    ],
  }),
  component: DashboardPage,
});

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildSeries(history: HistoryEntry[]) {
  const days: { day: string; emails: number; meetings: number; research: number; tasks: number; productivity: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = d.getTime() + 86400000;
    const dayEntries = history.filter((h) => h.at >= d.getTime() && h.at < next);
    days.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      emails: dayEntries.filter((h) => h.tool === "Email").length,
      meetings: dayEntries.filter((h) => h.tool === "Meeting").length,
      research: dayEntries.filter((h) => h.tool === "Research").length,
      tasks: dayEntries.filter((h) => h.tool === "Task").length,
      productivity: Math.min(100, dayEntries.length * 8 + 30),
    });
  }
  return days;
}

function DashboardPage() {
  const [emails] = useLocalState<EmailItem[]>(KEYS.emails, []);
  const [meetings] = useLocalState<MeetingItem[]>(KEYS.meetings, []);
  const [tasks] = useLocalState<TaskItem[]>(KEYS.tasks, []);
  const [research] = useLocalState<ResearchItem[]>(KEYS.research, []);
  const [history] = useLocalState<HistoryEntry[]>(KEYS.history, []);
  const [pinned] = useLocalState<PinnedDoc[]>(KEYS.pinned, []);

  const ts = todayStart();
  const emailsToday = emails.filter((e) => e.createdAt >= ts).length;
  const meetingsTotal = meetings.length;
  const tasksPlanned = tasks.length;
  const researchProjects = research.length;
  const aiHours = (history.length * 0.05).toFixed(1);

  const series = buildSeries(history);
  const completion = tasks.length
    ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
    : 0;

  const upcoming = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Good to see you, Alex"
        description="Here's what's happening across your workspace today."
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open AI Chat
              </Link>
            </Button>
            <Button asChild size="sm" className="gradient-primary text-white border-0">
              <Link to="/email">
                <Plus className="mr-2 h-4 w-4" />
                New Email
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Emails today" value={emailsToday} delta={`${emails.length} total`} icon={<Mail className="h-5 w-5" />} accent="primary" />
        <StatCard label="Meetings summarized" value={meetingsTotal} icon={<ClipboardList className="h-5 w-5" />} accent="accent" />
        <StatCard label="Tasks planned" value={tasksPlanned} delta={`${completion}% done`} icon={<ListTodo className="h-5 w-5" />} accent="success" />
        <StatCard label="Research projects" value={researchProjects} icon={<Search className="h-5 w-5" />} accent="warning" />
        <StatCard label="AI usage hrs" value={aiHours} icon={<Clock className="h-5 w-5" />} accent="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Daily productivity</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="prod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="productivity" stroke="var(--color-primary)" strokeWidth={2} fill="url(#prod)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Tasks completed</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: "done", value: completion, fill: "var(--color-accent)" }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={20} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-serif text-3xl">
                  {completion}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Emails generated</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="emails" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Research usage</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="research" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Meetings summarized</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="meetings" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Generate an email, summarize a meeting, or run research to see activity here.
              </p>
            ) : (
              <ol className="space-y-3">
                {history.slice(0, 8).map((h) => (
                  <li key={h.id} className="flex items-start gap-3 border-l-2 border-primary/40 pl-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{h.tool}</Badge>
                        <span className="truncate text-sm">{h.action}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(h.at).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks yet.{" "}
                <Link to="/tasks" className="text-primary underline-offset-2 hover:underline">
                  Plan some
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-lg border bg-card/60 p-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.deadline ?? "no due date"} • {t.priority}
                      </div>
                    </div>
                    <Badge variant={t.status === "in_progress" ? "default" : "secondary"}>
                      {t.status === "in_progress" ? "doing" : "todo"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Recent research</CardTitle>
          </CardHeader>
          <CardContent>
            {research.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No research yet.{" "}
                <Link to="/research" className="text-primary underline-offset-2 hover:underline">
                  Start your first
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {research.slice(0, 5).map((r) => (
                  <li key={r.id} className="rounded-lg border bg-card/60 p-3">
                    <div className="text-sm font-medium">{r.query}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{r.summary}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Pin className="h-4 w-4" /> Pinned documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pinned.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Pin emails, research or summaries from the Library to see them here.
              </p>
            ) : (
              <ul className="space-y-2">
                {pinned.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border bg-card/60 p-2 text-sm">
                    <span className="truncate">{p.title}</span>
                    <Badge variant="outline">{p.type}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/email"><Mail className="mr-2 h-4 w-4" />New Email</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/meetings"><ClipboardList className="mr-2 h-4 w-4" />Summarize Meeting</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/tasks"><ListTodo className="mr-2 h-4 w-4" />Plan Tasks</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/research"><Search className="mr-2 h-4 w-4" />Start Research</Link>
          </Button>
          <Button asChild className="gradient-primary text-white border-0">
            <Link to="/chat"><MessageSquare className="mr-2 h-4 w-4" />Open AI Chat</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
