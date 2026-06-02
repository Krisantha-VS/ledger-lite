import OpenAI    from "openai";
import Anthropic from "@anthropic-ai/sdk";

const getOpenAI    = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AICallOptions {
  system:     string;
  user:       string;
  maxTokens?: number;
  useSonnet?: boolean; // prefer Sonnet for higher-quality analysis (F6 insights)
}

export async function callAI({ system, user, maxTokens = 1024, useSonnet = false }: AICallOptions): Promise<string> {
  // For Sonnet requests: try Anthropic Sonnet first, then OpenAI GPT-4o-mini
  if (useSonnet && process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await getAnthropic().messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages:   [{ role: "user", content: user }],
      });
      return res.content[0]?.type === "text" ? res.content[0].text : "";
    } catch (err) {
      console.error("[suggestions] Anthropic Sonnet failed, falling back:", err instanceof Error ? err.message : err);
    }
  }

  // Standard chain: OpenAI GPT-4o-mini → Claude Haiku
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await getOpenAI().chat.completions.create({
        model:                 "gpt-4o-mini",
        temperature:           0,
        max_completion_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user },
        ],
      });
      return res.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[suggestions] OpenAI failed:", err instanceof Error ? err.message : err);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await getAnthropic().messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system,
        messages:   [{ role: "user", content: user }],
      });
      return res.content[0]?.type === "text" ? res.content[0].text : "";
    } catch (err) {
      console.error("[suggestions] Anthropic Haiku failed:", err instanceof Error ? err.message : err);
    }
  }

  throw new Error("No AI provider configured.");
}

export function parseAIJson<T>(content: string, fallback: T): T {
  try {
    const cleaned = content.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
