"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { AlertCircle, FileText, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { analyzeResponseSchema } from "@/lib/analysis";
import {
  clearPendingAnalysis,
  readPendingAnalysis,
  saveAnalysisResult,
} from "@/lib/analysis-storage";

const messages = [
  "Reading your information…",
  "Finding what matters…",
  "Making it easier to understand…",
];

export function ProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1400);

    return () => {
      window.clearInterval(messageTimer);
    };
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function runAnalysis() {
      const pending = readPendingAnalysis();
      if (!pending || !pending.sourceText?.trim()) {
        setError("No text found to explain. Please paste your notice first.");
        return;
      }

      try {
        const startedAt = Date.now();
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: pending.sourceText,
            language: pending.language,
          }),
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "YarnMe could not explain this right now. Please try again.";
          setError(message);
          return;
        }

        const parsed = analyzeResponseSchema.safeParse(payload);
        if (!parsed.success) {
          setError("YarnMe received an unclear response. Please try again.");
          return;
        }

        const elapsed = Date.now() - startedAt;
        if (elapsed < 1000) {
          await new Promise((resolve) => window.setTimeout(resolve, 1000 - elapsed));
        }

        saveAnalysisResult(parsed.data);
        clearPendingAnalysis();

        try {
          router.push("/result");
        } catch {
          if (typeof window !== "undefined") {
            window.location.href = "/result";
          }
        }
      } catch (err) {
        console.error("Analysis fetch failed:", err);
        setError("YarnMe could not explain this right now. Please check your connection and try again.");
      }
    }

    void runAnalysis();
  }, [router]);

  function handleRetry() {
    setIsRetrying(true);
    try {
      router.push("/");
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  return (
    <div className="ambient-pulse flex min-h-dvh flex-col justify-between overflow-hidden bg-background">
      <header className="mx-auto flex w-full max-w-[720px] justify-center px-container-margin py-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-white shadow-sm">
          <Logo compact />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center px-container-margin pb-xl">
        <div className="mb-xl flex w-full max-w-sm items-center gap-sm rounded-xl border border-outline-variant/30 bg-surface p-md opacity-90 shadow-soft">
          <div className="flex rounded-lg bg-surface-container-high p-xs text-primary">
            <FileText aria-hidden="true" size={28} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg font-semibold text-on-surface">
              Pasted information
            </p>
            <p className="mt-xs text-label-sm text-on-surface-variant">
              Text • Processing...
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                className="stroke-surface-container-high"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="4"
              />
              <circle
                className="progress-ring-circle stroke-primary"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>
            <Sparkles
              aria-hidden="true"
              className="absolute text-primary motion-safe:animate-pulse"
              size={52}
            />
          </div>

          {error ? (
            <div className="mt-xl flex w-full max-w-sm flex-col items-center gap-md text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
                <AlertCircle size={28} />
              </div>
              <p className="text-headline-md font-semibold text-on-background">
                Something did not work
              </p>
              <p className="text-body-md text-on-surface-variant">{error}</p>
              <Button
                variant="primary"
                className="h-14 rounded-full px-xl"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Try again"
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-xl flex h-24 items-center justify-center text-center">
                <p className="text-headline-md font-semibold text-on-background transition">
                  {messages[messageIndex]}
                </p>
              </div>
              <p className="max-w-[280px] text-center text-body-md text-on-surface-variant">
                Just relax. It won&apos;t take long. We are making sure
                everything is clear.
              </p>
            </>
          )}
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 h-32 w-full bg-gradient-to-t from-surface-container to-transparent" />
    </div>
  );
}
