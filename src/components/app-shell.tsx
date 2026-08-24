import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";

type AppShellProps = {
  children: ReactNode;
  header?: "brand" | "compact" | "none";
  className?: string;
};

export function AppShell({
  children,
  header = "brand",
  className = "",
}: AppShellProps) {
  return (
    <div className={`min-h-dvh bg-background pb-[104px] ${className}`}>
      {header !== "none" ? (
        <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur">
          <div
            className={[
              "mx-auto flex w-full max-w-[720px] items-center px-container-margin py-md",
              header === "brand" ? "justify-center" : "justify-start",
            ].join(" ")}
          >
            <Logo compact={header === "compact"} centered={header === "brand"} />
          </div>
        </header>
      ) : null}

      <main className="mx-auto w-full max-w-[720px] px-container-margin">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
