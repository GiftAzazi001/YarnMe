import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary text-on-primary shadow-sm hover:bg-primary-container active:scale-[0.98]",
    secondary:
      "border-2 border-primary bg-transparent text-primary hover:bg-primary/5 active:scale-[0.98]",
    ghost: "bg-transparent text-primary hover:bg-primary/5 active:scale-[0.98]",
  };

  return (
    <button
      type={type}
      className={`touch-target inline-flex items-center justify-center gap-sm rounded-xl px-lg font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AccentCard({
  children,
  tone = "primary",
  className = "",
}: {
  children: ReactNode;
  tone?: "primary" | "secondary" | "error";
  className?: string;
}) {
  const accent = {
    primary: "bg-primary",
    secondary: "bg-secondary-fixed-dim",
    error: "bg-error",
  };

  return (
    <section
      className={`relative overflow-hidden rounded-xl border border-outline/20 bg-surface shadow-soft ${className}`}
    >
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${accent[tone]}`} />
      {children}
    </section>
  );
}
