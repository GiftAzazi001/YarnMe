"use client";

import { useRouter } from "@/lib/navigation";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  FileClock,
  FileText,
  MessageSquarePlus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { useYarnContext } from "@/lib/yarn-context";
import { devTestInputs } from "@/lib/dev-test-inputs";

const langBadges = {
  "simple-english": { label: "Simple English", color: "bg-primary/10 text-primary" },
  pidgin: { label: "Pidgin", color: "bg-secondary/10 text-secondary" },
  hausa: { label: "Hausa", color: "bg-tertiary/10 text-tertiary" },
};

export function HistoryScreen() {
  const { historyList, setAnalysisResult, setSourceText, setLanguage, runAnalysis } =
    useYarnContext();
  const router = useRouter();

  function handleOpenHistoryItem(item: (typeof historyList)[0]) {
    setAnalysisResult(item);
    setSourceText(item.sourceText);
    setLanguage(item.language);
    router.push("/result");
  }

  async function handleLoadSample(index: number) {
    const sample = devTestInputs[index];
    router.push("/processing");
    await runAnalysis(sample.text, "simple-english");
    router.push("/result");
  }

  if (historyList.length === 0) {
    return (
      <AppShell header="brand">
        <section className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center py-xl text-center">
          <div className="mb-lg flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-primary">
            <FileClock aria-hidden="true" size={40} />
          </div>
          <h1 className="text-headline-lg-mobile font-bold text-primary">
            No yarns yet
          </h1>
          <p className="mt-sm max-w-[320px] text-body-md text-on-surface-variant">
            Explained notices and documents will be saved here so you can review them anytime.
          </p>
          <div className="mt-xl flex flex-col gap-sm w-full max-w-xs">
            <Button
              onClick={() => router.push("/")}
              className="h-14 rounded-full text-label-lg font-semibold"
            >
              <MessageSquarePlus aria-hidden="true" size={20} />
              <span>Start a yarn</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleLoadSample(0)}
              className="h-12 rounded-full text-label-md font-semibold"
            >
              <Building2 size={18} />
              <span>Try sample notice</span>
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell header="brand">
      <section className="pt-md pb-xl">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="text-headline-lg font-bold text-primary">History</h1>
            <p className="text-body-md text-on-surface-variant">
              Recently explained notices and documents
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {historyList.map((item, idx) => {
            const badge = langBadges[item.language] || langBadges["simple-english"];
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={`${item.createdAt}-${idx}`}
                onClick={() => handleOpenHistoryItem(item)}
                className="group flex cursor-pointer items-start justify-between gap-md rounded-2xl border border-outline/15 bg-surface p-md shadow-xs transition hover:border-primary hover:shadow-soft active:scale-[0.99]"
              >
                <div className="flex items-start gap-sm min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-xs mb-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-label-sm font-semibold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                        <Clock size={12} />
                        {formattedDate}
                      </span>
                    </div>
                    <p className="text-label-lg font-bold text-on-surface line-clamp-2 leading-snug">
                      {item.analysis.meaning}
                    </p>
                    <p className="mt-1 text-body-sm text-on-surface-variant truncate">
                      &quot;{item.sourceText}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center self-center text-on-surface-variant group-hover:text-primary transition">
                  <ChevronRight size={22} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-xl text-center">
          <Button
            variant="secondary"
            onClick={() => router.push("/")}
            className="rounded-full px-xl h-12"
          >
            <MessageSquarePlus size={18} />
            <span>Explain another notice</span>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
