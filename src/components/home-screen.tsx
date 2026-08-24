"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Languages,
  Lock,
  Upload,
  UsersRound,
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
  { label: "Public Service", icon: Building2 },
  { label: "Education", icon: GraduationCap },
  { label: "Community", icon: UsersRound },
];

export function HomeScreen() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [language, setLanguage] = useState<LanguageCode>("simple-english");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function startYarn() {
    const trimmedText = text.trim();

    if (mode === "upload") {
      setError("For now, paste text first. Upload will come later.");
      return;
    }

    if (!trimmedText) {
      setError("Paste some text first so YarnMe can explain it.");
      return;
    }

    clearAnalysisResult();
    savePendingAnalysis(trimmedText, language);
    router.push("/processing");
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
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (error) setError("");
              }}
              placeholder="Paste the information you want YarnMe to explain..."
              className="min-h-[120px] w-full resize-none rounded-lg border-2 border-surface-variant bg-white p-sm text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-0"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "yarn-input-error" : undefined}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-sm rounded-lg border-2 border-dashed border-surface-variant bg-white p-lg text-center">
            <Upload aria-hidden="true" className="text-outline" size={40} />
            <p className="text-label-lg font-semibold text-on-surface">
              Upload a notice, document or image
            </p>
            <p className="text-label-sm text-on-surface-variant">
              PDF, JPG or PNG
            </p>
            <Button variant="secondary" className="mt-xs h-12 rounded-lg">
              Choose file
            </Button>
          </div>
        )}

        <p className="mt-sm flex items-center gap-xs text-label-sm text-on-surface-variant">
          <Lock aria-hidden="true" size={16} />
          YarnMe only uses what you send to explain it to you.
        </p>
        {error ? (
          <p
            id="yarn-input-error"
            className="mt-sm text-label-lg font-semibold text-error"
          >
            {error}
          </p>
        ) : null}
      </section>

      <section className="mt-xl flex flex-col gap-md">
        <h2 className="text-headline-md font-semibold text-on-surface">
          How do you want YarnMe to explain it?
        </h2>
        <div className="flex flex-col gap-sm">
          {languages.map((item) => (
            <label
              key={item.value}
              className="touch-target flex cursor-pointer items-center gap-md rounded-xl border border-outline/20 bg-surface p-md transition hover:bg-surface-container-low"
            >
              <input
                type="radio"
                name="language"
                value={item.value}
                checked={language === item.value}
                onChange={() => setLanguage(item.value)}
                className="h-5 w-5 border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-body-md text-on-surface">
                {item.label}{" "}
                <span className="text-on-surface-variant">({item.hint})</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <Button
        onClick={startYarn}
        className="mt-xl h-16 w-full rounded-xl text-headline-md font-bold"
      >
        Yarn Me
        <ArrowRight aria-hidden="true" size={32} />
      </Button>

      <section className="mt-xl border-t border-surface-variant/40 pt-lg">
        <h3 className="text-label-lg font-semibold text-on-surface">
          Try an example
        </h3>
        <div className="mt-md flex flex-wrap gap-sm">
          {examples.map((example, index) => {
            const Icon = example.icon;
            const testInput = devTestInputs[index];

            return (
              <button
                key={example.label}
                type="button"
                onClick={() => {
                  setText(testInput.text);
                  setMode("paste");
                  setError("");
                }}
                className="touch-target flex items-center gap-sm rounded-full border border-outline-variant/50 bg-surface px-lg py-sm text-label-lg font-semibold text-primary transition hover:bg-primary/5"
              >
                <Icon aria-hidden="true" size={20} />
                {example.label}
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
