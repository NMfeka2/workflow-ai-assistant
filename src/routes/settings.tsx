import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_SETTINGS, KEYS, useLocalState, type AppSettings,
} from "@/lib/storage";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workplace AI" },
      { name: "description", content: "Customize your AI workplace assistant." },
    ],
  }),
  component: SettingsPage,
});

const PROVIDERS = ["Lovable AI", "OpenAI ChatGPT", "Claude", "Gemini", "DeepSeek"];

function SettingsPage() {
  const [s, setS] = useLocalState<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
  const { theme, set } = useTheme();

  const upd = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setS({ ...s, [k]: v });
  const updKey = (provider: string, value: string) => setS({ ...s, apiKeys: { ...s.apiKeys, [provider]: value } });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Settings"
        description="Personalize Workplace AI to fit your workflow."
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="font-serif">Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Dark mode</Label><p className="text-xs text-muted-foreground">Use the dark theme.</p></div>
              <Switch checked={theme === "dark"} onCheckedChange={(v) => set(v ? "dark" : "light")} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Notifications</Label><p className="text-xs text-muted-foreground">Show in-app notifications.</p></div>
              <Switch checked={s.notifications} onCheckedChange={(v) => upd("notifications", v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={s.language} onValueChange={(v) => upd("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["English", "Spanish", "French", "German", "Portuguese", "Hindi", "Arabic", "Japanese", "Chinese"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="font-serif">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={s.profileName} onChange={(e) => upd("profileName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={s.profileEmail} onChange={(e) => upd("profileEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
              <p className="text-[11px] text-muted-foreground">Password changes require a connected account.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardHeader><CardTitle className="font-serif">AI provider</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Default provider</Label>
              <Select value={s.defaultProvider} onValueChange={(v) => upd("defaultProvider", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Lovable AI is wired and ready out of the box. Other providers are placeholders — paste your API key below and we'll wire them in a future update.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {PROVIDERS.filter((p) => p !== "Lovable AI").map((p) => (
                <div key={p} className="space-y-1.5">
                  <Label>{p} API key</Label>
                  <Input
                    type="password"
                    value={s.apiKeys[p] ?? ""}
                    onChange={(e) => updKey(p, e.target.value)}
                    placeholder="sk-…"
                  />
                </div>
              ))}
            </div>

            <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
