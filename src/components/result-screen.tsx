import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  Pause,
  Send,
  Sparkles,
  UsersRound,
  Volume2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AccentCard } from "@/components/ui";
import {
  analyzeResponseSchema,
  type LanguageCode,
} from "@/lib/analysis";
import {
  readAnalysisResult,
  saveAnalysisResult,
} from "@/lib/analysis-storage";
import {
  type NormalizedAnalysis,
  type NormalizedStoredAnalysis,
} from "@/lib/analysis-normalization";

const languageLabels: Record<LanguageCode, string> = {
  "simple-english": "Simple English",
  pidgin: "Pidgin",
  hausa: "Hausa",
};

const copy: Record<
  LanguageCode,
  {
    languageName: string;
    title: string;
    listen: string;
    listening: string;
    stop: string;
    meaning: string;
    audience: string;
    eligibility: string;
    importantDate: string;
    warnings: string;
    actions: string;
    documents: string;
    legacyRequirements: string;
    payments: string;
    paymentAmount: string;
    paymentPurpose: string;
    paymentWhen: string;
    paymentWho: string;
    notStated: string;
    sourceLimitations: string;
    incompleteWarning: string;
    original: string;
    copyBtn: string;
    copiedBtn: string;
    questionTitle: string;
    questionBody: string;
    questionPlaceholder: string;
    questionOne: string;
    questionTwo: string;
    clear: string;
    clearBody: string;
    needsReview: string;
    switching: string;
  }
> = {
  "simple-english": {
    languageName: "Simple English",
    title: "YarnMe explained it",
    listen: "Listen",
    listening: "Playing audio...",
    stop: "Stop listening",
    meaning: "What it means",
    audience: "Who this concerns",
    eligibility: "Who can apply",
    importantDate: "Important date",
    warnings: "Important things to know",
    actions: "What to do",
    documents: "Documents you need",
    legacyRequirements: "Other requirements",
    payments: "Payments",
    paymentAmount: "Amount",
    paymentPurpose: "Purpose",
    paymentWhen: "When",
    paymentWho: "Who",
    notStated: "Not stated",
    sourceLimitations: "What is not clear from the source",
    incompleteWarning:
      "Some parts of this information appear to be missing or cut off. YarnMe will not guess the missing details.",
    original: "See original text",
    copyBtn: "Copy explanation",
    copiedBtn: "Copied!",
    questionTitle: "Question?",
    questionBody: "Still confused? Ask YarnMe.",
    questionPlaceholder: "Ask YarnMe here...",
    questionOne: "What is the deadline?",
    questionTwo: "What should I do next?",
    clear: "Clear",
    clearBody: "YarnMe did not find any unclear part that needs review.",
    needsReview: "Needs Review",
    switching: "Explaining in Simple English...",
  },
  pidgin: {
    languageName: "Pidgin",
    title: "YarnMe don explain am",
    listen: "Listen",
    listening: "YarnMe dey talk...",
    stop: "Stop audio",
    meaning: "Wetin e mean",
    audience: "Who e concern",
    eligibility: "Who fit apply",
    importantDate: "Important date",
    warnings: "Important thing to know",
    actions: "Wetin you go do",
    documents: "Documents wey you need",
    legacyRequirements: "Other things wey the source require",
    payments: "Payment",
    paymentAmount: "Amount",
    paymentPurpose: "Purpose",
    paymentWhen: "When",
    paymentWho: "Who",
    notStated: "No dey stated",
    sourceLimitations: "Wetin the source no clear about",
    incompleteWarning:
      "Some parts of this information look like say dem cut off. YarnMe no go guess the missing details.",
    original: "See original text",
    copyBtn: "Copy explanation",
    copiedBtn: "Copied!",
    questionTitle: "Question?",
    questionBody: "You still no clear? Ask YarnMe.",
    questionPlaceholder: "Ask YarnMe here...",
    questionOne: "When be deadline?",
    questionTwo: "Wetin I go do next?",
    clear: "Clear",
    clearBody: "YarnMe no see any unclear part wey need review.",
    needsReview: "Needs Review",
    switching: "YarnMe dey translate to Pidgin...",
  },
  hausa: {
    languageName: "Hausa",
    title: "YarnMe ya yi bayani",
    listen: "Saurara",
    listening: "Ana karantawa...",
    stop: "Dakata",
    meaning: "Ma'anar sa",
    audience: "Wanda abin ya shafa",
    eligibility: "Wanda zai iya nema",
    importantDate: "Ranar mahimmanci",
    warnings: "Abin lura",
    actions: "Abin da za ka yi",
    documents: "Takardun da kake bukata",
    legacyRequirements: "Sauran bukatu",
    payments: "Biyan kudi",
    paymentAmount: "Adadi",
    paymentPurpose: "Dalili",
    paymentWhen: "Lokaci",
    paymentWho: "Waye",
    notStated: "Ba a bayyana ba",
    sourceLimitations: "Abin da asalin bai bayyana ba",
    incompleteWarning:
      "Wasu sassan wannan bayani suna kama da sun bata ko sun yanke. YarnMe ba zai hasashen bayanan da suka bata ba.",
    original: "Duba asali (See original text)",
    copyBtn: "Kwafi bayani",
    copiedBtn: "An kwafa!",
    questionTitle: "Tambaya?",
    questionBody: "Har yanzu akwai rudani? Tambayi YarnMe.",
    questionPlaceholder: "Tambayi YarnMe anan...",
    questionOne: "Yaushe ne ranar karshe?",
    questionTwo: "Me zan yi yanzu?",
    clear: "Clear",
    clearBody: "YarnMe bai ga wani sashe mai bukatar dubawa ba.",
    needsReview: "Needs Review",
    switching: "YarnMe yana fassara zuwa Hausa...",
  },
};

