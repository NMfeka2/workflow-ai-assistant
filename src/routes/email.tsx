import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  Sparkles,
  Copy,
  Download,
  FileText,
  RefreshCw,
  Wand2,
  Mic,
  MicOff,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateEmail, improveText } from "@/lib/ai.functions";
import {
  KEYS,
  logHistory,
  readJSON,
  uid,
  writeJSON,
  type EmailItem,
} from "@/lib/storage";
import { copy, downloadPDF, downloadText } from "@/lib/exports";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      { name: "description", content: "Generate professional emails with AI in any tone, type, and length." },
    ],
  }),
  component: EmailPage,
});

const TYPES = ["Professional", "Follow-up", "Complaint", "Request", "Marketing", "HR", "Thank You", "Resignation", "Leave Request", "Apology"];
const TONES = ["Professional", "Friendly", "Formal", "Casual", "Persuasive", "Confident"];
const LENGTHS = ["Short", "Medium", "Long"];

function useSpeech(setText: (fn: (prev: string) => string) => void) {
  const [recording, setRecording] = useState(false);
  const SR: any = typeof window !== "undefined" ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition : null;
  let rec: any = null;
  const toggle = () => {
    if (!SR) { toast.error("Speech recognition not supported in this browser"); return; }
    if (recording) { rec?.stop(); setRecording(false); return; }
    rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setText((prev) => prev + (prev ? " " : "") + txt);
    };
    rec.onend = () => setRecording(false);
    rec.start();
    setRecording(true);
  };
  return { recording, toggle };
}

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState(TYPES[0]!);
  const [tone, setTone] = useState(TONES[0]!);
  const [length, setLength] = useState(LENGTHS[1]!);
  const [purpose, setPurpose] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);

  const gen = useServerFn(generateEmail);
  const imp = useServerFn(improveText);
  const { recording, toggle } = useSpeech(setPurpose as any);

  const run = async () => {
    if (!purpose.trim()) { toast.error("Add a purpose or context."); return; }
    setLoading(true);
    try {
      const res = await gen({ data: { recipient, sender, subject, type, tone, length, purpose } });
      setOutput(res.body);
      const item: EmailItem = {
        id: uid(), createdAt: Date.now(),
        recipient, sender, subject, type, tone, length, purpose, body: res.body,
      };
      const list = readJSON<EmailItem[]>(KEYS.emails, []);
      list.unshift(item);
      writeJSON(KEYS.emails, list);
      logHistory({ tool: "Email", action: `Generated email: ${subject || "(no subject)"}`, ref: item.id });
      toast.success("Email generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate");
    } finally { setLoading(false); }
  };

  const improve = async () => {
    if (!output) return;
    setImproving(true);
    try {
      const res = await imp({ data: { text: output } });
      setOutput(res.body);
      toast.success("Improved with AI");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setImproving(false); }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Smart Email Generator"
        description="Draft any type of email in seconds, in the exact tone you want."
        icon={<Mail className="h-5 w-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardContent className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Recipient</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Jane Smith, Hiring Manager…" />
              </div>
              <div className="space-y-1.5">
                <Label>Sender</Label>
                <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="You / your name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's it about?" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LENGTHS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Purpose / context</Label>
                <Button type="button" variant="ghost" size="sm" onClick={toggle}>
                  {recording ? <><MicOff className="mr-1 h-3.5 w-3.5" />Stop</> : <><Mic className="mr-1 h-3.5 w-3.5" />Dictate</>}
                </Button>
              </div>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe what you want to say…"
                className="min-h-[140px]"
              />
            </div>
            <Button onClick={run} disabled={loading} className="gradient-primary border-0 text-white w-full">
              {loading ? <><Sparkles className="mr-2 h-4 w-4 animate-pulse" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Email</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Label>Generated email</Label>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" disabled={!output} onClick={async () => { await copy(output); toast.success("Copied"); }}>
                  <Copy className="mr-1 h-3.5 w-3.5" />Copy
                </Button>
                <Button size="sm" variant="ghost" disabled={!output} onClick={() => downloadText(`${subject || "email"}.txt`, output)}>
                  <Download className="mr-1 h-3.5 w-3.5" />TXT
                </Button>
                <Button size="sm" variant="ghost" disabled={!output} onClick={() => downloadPDF(`${subject || "email"}.pdf`, subject || "Email", output)}>
                  <FileText className="mr-1 h-3.5 w-3.5" />PDF
                </Button>
                <Button size="sm" variant="ghost" disabled={!output || loading} onClick={run}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />Redo
                </Button>
                <Button size="sm" variant="ghost" disabled={!output || improving} onClick={improve}>
                  <Wand2 className="mr-1 h-3.5 w-3.5" />Improve
                </Button>
              </div>
            </div>
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Your AI-generated email will appear here…"
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
