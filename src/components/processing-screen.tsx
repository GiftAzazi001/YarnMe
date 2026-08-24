"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { AlertCircle, FileText, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { useYarnContext } from "@/lib/yarn-context";
import { devTestInputs } from "@/lib/dev-test-inputs";

const messages = [
  "Reading your notice…",
  "Finding what matters…",
  "Making it easier to understand…",
  "Translating to your language…",
];

export function ProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const router = useRouter();
  const {
    sourceText,
    language,
    isAnalyzing,
    analysisResult,
    error,
    setError,
    runAnalysis,
    loadSample,
  } = useYarnContext();

  const executedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // If we already have a result, go straight to result screen
    if (analysisResult && !isAnalyzing) {
      router.push("/result");
      return;
    }

    // If analysis hasn't started yet and we have text, start it
    if (!executedRef.current && sourceText.trim() && !isAnalyzing) {
      executedRef.current = true;
      runAnalysis(sourceText, language).then((success) => {
        if (success) {
          router.push("/result");
        }
      });
    }
  }, [analysisResult, isAnalyzing, sourceText, language, runAnalysis, router]);

  async function handleTrySample() {
    loadSample(0);
    executedRef.current = true;
    const success = await runAnalysis(devTestInputs[0].text, language);
    if (success) {
      router.push("/result");
    }
  }

  function handleBackHome() {
    setError(null);
    router.push("/");
  }

  const hasNoText = !sourceText.trim() && !isAnalyzing;

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
            <FileText aria-hidden="true" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg font-semibold text-on-surface">
              {sourceText ? "Notice loaded" : "No notice text"}
            </p>
            <p className="mt-xs text-label-sm text-on-surface-variant">
              {isAnalyzing ? "Processing..." : error ? "Needs attention" : "Ready"}
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
              <div className="flex flex-col gap-xs w-full">
                <Button
                  variant="primary"
                  className="h-14 rounded-full px-xl w-full"
                  onClick={() => {
                    executedRef.current = false;
                    void runAnalysis(sourceText, language).then((s) => s && router.push("/result"));
                  }}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Try again"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleBackHome}
                  className="text-label-md text-on-surface-variant hover:text-primary py-xs"
                >
                  Edit notice text
                </button>
              </div>
            </div>
          ) : hasNoText ? (
            <div className="mt-xl flex w-full max-w-sm flex-col items-center gap-md text-center">
              <p className="text-headline-md font-semibold text-on-background">
                No notice found to explain
              </p>
              <p className="text-body-md text-on-surface-variant">
                You can try a sample notice or go back to paste your own.
              </p>
              <div className="flex flex-col gap-sm w-full">
                <Button
                  variant="primary"
                  className="h-14 rounded-full px-xl w-full"
                  onClick={() => void handleTrySample()}
                >
                  Try sample notice
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 rounded-full px-xl w-full"
                  onClick={handleBackHome}
                >
                  Paste your notice
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-xl flex h-24 items-center justify-center text-center">
                <p className="text-headline-md font-semibold text-on-background transition">
                  {messages[messageIndex]}
                </p>
              </div>
              <p className="max-w-[280px] text-center text-body-md text-on-surface-variant">
                Just relax. It won&apos;t take long. YarnMe is translating and organizing everything.
              </p>
            </>
          )}
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 h-32 w-full bg-gradient-to-t from-surface-container to-transparent" />
    </div>
  );
}
