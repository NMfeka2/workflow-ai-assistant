import { useEffect, useState, useCallback } from "react";

export type ID = string;

export type EmailItem = {
  id: ID;
  createdAt: number;
  recipient: string;
  sender: string;
  subject: string;
  type: string;
  tone: string;
  length: string;
  purpose: string;
  body: string;
  favorite?: boolean;
};

export type MeetingItem = {
  id: ID;
  createdAt: number;
  title: string;
  transcript: string;
  summary: string;
  decisions: string[];
  actionItems: { task: string; owner?: string; due?: string }[];
  risks: string[];
  deadlines: string[];
  participants: string[];
  favorite?: boolean;
};

export type TaskItem = {
  id: ID;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  deadline?: string;
  assignee?: string;
  aiSuggestion?: string;
  estimatedTime?: string;
  progress?: number;
  createdAt: number;
};

export type ResearchItem = {
  id: ID;
  createdAt: number;
  query: string;
  summary: string;
  facts: string[];
  sources: { title: string; url?: string }[];
  references: string[];
  suggestedReading: string[];
  keyTakeaways: string[];
  risks: string[];
  recommendations: string[];
  favorite?: boolean;
};

export type ScheduleItem = {
  id: ID;
  createdAt: number;
  title: string;
  scope: "daily" | "weekly" | "optimize";
  content: string;
};

export type HistoryEntry = {
  id: ID;
  at: number;
  tool: string;
  action: string;
  project?: string;
  ref?: string;
};

export type PinnedDoc = {
  id: ID;
  title: string;
  type: "email" | "meeting" | "research" | "schedule";
  ref: ID;
};

export type AppSettings = {
  theme: "light" | "dark";
  notifications: boolean;
  language: string;
  defaultProvider: string;
  profileName: string;
  profileEmail: string;
  apiKeys: Record<string, string>;
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  notifications: true,
  language: "English",
  defaultProvider: "Lovable AI",
  profileName: "Alex Morgan",
  profileEmail: "alex@company.com",
  apiKeys: {},
};

const KEYS = {
  emails: "wpa:emails",
  meetings: "wpa:meetings",
  tasks: "wpa:tasks",
  research: "wpa:research",
  schedules: "wpa:schedules",
  history: "wpa:history",
  chat: "wpa:chat",
  settings: "wpa:settings",
  pinned: "wpa:pinned",
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("wpa:storage", { detail: { key } }));
  } catch {
    /* ignore quota */
  }
}

export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readJSON<T>(key, initial));

  useEffect(() => {
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === key) {
        setValue(readJSON<T>(key, initial));
      }
    };
    window.addEventListener("wpa:storage", onChange);
    return () => window.removeEventListener("wpa:storage", onChange);
  }, [key, initial]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        writeJSON(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logHistory(entry: Omit<HistoryEntry, "id" | "at">) {
  const list = readJSON<HistoryEntry[]>(KEYS.history, []);
  list.unshift({ id: uid(), at: Date.now(), ...entry });
  writeJSON(KEYS.history, list.slice(0, 500));
}

export { KEYS };
