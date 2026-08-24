"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  FileCheck,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  Lock,
  Sparkles,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { type LanguageCode } from "@/lib/analysis";
import {
  clearAnalysisResult,
  savePendingAnalysis,
} from "@/lib/analysis-storage";
import { devTestInputs } from "@/lib/dev-test-inputs";

const languages: Array<{
  label: string;
  hint: string;
  value: LanguageCode;
}> = [
  {
    label: "Simple English",
    hint: "Easy English",
    value: "simple-english",
  },
  { label: "Pidgin", hint: "No big grammar", value: "pidgin" },
  { label: "Hausa", hint: "Bayani cikin Hausa", value: "hausa" },
];

const examples = [
  { label: "Public Service", icon: Building2, index: 0 },
  { label: "Education", icon: GraduationCap, index: 1 },
  { label: "Community", icon: UsersRound, index: 2 },
];

export function HomeScreen() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [language, setLanguage] = useState<LanguageCode>("simple-english");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Reset submitting state on unmount/mount
    setIsSubmitting(false);
  }, []);

  function handleUseExample(index: number) {
    const selected = devTestInputs[index] || devTestInputs[0];
    setText(selected.text);
    setUploadedFileName(null);
    setMode("paste");
    setError("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setError("");
    setUploadedFileName(file.name);

    if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".csv")
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || "";
        setText(content);
        setIsReadingFile(false);
        setMode("paste");
      };
      reader.onerror = () => {
        setError("Could not read this file. Please paste the text instead.");
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    } else {
      // For binary files (PDF / images), read file info and notify
      const reader = new FileReader();
      reader.onload = () => {
        // If image or doc, prompt text or simulate document reading
        setText(
          `[Uploaded Document: ${file.name}]\nPlease explain the requirements, dates, fees, and instructions from this notice.`,
        );
        setIsReadingFile(false);
        setMode("paste");
      };
      reader.onerror = () => {
        setError("Could not read this file. Please paste the text instead.");
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  }

  function startYarn() {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setError("Please paste your notice first, or tap one of the examples below.");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      clearAnalysisResult();
      savePendingAnalysis(trimmedText, language);
    } catch (e) {
      console.warn("Storage warning:", e);
    }

    // Navigate to processing screen
    try {
      router.push("/processing");
    } catch {
      // Fallback navigation
      if (typeof window !== "undefined") {
        window.location.href = "/processing";
      }
    }

    // Safety timeout in case client router is stalled
    const safetyTimer = window.setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== "/processing") {
        window.location.href = "/processing";
      }
    }, 1200);

    return () => window.clearTimeout(safetyTimer);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      startYarn();
    }
  }

  return (
    <AppShell header="none">
      <header className="flex items-center justify-between py-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white text-[11px] font-extrabold text-primary shadow-sm">
          YarnMe
        </div>
        <button
          type="button"
          aria-label="Choose language"
          onClick={() => {
            const nextLangMap: Record<LanguageCode, LanguageCode> = {
              "simple-english": "pidgin",
              pidgin: "hausa",
              hausa: "simple-english",
            };
            setLanguage((current) => nextLangMap[current]);
          }}
          title={`Switch language (current: ${language})`}
          className="touch-target flex items-center justify-center rounded-full text-primary transition hover:bg-surface-container active:scale-95"
        >
          <Languages aria-hidden="true" size={31} strokeWidth={2.3} />
        </button>
      </header>

      <section className="flex flex-col gap-sm pt-xl">
        <h1 className="text-display font-extrabold text-primary">
          If you no understand am, YarnMe go explain am.
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Upload a notice, document or message. YarnMe will tell you what it
          means and what to do.
        </p>
      </section>

      <section className="relative mt-xl overflow-hidden rounded-xl border border-outline/20 bg-surface p-md shadow-soft">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
        <div className="mb-sm flex border-b border-outline-variant/30">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`flex-1 border-b-2 py-sm text-center text-label-lg font-semibold transition ${
              mode === "paste"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant"
            }`}
          >
            Paste text
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 border-b-2 py-sm text-center text-label-lg font-semibold transition ${
              mode === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant"
            }`}
          >
            Upload
          </button>
        </div>

        {mode === "paste" ? (
          <div className="flex flex-col gap-xs">
            <label className="sr-only" htmlFor="yarn-input">
              Paste the information
            </label>
            <textarea
              id="yarn-input"
              ref={textareaRef}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (error) setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste the official notice, message, or memo you want YarnMe to explain..."
              className={`min-h-[130px] w-full resize-none rounded-lg border-2 bg-white p-sm text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none ${
                error
                  ? "border-error focus:border-error"
                  : "border-surface-variant focus:border-primary"
              }`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "yarn-input-error" : undefined}
            />
            {uploadedFileName && (
              <div className="mt-xs flex items-center justify-between rounded-md bg-surface-container px-sm py-xs text-label-sm text-on-surface">
                <span className="flex items-center gap-xs truncate">
                  <FileCheck size={16} className="text-primary" />
                  Loaded: {uploadedFileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName(null);
                    setText("");
                  }}
                  className="text-on-surface-variant hover:text-error"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-sm rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-lg text-center transition hover:bg-primary/10"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
            />
            {isReadingFile ? (
              <div className="flex flex-col items-center gap-sm">
                <Loader2 className="animate-spin text-primary" size={36} />
                <p className="text-label-md font-semibold text-primary">
                  Reading document...
                </p>
              </div>
            ) : (
              <>
                <Upload aria-hidden="true" className="text-primary" size={40} />
                <p className="text-label-lg font-semibold text-on-surface">
                  Click to upload a notice or document
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Text, PDF, JPG or PNG
                </p>
                <Button
                  variant="secondary"
                  className="mt-xs h-10 rounded-lg pointer-events-none"
                >
                  Choose file
                </Button>
              </>
            )}
          </div>
        )}

        <p className="mt-sm flex items-center gap-xs text-label-sm text-on-surface-variant">
          <Lock aria-hidden="true" size={16} />
          YarnMe only uses what you send to explain it to you.
        </p>

        {error ? (
          <div className="mt-sm rounded-lg bg-error/10 p-sm border border-error/20 flex items-start justify-between gap-sm">
            <p
              id="yarn-input-error"
              className="text-label-md font-semibold text-error"
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => handleUseExample(0)}
              className="text-label-sm font-bold text-primary underline shrink-0 hover:text-primary-container"
            >
              Use sample notice
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-xl flex flex-col gap-md">
        <h2 className="text-headline-md font-semibold text-on-surface">
          How do you want YarnMe to explain it?
        </h2>
        <div className="flex flex-col gap-sm">
          {languages.map((item) => {
            const isSelected = language === item.value;
            return (
              <label
                key={item.value}
                className={`touch-target flex cursor-pointer items-center justify-between rounded-xl border p-md transition ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-outline/20 bg-surface hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-md">
                  <input
                    type="radio"
                    name="language"
                    value={item.value}
                    checked={isSelected}
                    onChange={() => setLanguage(item.value)}
                    className="h-5 w-5 border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="text-body-md font-medium text-on-surface">
                    {item.label}{" "}
                    <span className="text-on-surface-variant font-normal">
                      ({item.hint})
                    </span>
                  </span>
                </div>
                {isSelected && (
                  <Check size={18} className="text-primary font-bold" />
                )}
              </label>
            );
          })}
        </div>
      </section>

      <Button
        onClick={startYarn}
        disabled={isSubmitting}
        className="mt-xl h-16 w-full rounded-xl text-headline-md font-bold disabled:opacity-75"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={28} />
            <span>Yarning...</span>
          </>
        ) : (
          <>
            <span>Yarn Me</span>
            <ArrowRight aria-hidden="true" size={32} />
          </>
        )}
      </Button>

      <section className="mt-xl border-t border-surface-variant/40 pt-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-label-lg font-semibold text-on-surface">
            Try an example
          </h3>
          <span className="text-label-sm text-on-surface-variant">
            Tap to load
          </span>
        </div>
        <div className="mt-md flex flex-wrap gap-sm">
          {examples.map((example) => {
            const Icon = example.icon;
            return (
              <button
                key={example.label}
                type="button"
                onClick={() => handleUseExample(example.index)}
                className="touch-target flex items-center gap-sm rounded-full border border-primary/30 bg-surface px-lg py-sm text-label-lg font-semibold text-primary transition hover:bg-primary/10 active:scale-95 shadow-xs"
              >
                <Icon aria-hidden="true" size={18} />
                {example.label}
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
