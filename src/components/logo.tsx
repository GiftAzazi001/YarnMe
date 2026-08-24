type LogoProps = {
  compact?: boolean;
  centered?: boolean;
};

export function Logo({ compact = false, centered = false }: LogoProps) {
  return (
    <div
      className={[
        "font-extrabold text-primary",
        compact ? "text-[14px] leading-none" : "text-display",
        centered ? "text-center" : "",
      ].join(" ")}
      aria-label="YarnMe"
    >
      YarnMe
    </div>
  );
}
