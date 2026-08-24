"use client";

import { useState } from "react";
import { Check, Globe2, Languages, Megaphone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { type LanguageCode } from "@/lib/analysis";
import { useYarnContext } from "@/lib/yarn-context";

const languageOptions: Array<{
  label: string;
  value: LanguageCode;
  icon: typeof Globe2;
  color: string;
}> = [
  { label: "Simple English", value: "simple-english", icon: Globe2, color: "text-primary" },
  { label: "Pidgin", value: "pidgin", icon: Megaphone, color: "text-secondary" },
  { label: "Hausa", value: "hausa", icon: Languages, color: "text-tertiary" },
];

const textSizes = [
  { label: "A-", caption: "Small", value: "small" },
  { label: "A", caption: "Default", value: "default" },
  { label: "A+", caption: "Large", value: "large" },
];

export function SettingsScreen() {
  const { language, setLanguage } = useYarnContext();
  const [textSize, setTextSize] = useState("default");
  const [autoPlay, setAutoPlay] = useState(false);

  return (
    <AppShell header="brand">
      <section className="pt-md pb-xl">
        <h1 className="mb-xs text-headline-lg font-bold text-primary">
          Settings
        </h1>
        <p className="mb-lg text-body-md text-on-surface-variant">
          Customize how YarnMe explains documents for you.
        </p>

        <div className="rounded-2xl border border-outline/15 bg-surface p-lg shadow-soft">
          <h2 className="text-label-lg font-bold text-on-surface mb-xs">
            Default explanation language
          </h2>
          <p className="mb-md text-body-md text-on-surface-variant">
            Choose your preferred language for explanations.
          </p>

          <div className="space-y-sm">
            {languageOptions.map((option) => {
              const Icon = option.icon;
              const checked = language === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex min-h-[56px] cursor-pointer items-center justify-between rounded-xl border p-md transition ${
                    checked
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-outline/15 hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-sm">
                    <Icon
                      aria-hidden="true"
                      className={option.color}
                      size={24}
                    />
                    <span className="text-label-lg font-semibold text-on-surface">
                      {option.label}
                    </span>
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      checked
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline"
                    }`}
                  >
                    {checked ? <Check size={14} className="stroke-[3]" /> : null}
                  </span>
                  <input
                    className="sr-only"
                    type="radio"
                    name="default-language"
                    checked={checked}
                    onChange={() => setLanguage(option.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        <hr className="my-xl border-outline-variant/20" />

        <div className="rounded-2xl border border-outline/15 bg-surface p-lg shadow-soft">
          <h2 className="text-label-lg font-bold text-on-surface mb-xs">
            Text size
          </h2>
          <p className="mb-md text-body-md text-on-surface-variant">
            Adjust the reading font size.
          </p>

          <div className="grid grid-cols-3 gap-sm">
            {textSizes.map((size) => {
              const active = textSize === size.value;

              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setTextSize(size.value)}
                  aria-pressed={active}
                  className={`min-h-[76px] rounded-xl border p-sm text-center transition ${
                    active
                      ? "border-2 border-primary bg-primary/5 text-primary shadow-xs"
                      : "border-outline/15 text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="block text-label-lg font-bold">
                    {size.label}
                  </span>
                  <span
                    className={`mt-xs block text-sm ${
                      active ? "text-primary font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    {size.caption}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="my-xl border-outline-variant/20" />

        <div className="flex min-h-[100px] items-center justify-between gap-md rounded-2xl border border-outline/15 bg-surface p-lg shadow-soft">
          <div>
            <h3 className="text-label-lg font-semibold text-on-surface">
              Play explanations automatically
            </h3>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Read aloud explanations when loaded.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoPlay}
            onClick={() => setAutoPlay((current) => !current)}
            className={`relative h-9 w-[58px] shrink-0 rounded-full transition ${
              autoPlay ? "bg-primary" : "bg-surface-container-highest"
            }`}
          >
            <span
              className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition ${
                autoPlay ? "left-[27px] text-primary" : "left-1 text-transparent"
              }`}
            >
              <Check aria-hidden="true" size={16} strokeWidth={3} />
            </span>
          </button>
        </div>
      </section>
    </AppShell>
  );
}
