"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/shared/lib/auth-client";

type Sentiment = "on_track" | "at_risk" | "ahead" | "completed";

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  ahead:     "hsl(var(--ll-income))",
  on_track:  "hsl(var(--ll-accent))",
  at_risk:   "hsl(38 92% 50%)",
  completed: "hsl(var(--ll-income))",
};
const SENTIMENT_ICON: Record<Sentiment, string> = {
  ahead:     "🚀",
  on_track:  "✅",
  at_risk:   "⚠️",
  completed: "🎉",
};

const CACHE_KEY = (id: number) => `goal-coach-${id}`;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry { message: string; sentiment: string; ts: number }

export function GoalCoachingMessage({ goalId }: { goalId: number }) {
  const [message, setMessage]     = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment>("on_track");

  useEffect(() => {
    // Check localStorage cache first
    try {
      const raw = localStorage.getItem(CACHE_KEY(goalId));
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry;
        if (Date.now() - entry.ts < CACHE_TTL) {
          setMessage(entry.message);
          setSentiment(entry.sentiment as Sentiment);
          return;
        }
      }
    } catch { /* ignore */ }

    let cancelled = false;
    authFetch("/api/v1/ai/goal-coach", {
      method: "POST",
      body: JSON.stringify({ goalId }),
    })
      .then(r => r.json())
      .then(json => {
        if (cancelled || !json.success) return;
        const { message: msg, sentiment: sent } = json.data;
        setMessage(msg);
        setSentiment(sent as Sentiment);
        try {
          localStorage.setItem(CACHE_KEY(goalId), JSON.stringify({ message: msg, sentiment: sent, ts: Date.now() }));
        } catch { /* ignore */ }
      })
      .catch(() => { /* silently fail — coaching is optional */ });

    return () => { cancelled = true; };
  }, [goalId]);

  if (!message) return null;

  const color = SENTIMENT_COLOR[sentiment] ?? SENTIMENT_COLOR.on_track;
  const icon  = SENTIMENT_ICON[sentiment] ?? "✅";

  return (
    <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color }}>
      {icon} {message}
    </p>
  );
}
