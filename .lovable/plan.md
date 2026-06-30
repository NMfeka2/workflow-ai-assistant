
# AI Workplace Productivity Assistant — Build Plan

Polished SaaS dashboard with all 8 features, wired to Lovable AI, persisted in browser localStorage, with a single rolling chat.

## Design

**Color direction — big-tech, blue & gray with dark purple + darker gray accents:**
- Primary blue `#2563EB` (CTAs, links, active nav)
- Secondary gray `#475569` (body text, secondary buttons)
- Dark purple accent `#5B21B6` (highlights, badges, chart accent, gradient end)
- Darker gray `#1E293B` (cards in dark mode, sidebar, headers)
- Background light `#F8FAFC` / dark `#0B1220`
- Card light `#FFFFFF` / dark `#111827`
- Border `#CBD5E1` / `#1F2A3A`
- Success `#22C55E`, warning `#F59E0B`, danger `#EF4444`
- Gradient: `linear-gradient(135deg, #2563EB → #5B21B6)` for hero header & primary buttons
- Glass cards: `color-mix(in oklab, var(--card) 70%, transparent)` + `backdrop-blur-xl`
- Radius 18px, soft blue-tinted shadows, dark/light toggle persisted in localStorage

**Typography:**
- Headings: `font-family: "High Tower Text", "Hoefler Text", "Goudy Old Style", Garamond, serif;` — Windows ships High Tower Text and will render it natively. High Tower Text is not available as a web font (no Google Fonts / @fontsource package, and it isn't licensed for self-hosting), so non-Windows users fall back to the next serif in the stack. I'll flag this in chat after the build so you can pick a paid web font later if you want pixel-identical rendering on Mac/Linux/mobile.
- Body / UI: system UI sans (`-apple-system, "Segoe UI", Roboto, sans-serif`).

## Layout

`SidebarProvider` in `__root.tsx`. Collapsible icon sidebar (10 nav items), mobile offcanvas, active-route highlight. Top bar: global search (`⌘K`), notifications, theme toggle, profile, settings shortcut. `<Outlet />` with page fade-in.

## Routes

```
src/routes/
  __root.tsx       sidebar + topbar shell
  index.tsx        Dashboard
  chat.tsx         AI Chat
  email.tsx        Smart Email Generator
  meetings.tsx     Meeting Notes Summarizer
  tasks.tsx        AI Task Planner (Kanban)
  research.tsx     AI Research Assistant
  library.tsx      Research Library
  history.tsx      History
  settings.tsx     Settings
  api/chat.ts      streaming chat endpoint
```

## Features

1. **Dashboard** — 5 glass stat cards (Emails Today, Meetings Summarized, Tasks Planned, Research Projects, AI Hours) from localStorage counters; Recent Activity timeline; Upcoming Tasks; Recent Research; Pinned Documents; Quick Action buttons. Charts via **Recharts**: Daily Productivity (area), Emails (bar), Research (line), Meetings (bar), Tasks Completed (radial).
2. **Smart Email Generator** — Recipient, sender, subject, type, tone, length, purpose. Output in editable area with Copy / TXT / PDF (jsPDF) / Regenerate / Improve with AI. Auto-saves to Library + History.
3. **Meeting Notes Summarizer** — Transcript textarea, 4 action buttons. Structured output: Summary, Decisions, Action Items, Risks, Deadlines, Participants. PDF + Copy.
4. **AI Task Planner** — Kanban with `@dnd-kit` (To Do / In Progress / Completed). Card fields: priority, deadline, assignee, AI suggestion, est. time, progress %. AI buttons: Daily Schedule / Weekly Plan / Optimize Schedule.
5. **AI Research Assistant** — Query → Summary, Facts, Sources, References, Suggested Reading, Key Takeaways, Risks, Recommendations. Copy / PDF / Save / Share.
6. **AI Chat** — Single rolling conversation (`chat:messages` localStorage). AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`). Suggested prompts. Markdown + code blocks. Copy + Clear. Custom generated agent logo (not Sparkles).
7. **Research Library** — Unified list (emails, research, meetings, schedules). Search, type filter, sort, favorite, delete, download.
8. **History** — Timeline of every AI action (date / tool / project filters, JSON export).
9. **Settings** — Theme, notifications, language, default AI provider dropdown (Lovable AI / OpenAI / Claude / Gemini / DeepSeek — only Lovable AI is wired), profile, password (UI), API keys (UI, stored locally).

## AI wiring

- Enable **Lovable Cloud** to provision `LOVABLE_API_KEY` (no DB tables, no auth).
- `src/lib/ai-gateway.server.ts` builds the gateway provider.
- TanStack server functions in `src/lib/ai.functions.ts`: `generateEmail`, `summarizeMeeting`, `planTasks`, `runResearch`, `improveText`.
- Chat: streaming route `src/routes/api/chat.ts` + `useChat`.
- Default model: `google/gemini-3-flash-preview`. Structured outputs via `Output.object` + zod for meeting / research / task results.
- 402/429 errors surfaced via toast.

## Persistence

`src/lib/storage.ts` typed accessors for `emails`, `meetings`, `tasks`, `research`, `schedules`, `library`, `history`, `chat`, `settings`, `pinned`. `useLocalState<T>(key, initial)` hook. Every AI action logs a history entry.

## Smart features

Toast (sonner), skeletons, progress bars, keyboard shortcuts (`⌘K` search, `g d/c/e/...` jump), drag-and-drop (Kanban), exports (jsPDF PDF, Blob TXT, RTF for "DOCX"), copy everywhere, Speech-to-Text + Text-to-Speech via Web Speech API in chat + email purpose field.

## Packages to add

`recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `jspdf`, `react-markdown`, `remark-gfm`, `ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/react`. AI Elements via `bunx ai-elements@latest add conversation message prompt-input shimmer`. No font packages installed — High Tower Text uses the OS-native font stack as described above.

## Out of scope (called out)

- Real auth / multi-device sync — localStorage only by choice.
- Real OpenAI / Claude / Gemini / DeepSeek keys — provider dropdown is UI only; Lovable AI does all real calls.
- True DOCX / PPTX — TXT + PDF (and RTF that Word opens) instead.
- Real email sending; real meeting audio upload + transcription.
- Pixel-identical High Tower Text on non-Windows — requires a paid web-font license, not free.

## Build order

1. Tokens, font stack, sidebar + topbar shell, route stubs.
2. Storage layer + history logger + dashboard with real-counter stats + charts.
3. Enable Lovable Cloud, gateway helper + server functions.
4. Email → Meeting → Research → Tasks.
5. AI Chat (api route + useChat + AI Elements).
6. Library + History + Settings.
7. Keyboard shortcuts, speech, animations, skeletons, empty states, mobile QA pass.
