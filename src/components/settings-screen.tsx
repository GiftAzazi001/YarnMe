"use client";

import { useState } from "react";
import { Check, Globe2, Languages, Megaphone } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const languageOptions = [
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
  const [language, setLanguage] = useState("pidgin");
  const [textSize, setTextSize] = useState("default");
  const [autoPlay, setAutoPlay] = useState(true);

  return (
    <AppShell header="brand">
      <section className="pt-xl">
        <h1 className="mb-md text-headline-lg font-bold text-primary">
          Language
        </h1>
        <div className="rounded-xl border border-surface-dim bg-surface p-lg shadow-soft">
          <p className="mb-md text-body-md text-on-surface-variant">
            Default explanation language.
          </p>
          <div className="space-y-sm">
            {languageOptions.map((option) => {
              const Icon = option.icon;
              const checked = language === option.value;

              return (
                <label
                  key={option.value}
                  className="flex min-h-[56px] cursor-pointer items-center justify-between rounded-lg border border-surface-dim p-md transition hover:bg-surface-container"
                >
                  <div className="flex items-center gap-sm">
                    <Icon
                      aria-hidden="true"
                      className={option.color}
                      size={28}
                    />
                    <span className="text-label-lg font-semibold">
                      {option.label}
                    </span>
                  </div>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                      checked
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline"
                    }`}
                  >
                    {checked ? <span className="h-2.5 w-2.5 rounded-full bg-on-primary" /> : null}
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
      </section>

      <hr className="my-xl border-outline-variant/20" />

      <section>
        <h2 className="mb-md text-headline-lg font-bold text-primary">
          Text size
        </h2>
        <div className="rounded-xl border border-surface-dim bg-surface p-lg shadow-soft">
          <div className="grid grid-cols-3 gap-sm">
            {textSizes.map((size) => {
              const active = textSize === size.value;

              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setTextSize(size.value)}
                  aria-pressed={active}
                  className={`min-h-[82px] rounded-lg border p-sm text-center transition ${
                    active
                      ? "border-2 border-primary bg-primary/5 text-primary"
                      : "border-surface-dim text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="block text-label-lg font-bold">
                    {size.label}
                  </span>
                  <span
                    className={`mt-xs block text-sm ${
                      active ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {size.caption}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="my-xl border-outline-variant/20" />

      <section className="pb-xl">
        <h2 className="mb-md text-headline-lg font-bold text-primary">Audio</h2>
        <div className="flex min-h-[112px] items-center justify-between gap-md rounded-xl border border-surface-dim bg-surface p-lg shadow-soft">
          <div>
            <h3 className="text-label-lg font-semibold text-on-surface">
              Play explanations automatically
            </h3>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Automatically read YarnMe explanations aloud when available.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoPlay}
            onClick={() => setAutoPlay((current) => !current)}
            className={`relative h-10 w-[64px] shrink-0 rounded-full transition ${
              autoPlay ? "bg-primary" : "bg-surface-dim"
            }`}
          >
            <span
              className={`absolute top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition ${
                autoPlay ? "left-[28px] text-primary" : "left-1 text-transparent"
              }`}
            >
              <Check aria-hidden="true" size={19} strokeWidth={3} />
            </span>
          </button>
        </div>
      </section>
    </AppShell>
  );
}
