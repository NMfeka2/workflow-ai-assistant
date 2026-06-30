import { createServerFn } from "@tanstack/react-start";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL_ID = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gw = createLovableAiGatewayProvider(key);
  return gw(MODEL_ID);
}

/* -------- Email -------- */

const EmailInput = z.object({
  recipient: z.string(),
  sender: z.string(),
  subject: z.string(),
  type: z.string(),
  tone: z.string(),
  length: z.string(),
  purpose: z.string(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const prompt = `Write a ${data.length} ${data.type} email with a ${data.tone} tone.
From: ${data.sender}
To: ${data.recipient}
Subject: ${data.subject}

Purpose / context:
${data.purpose}

Return ONLY the email body (with greeting and sign-off). Do not include "Subject:" header or any commentary.`;
    const { text } = await generateText({ model: getModel(), prompt });
    return { body: text.trim() };
  });

const ImproveInput = z.object({ text: z.string(), instruction: z.string().optional() });
export const improveText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ImproveInput.parse(d))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      prompt: `Improve the following text. ${data.instruction ?? "Make it clearer, more concise, and more professional. Fix grammar."}\n\n---\n${data.text}\n---\n\nReturn ONLY the improved text.`,
    });
    return { body: text.trim() };
  });

/* -------- Meeting -------- */

const MeetingInput = z.object({
  transcript: z.string(),
  mode: z.enum(["summary", "actions", "minutes", "followup"]).default("summary"),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data }) => {
    const schema = z.object({
      title: z.string(),
      summary: z.string(),
      decisions: z.array(z.string()),
      actionItems: z.array(
        z.object({
          task: z.string(),
          owner: z.string().nullable(),
          due: z.string().nullable(),
        }),
      ),
      risks: z.array(z.string()),
      deadlines: z.array(z.string()),
      participants: z.array(z.string()),
    });

    const modeHint =
      data.mode === "actions"
        ? "Focus on extracting concrete action items."
        : data.mode === "minutes"
          ? "Produce formal meeting minutes."
          : data.mode === "followup"
            ? "Produce a follow-up email summary."
            : "Produce a thorough summary.";

    const result = await generateObject({
      model: getModel(),
      schema,
      prompt: `${modeHint}\n\nMeeting transcript:\n"""${data.transcript}"""`,
    });
    return result.object;
  });

/* -------- Research -------- */

const ResearchInput = z.object({ query: z.string() });

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const schema = z.object({
      summary: z.string(),
      facts: z.array(z.string()),
      sources: z.array(z.object({ title: z.string(), url: z.string().nullable() })),
      references: z.array(z.string()),
      suggestedReading: z.array(z.string()),
      keyTakeaways: z.array(z.string()),
      risks: z.array(z.string()),
      recommendations: z.array(z.string()),
    });
    const result = await generateObject({
      model: getModel(),
      schema,
      prompt: `You are a workplace research assistant. Research this topic and produce a structured briefing.\n\nTopic: ${data.query}\n\nBe specific and practical. Cite known reputable sources where possible.`,
    });
    return result.object;
  });

/* -------- Task planning -------- */

const PlanInput = z.object({
  scope: z.enum(["daily", "weekly", "optimize"]),
  context: z.string().optional(),
  existingTasks: z
    .array(
      z.object({
        title: z.string(),
        priority: z.string(),
        status: z.string(),
        deadline: z.string().nullable(),
      }),
    )
    .optional(),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data }) => {
    const schema = z.object({
      title: z.string(),
      overview: z.string(),
      blocks: z.array(
        z.object({
          when: z.string(),
          task: z.string(),
          rationale: z.string(),
        }),
      ),
      newTasks: z.array(
        z.object({
          title: z.string(),
          priority: z.enum(["low", "medium", "high"]),
          estimatedTime: z.string(),
          aiSuggestion: z.string(),
        }),
      ),
    });
    const result = await generateObject({
      model: getModel(),
      schema,
      prompt: `Create a ${data.scope} schedule for a knowledge worker.\nContext: ${data.context ?? "general productivity"}\nExisting tasks: ${JSON.stringify(data.existingTasks ?? [])}\n\nReturn a clear plan plus 2-4 new tasks to add to the planner.`,
    });
    return result.object;
  });
