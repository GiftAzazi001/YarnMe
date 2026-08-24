"use client";

import { Link } from "@/lib/navigation";
import { FileClock, MessageSquarePlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export function HistoryScreen() {
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
          Your explained notices, documents and messages will appear here in
          Phase 2.
        </p>
        <Link
          href="/"
          className="touch-target mt-xl inline-flex items-center justify-center gap-sm rounded-full bg-primary px-lg text-label-lg font-semibold text-on-primary shadow-soft transition hover:bg-primary-container active:scale-95"
        >
          <MessageSquarePlus aria-hidden="true" size={20} />
          Start a yarn
        </Link>
      </section>
    </AppShell>
  );
}