type QAMessage = {
  id: string;
  question: string;
  answer: string;
};

function cleanDisplayItem(item: string) {
  return item
    .trim()
    .replace(/^(?:svg\s+)+/i, "")
    .replace(/^(?:(?:[-*•]|\d+[\).])\s+)+/, "")
    .trim();
}

function displayPaymentValue(value: string, fallback: string) {
  return cleanDisplayItem(value) || fallback;
}

function sourceAppearsIncomplete(analysis: NormalizedAnalysis) {
  const text = [
    ...analysis.sourceLimitations,
    ...analysis.uncertainties.map(
      (uncertainty) => `${uncertainty.text} ${uncertainty.reason}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  return /incomplete|cut off|truncated|missing|damaged|ocr|no complete|bai cika|yanke|bata/.test(
    text,
  );
}

export function ResultScreen() {
  const [stored, setStored] = useState<NormalizedStoredAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAMessage[]>([]);
  const [qaError, setQaError] = useState("");
  const router = useRouter();
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const result = readAnalysisResult();
      if (!result) {
        setLoaded(true);
        router.replace("/");
        return;
      }
      setStored(result);
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [router]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const activeCopy = copy[stored?.language ?? "simple-english"];

  async function handleLanguageSwitch(newLang: LanguageCode) {
    if (!stored || stored.language === newLang || isSwitchingLang) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsSwitchingLang(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: stored.sourceText,
          language: newLang,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to switch language");
      }

      const payload = await response.json();
      const parsed = analyzeResponseSchema.safeParse(payload);
      if (parsed.success) {
        saveAnalysisResult(parsed.data);
        const updated = readAnalysisResult();
        if (updated) {
          setStored(updated);
        }
      }
    } catch (err) {
      console.error("Language switch error:", err);
    } finally {
      setIsSwitchingLang(false);
    }
  }

  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!stored) return;

    window.speechSynthesis.cancel();

    // Construct spoken text
    const textToSpeak = [
      stored.analysis.meaning,
      stored.analysis.actions.length > 0
        ? `Actions: ${stored.analysis.actions.join(". ")}`
        : "",
    ]
      .filter(Boolean)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    synthRef.current = utterance;

    if (stored.language === "hausa") {
      utterance.lang = "ha-NG";
    } else {
      utterance.lang = "en-NG";
    }

    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleCopy() {
    if (!stored) return;

    const sections = [
      `--- ${activeCopy.title} (${languageLabels[stored.language]}) ---`,
      `\n${activeCopy.meaning.toUpperCase()}:\n${stored.analysis.meaning}`,
      stored.analysis.audience
        ? `\n${activeCopy.audience.toUpperCase()}:\n${stored.analysis.audience}`
        : "",
      stored.analysis.actions.length > 0
        ? `\n${activeCopy.actions.toUpperCase()}:\n${stored.analysis.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
        : "",
      stored.analysis.dates.length > 0
        ? `\n${activeCopy.importantDate.toUpperCase()}:\n${stored.analysis.dates.map((d) => `${d.date}: ${d.context}`).join("\n")}`
        : "",
      stored.analysis.payments.length > 0
        ? `\n${activeCopy.payments.toUpperCase()}:\n${stored.analysis.payments.map((p) => `${p.amount} - ${p.purpose} (${p.when})`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(sections).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  async function askQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if (!trimmed || !stored || isAsking) return;

    setQaError("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: stored.sourceText,
          language: stored.language,
          question: trimmed,
          meaning: stored.analysis.meaning,
        }),
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        setQaHistory((prev) => [
          ...prev,
          {
            id: `${Date.now()}`,
            question: trimmed,
            answer: data.answer,
          },
        ]);
        setFollowUpQuery("");
      } else {
        setQaError(data.error || "Could not answer right now.");
      }
    } catch {
      setQaError("Connection error. Please try again.");
    } finally {
      setIsAsking(false);
    }
  }

  if (loaded && !stored) {
    return (
      <AppShell header="brand">
        <section className="py-xl text-center text-body-md text-on-surface-variant">
          Loading...
        </section>
      </AppShell>
    );
  }

  if (!stored) {
    return (
      <AppShell header="brand">
        <section className="py-xl text-center text-body-md text-on-surface-variant">
          Loading...
        </section>
      </AppShell>
    );
  }

  const { analysis } = stored;
  const hasUncertainties = analysis.uncertainties.length > 0;
  const hasAudience = analysis.audience.trim().length > 0;
  const hasIncompleteSource = sourceAppearsIncomplete(analysis);

  return (
    <AppShell header="brand">
      {/* Language Selector Chips */}
      <section className="pt-sm pb-xs">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface-container p-1.5 shadow-sm border border-outline-variant/30">
          {(["simple-english", "pidgin", "hausa"] as const).map((lang) => {
            const isSelected = stored.language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageSwitch(lang)}
                disabled={isSwitchingLang}
                className={`touch-target flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-label-md font-semibold transition ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-soft"
                    : "text-on-surface hover:bg-surface-variant/50"
                }`}
              >
                {isSwitchingLang && isSelected ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : null}
                <span>{languageLabels[lang]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Header & Audio Action */}
      <section className="space-y-sm pt-md text-center">
        <h1 className="text-headline-lg-mobile font-bold text-primary">
          {activeCopy.title}
        </h1>

        <div className="flex items-center justify-center gap-sm pt-xs">
          <button
            type="button"
            onClick={toggleSpeech}
            className={`touch-target flex h-14 min-w-[200px] items-center justify-center gap-sm rounded-full px-6 text-[17px] font-semibold transition active:scale-95 ${
              isSpeaking
                ? "bg-secondary text-on-secondary shadow-soft animate-pulse"
                : "bg-primary text-on-primary shadow-soft hover:bg-primary-container"
            }`}
          >
            {isSpeaking ? (
              <>
                <Pause aria-hidden="true" size={24} />
                <span>{activeCopy.stop}</span>
              </>
            ) : (
              <>
                <Volume2 aria-hidden="true" size={24} />
                <span>{activeCopy.listen}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title={activeCopy.copyBtn}
            className="touch-target flex h-14 w-14 items-center justify-center rounded-full border border-outline/20 bg-surface text-primary transition hover:bg-primary/5 active:scale-95 shadow-soft"
          >
            {copied ? (
              <Check aria-hidden="true" className="text-primary" size={22} />
            ) : (
              <Copy aria-hidden="true" size={22} />
            )}
          </button>
        </div>
      </section>

      {/* Incomplete source warning */}
      {hasIncompleteSource ? (
        <section className="mt-lg flex items-start gap-sm rounded-xl border border-secondary/20 bg-secondary-fixed/40 p-md text-on-secondary-fixed shadow-soft">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-secondary"
            size={22}
          />
          <div>
            <h2 className="text-label-lg font-semibold text-secondary">
              {activeCopy.incompleteWarning}
            </h2>
          </div>
        </section>
      ) : null}

      {/* Meaning */}
      <section className="mt-xl">
        <AccentCard tone="primary" className="p-md">
          <div className="flex items-start gap-sm pl-sm">
            <Lightbulb
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-primary"
              size={24}
            />
            <div>
              <h2 className="text-label-sm font-semibold uppercase tracking-wide text-primary">
                {activeCopy.meaning}
              </h2>
              <p className="mt-xs text-headline-md font-bold leading-relaxed text-on-surface">
                {analysis.meaning}
              </p>
            </div>
          </div>
        </AccentCard>
      </section>

      {/* Audience */}
      {hasAudience ? (
        <section className="mt-md">
          <AccentCard tone="secondary" className="p-md">
            <div className="flex items-start gap-sm pl-sm">
              <UsersRound
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-secondary-fixed-variant"
                size={24}
              />
              <div>
                <h2 className="text-label-sm font-semibold uppercase tracking-wide text-secondary-fixed-variant">
                  {activeCopy.audience}
                </h2>
                <p className="mt-xs text-headline-md font-bold leading-snug text-on-surface">
                  {analysis.audience}
                </p>
              </div>
            </div>
          </AccentCard>
        </section>
      ) : null}

      {/* Important Dates */}
      {analysis.dates.length > 0 ? (
        <section className="mt-lg space-y-md">
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.importantDate}
          </h2>
          <div className="space-y-3">
            {analysis.dates.map((item) => (
              <div
                key={`${item.date}-${item.context}`}
                className="flex items-start gap-3 rounded-xl border border-outline/10 bg-surface p-3.5 shadow-sm"
              >
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 text-primary shrink-0"
                  size={22}
                />
                <div className="space-y-1">
                  <p className="text-label-lg font-bold text-primary">
                    {cleanDisplayItem(item.date)}
                  </p>
                  <p className="text-body-md text-on-surface-variant">
                    {cleanDisplayItem(item.context)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Actions */}
      {analysis.actions.length > 0 ? (
        <section className="mt-xl space-y-md">
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.actions}
          </h2>
          <ol className="list-none space-y-3 text-body-md text-on-surface-variant">
            {analysis.actions.map((item, index) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-outline/10 bg-surface p-3.5 shadow-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-sm font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-on-surface leading-relaxed">
                  {cleanDisplayItem(item)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Eligibility */}
      {analysis.eligibility.length > 0 ? (
        <section className="mt-xl space-y-md">
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.eligibility}
          </h2>
          <ul className="space-y-3 text-body-md text-on-surface-variant">
            {analysis.eligibility.map((item) => {
              const cleanItem = cleanDisplayItem(item);
              return (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-outline/10 bg-surface p-3.5 shadow-sm"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 text-primary shrink-0"
                    size={20}
                  />
                  <span className="text-on-surface">{cleanItem}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Documents */}
      {analysis.documents.length > 0 ? (
        <section className="mt-lg space-y-md">
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.documents}
          </h2>
          <ul className="space-y-3 text-body-md text-on-surface-variant">
            {analysis.documents.map((item) => {
              const cleanItem = cleanDisplayItem(item);
              return (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-outline/10 bg-surface p-3.5 shadow-sm"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 text-primary shrink-0"
                    size={20}
                  />
                  <span className="text-on-surface">{cleanItem}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Payments */}
      {analysis.payments.length > 0 ? (
        <section className="mt-lg space-y-md">
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.payments}
          </h2>
          <div className="space-y-3">
            {analysis.payments.map((payment) => (
              <div
                key={`${payment.amount}-${payment.purpose}-${payment.when}-${payment.who}`}
                className="rounded-xl border border-outline/10 bg-surface p-md text-body-md text-on-surface-variant shadow-sm"
              >
                <p className="text-label-sm font-semibold uppercase text-on-surface-variant">
                  {activeCopy.paymentAmount}
                </p>
                <p className="text-headline-md font-bold text-primary">
                  {displayPaymentValue(payment.amount, activeCopy.notStated)}
                </p>
                <dl className="mt-sm grid grid-cols-1 gap-xs pt-xs border-t border-outline-variant/30">
                  <div>
                    <dt className="text-label-sm font-semibold uppercase text-on-surface-variant">
                      {activeCopy.paymentPurpose}
                    </dt>
                    <dd className="text-body-md font-medium text-on-surface">
                      {displayPaymentValue(payment.purpose, activeCopy.notStated)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-label-sm font-semibold uppercase text-on-surface-variant">
                      {activeCopy.paymentWhen}
                    </dt>
                    <dd className="text-body-md font-medium text-on-surface">
                      {displayPaymentValue(payment.when, activeCopy.notStated)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-label-sm font-semibold uppercase text-on-surface-variant">
                      {activeCopy.paymentWho}
                    </dt>
                    <dd className="text-body-md font-medium text-on-surface">
                      {displayPaymentValue(payment.who, activeCopy.notStated)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Warnings */}
      {analysis.warnings.length > 0 ? (
        <section className="mt-lg space-y-md">
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.warnings}
          </h2>
          <ul className="space-y-3 text-body-md text-on-surface-variant">
            {analysis.warnings.map((item) => {
              const cleanItem = cleanDisplayItem(item);
              return (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 p-3.5 text-on-surface"
                >
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 text-error shrink-0"
                    size={20}
                  />
                  <span>{cleanItem}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Source Limitations */}
      {analysis.sourceLimitations.length > 0 ? (
        <section className="mt-lg rounded-xl bg-surface-container-low p-md border border-outline-variant/30">
          <h2 className="mb-sm text-label-lg font-semibold text-primary">
            {activeCopy.sourceLimitations}
          </h2>
          <ul className="space-y-2 text-body-md text-on-surface-variant">
            {analysis.sourceLimitations.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{cleanDisplayItem(item)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Original Text Drawer */}
      <section className="mt-xl border-y border-outline/10 py-md">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between text-label-lg font-semibold text-primary">
            <span className="flex items-center gap-sm">
              <FileText aria-hidden="true" size={22} />
              {activeCopy.original}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="transition group-open:rotate-180"
              size={22}
            />
          </summary>
          <div className="mt-sm border-t border-outline/10 pt-sm">
            <p className="rounded-lg bg-surface-container-low p-sm text-body-md italic text-on-surface-variant whitespace-pre-wrap">
              &quot;{stored.sourceText}&quot;
            </p>
          </div>
        </details>
      </section>

      {/* Ask YarnMe Section */}
      <section className="mt-xl rounded-xl bg-surface-container-low p-md border border-outline-variant/30">
        <div className="flex items-center gap-2 mb-sm">
          <Sparkles className="text-primary" size={20} />
          <h2 className="text-headline-md font-semibold text-primary">
            {activeCopy.questionTitle}
          </h2>
        </div>
        <p className="mb-md text-body-md text-on-surface-variant">
          {activeCopy.questionBody}
        </p>

        {/* Q&A Chat bubbles */}
        {qaHistory.length > 0 ? (
          <div className="mb-md space-y-3">
            {qaHistory.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-body-md text-on-primary">
                  {item.question}
                </div>
                <div className="mr-auto max-w-[90%] rounded-2xl rounded-tl-sm bg-surface p-3.5 text-body-md text-on-surface shadow-sm border border-outline-variant/30 leading-relaxed">
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {qaError ? (
          <p className="mb-sm text-label-md text-error">{qaError}</p>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askQuestion(followUpQuery);
          }}
          className="relative mb-md"
        >
          <label className="sr-only" htmlFor="follow-up">
            {activeCopy.questionTitle}
          </label>
          <input
            id="follow-up"
            value={followUpQuery}
            onChange={(e) => setFollowUpQuery(e.target.value)}
            disabled={isAsking}
            className="h-14 w-full rounded-xl border border-outline/20 bg-surface px-4 py-2 pr-14 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
            placeholder={activeCopy.questionPlaceholder}
            type="text"
          />
          <button
            type="submit"
            disabled={isAsking || !followUpQuery.trim()}
            aria-label="Send question"
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary transition hover:bg-primary-container disabled:opacity-50"
          >
            {isAsking ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send aria-hidden="true" size={20} />
            )}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {[activeCopy.questionOne, activeCopy.questionTwo].map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => askQuestion(question)}
              disabled={isAsking}
              className="touch-target rounded-full border border-outline/20 bg-surface px-3.5 py-1.5 text-label-sm font-medium text-on-surface transition hover:border-primary hover:bg-primary/5 active:scale-95 disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      {/* Review / Status Action */}
      {hasUncertainties ? (
        <Link
          href="/review"
          className="touch-target mt-lg inline-flex h-14 w-full items-center justify-center rounded-full border-2 border-primary bg-transparent px-lg text-label-lg font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.98]"
        >
          {activeCopy.needsReview}
        </Link>
      ) : (
        <section className="mt-lg flex items-start gap-sm rounded-xl border border-primary/15 bg-primary/5 p-md text-primary">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
          <div>
            <h2 className="text-label-lg font-semibold">{activeCopy.clear}</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {activeCopy.clearBody}
            </p>
          </div>
        </section>
      )}
    </AppShell>
  );
}
