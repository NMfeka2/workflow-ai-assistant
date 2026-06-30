import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListTodo, Plus, Sparkles, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planTasks } from "@/lib/ai.functions";
import {
  KEYS, useLocalState, logHistory, uid, readJSON, writeJSON,
  type TaskItem, type ScheduleItem,
} from "@/lib/storage";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      { name: "description", content: "Kanban planner with AI-generated daily and weekly schedules." },
    ],
  }),
  component: TasksPage,
});

const COLS: { id: TaskItem["status"]; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

function TasksPage() {
  const [tasks, setTasks] = useLocalState<TaskItem[]>(KEYS.tasks, []);
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState<TaskItem["priority"]>("medium");
  const [planLoading, setPlanLoading] = useState<null | string>(null);
  const [latestPlan, setLatestPlan] = useState<string>("");
  const plan = useServerFn(planTasks);

  const add = () => {
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      { id: uid(), title: newTitle.trim(), status: "todo", priority, createdAt: Date.now(), progress: 0 },
      ...prev,
    ]);
    setNewTitle("");
  };

  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const id = String(e.active.id);
    const col = String(e.over.id) as TaskItem["status"];
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: col, progress: col === "completed" ? 100 : col === "in_progress" ? 50 : 0 } : t)));
  };

  const runPlan = async (scope: "daily" | "weekly" | "optimize") => {
    setPlanLoading(scope);
    try {
      const res = await plan({
        data: {
          scope,
          context: "Knowledge worker, mix of deep work and collaboration",
          existingTasks: tasks.map((t) => ({
            title: t.title, priority: t.priority, status: t.status, deadline: t.deadline ?? null,
          })),
        },
      });
      const lines = [
        res.title, "",
        res.overview, "",
        ...res.blocks.map((b) => `• ${b.when} — ${b.task}\n   ${b.rationale}`),
      ].join("\n");
      setLatestPlan(lines);

      const newOnes: TaskItem[] = res.newTasks.map((n) => ({
        id: uid(), createdAt: Date.now(), status: "todo",
        title: n.title, priority: n.priority, estimatedTime: n.estimatedTime, aiSuggestion: n.aiSuggestion, progress: 0,
      }));
      setTasks((prev) => [...newOnes, ...prev]);

      const schedules = readJSON<ScheduleItem[]>(KEYS.schedules, []);
      schedules.unshift({ id: uid(), createdAt: Date.now(), title: res.title, scope, content: lines });
      writeJSON(KEYS.schedules, schedules);

      logHistory({ tool: "Task", action: `${scope} plan: ${res.title}` });
      toast.success("Plan generated");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setPlanLoading(null); }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="AI Task Planner"
        description="Drag and drop tasks across stages and let AI build your daily and weekly plan."
        icon={<ListTodo className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" disabled={!!planLoading} onClick={() => runPlan("daily")}>
              <Sparkles className="mr-2 h-4 w-4" />{planLoading === "daily" ? "…" : "Daily Schedule"}
            </Button>
            <Button variant="outline" size="sm" disabled={!!planLoading} onClick={() => runPlan("weekly")}>
              {planLoading === "weekly" ? "…" : "Weekly Plan"}
            </Button>
            <Button size="sm" className="gradient-primary border-0 text-white" disabled={!!planLoading} onClick={() => runPlan("optimize")}>
              {planLoading === "optimize" ? "…" : "Optimize Schedule"}
            </Button>
          </>
        }
      />

      <Card className="glass">
        <CardContent className="flex flex-wrap items-end gap-2 p-4">
          <div className="min-w-[220px] flex-1">
            <Input
              placeholder="Add a new task…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={add} className="gradient-primary border-0 text-white">
            <Plus className="mr-1 h-4 w-4" />Add
          </Button>
        </CardContent>
      </Card>

      <DndContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {COLS.map((col) => (
            <Column key={col.id} id={col.id} label={col.label}>
              {tasks.filter((t) => t.status === col.id).map((t) => (
                <TaskCard key={t.id} task={t} onRemove={() => remove(t.id)} />
              ))}
              {tasks.filter((t) => t.status === col.id).length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Drop tasks here</p>
              )}
            </Column>
          ))}
        </div>
      </DndContext>

      {latestPlan && (
        <Card className="glass">
          <CardHeader className="pb-2"><CardTitle className="font-serif text-lg">Latest AI plan</CardTitle></CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{latestPlan}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Column({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Card ref={setNodeRef as any} className={`glass transition-colors ${isOver ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-serif text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function TaskCard({ task, onRemove }: { task: TaskItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border bg-card p-3 text-sm shadow-sm ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button {...listeners} {...attributes} className="cursor-grab pt-0.5 text-muted-foreground active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="text-[10px]">
              {task.priority}
            </Badge>
            {task.estimatedTime && <span className="text-[10px] text-muted-foreground">~{task.estimatedTime}</span>}
          </div>
          <div className="mt-1 font-medium">{task.title}</div>
          {task.aiSuggestion && <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">💡 {task.aiSuggestion}</div>}
          {typeof task.progress === "number" && <Progress value={task.progress} className="mt-2 h-1" />}
        </div>
        <button onClick={onRemove} className="opacity-0 transition-opacity group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  );
}
