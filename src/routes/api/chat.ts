import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

const SYSTEM = `You are the AI Workplace Productivity Assistant — a sharp, friendly, big-tech-grade assistant for knowledge workers.
Help with email drafting, meeting summaries, planning, research, brainstorming, writing, and analysis.
Use markdown. Use code blocks for code. Keep answers concise unless asked for depth.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gw = createLovableAiGatewayProvider(key);
        const model = gw("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
