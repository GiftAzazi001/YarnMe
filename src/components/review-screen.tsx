"use client";

import { useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Info,
  Pencil,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { type LanguageCode } from "@/lib/analysis";
import { useYarnContext } from "@/lib/yarn-context";

const copy: Record<
  LanguageCode,
  {
    title: string;
    heading: string;
    intro: string;
    snippet: string;
    explanation: string;
    alertPrefix: string;
    suggest: string;
    original: string;
    sheetTitle: string;
    yarnMeSaid: string;
    correctionLabel: string;
    send: string;
    thanks: string;
    thanksBody: string;
    done: string;
    noReview: string;
    noReviewBody: string;
    backToResult: string;
  }
> = {
  "simple-english": {
    title: "Review Yarn",
    heading: "Review this explanation",
    intro: "We noticed a potential issue in the recent breakdown.",
    snippet: "Section Snippet",
    explanation: "YarnMe Explanation:",
    alertPrefix: "YarnMe is not fully sure about this part:",
    suggest: "Suggest a correction",
    original: "See original",
    sheetTitle: "How would you explain this better?",
    yarnMeSaid: "YarnMe said",
    correctionLabel: "Your correction",
    send: "Send",
    thanks: "Thank you.",
    thanksBody: "You helped YarnMe improve.",
    done: "Done",
    noReview: "No review needed",
    noReviewBody: "YarnMe did not find an unclear part in the latest yarn.",
    backToResult: "Back to result",
  },
  pidgin: {
    title: "Review Yarn",
    heading: "Review this explanation",
    intro: "YarnMe notice say one part fit need person eye.",
    snippet: "Section Snippet",
    explanation: "YarnMe Explanation:",
    alertPrefix: "YarnMe no fully sure about this part:",
    suggest: "Suggest correction",
    original: "See original",
    sheetTitle: "How you go explain this one better?",
    yarnMeSaid: "YarnMe talk say",
    correctionLabel: "Your correction",
    send: "Send",
    thanks: "Thank you.",
    thanksBody: "You help YarnMe improve.",
    done: "Done",
    noReview: "No review needed",
    noReviewBody: "YarnMe no see unclear part for the latest yarn.",
    backToResult: "Back to result",
  },
  hausa: {
    title: "Review Yarn",
    heading: "Review this explanation",
    intro: "We noticed a potential issue in the recent breakdown.",
    snippet: "Section Snippet",
    explanation: "YarnMe Explanation:",
    alertPrefix: "YarnMe bai da cikakken tabbaci game da wannan sashe:",
    suggest: "Ba da shawara",
    original: "Duba asali",
    sheetTitle: "Yaya za ka bayyana wannan da kyau?",
    yarnMeSaid: "YarnMe yace",
    correctionLabel: "Naka fassarar",
    send: "Aika",
    thanks: "Na gode.",
    thanksBody: "Ka taimaka wa YarnMe ya inganta.",
    done: "Kammala",
    noReview: "Babu buƙatar dubawa",
    noReviewBody: "YarnMe bai ga wani ɓangare mara kyau ba a cikin sabon bayanin.",
    backToResult: "Koma zuwa sakamako",
  },
};

export function ReviewScreen() {
  const { analysisResult } = useYarnContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const router = useRouter();

  const language = analysisResult?.language ?? "pidgin";
  const activeCopy = copy[language];
  const uncertainty = analysisResult?.analysis.uncertainties[0];

  function closeSheet() {
    setSheetOpen(false);
    setSubmitted(false);
    setCorrection("");
  }

  if (!analysisResult || !uncertainty) {
    return (
      <AppShell header="brand">
        <section className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center py-xl text-center">
          <div className="mb-lg flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-primary">
            <CheckCircle2 aria-hidden="true" size={40} />
          </div>
          <h2 className="text-headline-lg-mobile font-bold text-primary">
            {activeCopy.noReview}
          </h2>
          <p className="mt-sm max-w-[320px] text-body-md text-on-surface-variant">
            {activeCopy.noReviewBody}
          </p>
          <Link
            href={analysisResult ? "/result" : "/"}
            className="touch-target mt-xl inline-flex items-center justify-center rounded-full bg-primary px-lg text-label-lg font-semibold text-on-primary shadow-soft transition hover:bg-primary-container active:scale-95"
          >
            {activeCopy.backToResult}
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell header="none">
      <header className="sticky top-0 z-40 -mx-container-margin flex items-center justify-between bg-background px-container-margin py-md">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push("/result")}
          className="touch-target flex items-center justify-start rounded-full text-on-surface transition hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" size={30} />
        </button>
        <h1 className="flex-1 pr-12 text-center text-headline-md font-semibold">
          {activeCopy.title}
        </h1>
      </header>

      <section className="pt-xl">
        <h2 className="text-headline-lg-mobile font-bold text-on-surface">
          {activeCopy.heading}
        </h2>
        <p className="mt-xs text-body-md text-on-surface-variant">
          {activeCopy.intro}
        </p>
      </section>

      <section className="relative mt-xl rounded-xl border border-surface-variant bg-surface p-md shadow-soft">
        <div className="absolute -top-3 right-4 flex items-center gap-1 rounded-full bg-error px-3 py-1 text-on-error shadow-soft">
          <AlertTriangle aria-hidden="true" size={14} />
          <span className="text-label-sm font-semibold">Needs Review</span>
        </div>
        <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-error" />
        <div className="pl-sm">
          <h3 className="mb-2 flex items-center gap-xs text-label-sm font-medium uppercase text-on-surface-variant">
            <FileText aria-hidden="true" size={16} />
            {activeCopy.snippet}
          </h3>
          <p className="text-body-lg leading-relaxed text-on-surface font-semibold">
            &quot;{uncertainty.text}&quot;
          </p>
          <div className="mt-md border-t border-surface-variant/50 pt-md">
            <p className="mb-1 text-label-sm font-medium text-primary">
              {activeCopy.explanation}
            </p>
            <p className="text-body-md italic text-on-surface-variant">
              &quot;{analysisResult.analysis.meaning}&quot;
            </p>
          </div>
        </div>
      </section>

      <section className="mt-lg flex items-start gap-sm rounded-lg border border-error/10 bg-error/10 p-md text-on-surface shadow-soft">
        <Info
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-error"
          size={22}
        />
        <p className="text-body-md">
          {activeCopy.alertPrefix} {uncertainty.reason}
        </p>
      </section>

      <section className="mt-xl flex flex-col gap-md pb-lg">
        <Button
          onClick={() => {
            setSubmitted(false);
            setSheetOpen(true);
          }}
          className="h-14 w-full rounded-full"
        >
          <Pencil aria-hidden="true" size={20} />
          <span>{activeCopy.suggest}</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowOriginal((prev) => !prev)}
          className="h-14 w-full rounded-full"
        >
          <Eye aria-hidden="true" size={20} />
          <span>{showOriginal ? "Hide original" : activeCopy.original}</span>
        </Button>

        {showOriginal && (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
            <p className="text-label-sm font-semibold uppercase text-primary mb-xs">
              Original Notice
            </p>
            <p className="text-body-md whitespace-pre-wrap text-on-surface italic">
              {analysisResult.sourceText}
            </p>
          </div>
        )}
      </section>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close correction sheet"
            className="absolute inset-0 bg-[#313030]/60"
            onClick={closeSheet}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[90dvh] w-full max-w-[720px] overflow-hidden rounded-t-2xl bg-surface shadow-[0_-4px_24px_rgb(0_0_0_/_0.1)]">
            <div className="flex justify-center pb-2 pt-4">
              <div className="h-1.5 w-12 rounded-full bg-surface-variant" />
            </div>
            {!submitted ? (
              <div className="flex max-h-[calc(90dvh-24px)] flex-col gap-lg overflow-y-auto p-container-margin pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-headline-md font-semibold">
                    {activeCopy.sheetTitle}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={closeSheet}
                    className="touch-target flex items-center justify-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-variant"
                  >
                    <X aria-hidden="true" size={22} />
                  </button>
                </div>

                <div className="flex flex-col gap-xs">
                  <p className="text-label-sm font-medium uppercase text-on-surface-variant">
                    {activeCopy.yarnMeSaid}
                  </p>
                  <div className="rounded-lg border border-surface-variant/30 bg-surface-container-low p-sm">
                    <p className="text-body-md text-on-surface-variant">
                      &quot;{analysisResult.analysis.meaning}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-xs">
                  <label
                    className="text-label-sm font-medium uppercase text-on-surface"
                    htmlFor="correction"
                  >
                    {activeCopy.correctionLabel}
                  </label>
                  <textarea
                    id="correction"
                    value={correction}
                    onChange={(event) => setCorrection(event.target.value)}
                    className="min-h-[170px] w-full flex-1 resize-none rounded-lg border-2 border-outline-variant bg-surface p-md text-body-lg text-on-surface transition focus:border-primary focus:ring-0"
                    spellCheck={false}
                    placeholder="Type the corrected or clearer explanation..."
                  />
                </div>

                <Button
                  onClick={() => {
                    if (correction.trim()) setSubmitted(true);
                  }}
                  className="h-14 w-full rounded-full"
                  disabled={!correction.trim()}
                >
                  {activeCopy.send}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-container-margin py-xl text-center">
                <div className="mx-auto mb-md flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <CheckCircle2 aria-hidden="true" size={44} />
                </div>
                <h2 className="mb-sm text-headline-md font-semibold">
                  {activeCopy.thanks}
                </h2>
                <p className="text-body-lg text-on-surface-variant">
                  {activeCopy.thanksBody}
                </p>
                <Button
                  variant="secondary"
                  onClick={closeSheet}
                  className="mt-lg h-14 w-full rounded-full border-surface-variant bg-surface-container text-on-surface hover:bg-surface-variant"
                >
                  {activeCopy.done}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
