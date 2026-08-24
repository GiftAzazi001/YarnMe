import { Link, usePathname } from "@/lib/navigation";
import { History, MessageSquare, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Yarn", icon: MessageSquare, section: "yarn" },
  { href: "/history", label: "History", icon: History, section: "history" },
  { href: "/settings", label: "Settings", icon: Settings, section: "settings" },
];

function sectionForPath(pathname: string) {
  if (pathname.startsWith("/history")) return "history";
  if (pathname.startsWith("/review")) return "history";
  if (pathname.startsWith("/settings")) return "settings";
  return "yarn";
}

export function BottomNav() {
  const pathname = usePathname();
  const activeSection = sectionForPath(pathname);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/20 bg-surface-container-lowest/95 shadow-sm backdrop-blur"
    >
      <div className="safe-bottom mx-auto flex h-[80px] w-full max-w-[720px] items-center justify-around px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.section === activeSection;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "touch-target flex flex-col items-center justify-center rounded-xl px-4 py-2 transition active:scale-95",
                active
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-primary",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={24} strokeWidth={active ? 2.4 : 2} />
              <span className="mt-1 text-label-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
