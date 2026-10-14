import Image from "next/image";

interface Props {
  size?: number;
  className?: string;
}

/** Official shrug waffle mark from branding-kit */
export function WafflrMark({ size = 64, className = "" }: Props) {
  return (
    <Image
      src="/wafflr-mark.svg"
      alt="Wafflr"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export function WafflrWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-bubble font-bold tracking-tight text-[var(--wafflr-fg-primary)] ${className}`}
      style={{ fontFamily: "var(--font-bubble)" }}
    >
      Wafflr
    </span>
  );
}
