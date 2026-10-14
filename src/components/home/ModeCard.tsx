"use client";

import Link from "next/link";

interface ModeCardProps {
  href: string;
  emoji: string;
  title: string;
  description: string;
  accent?: "primary" | "accent" | "success";
}

const accentMap = {
  primary: "border-[var(--wafflr-fill-primary)]/30 hover:border-[var(--wafflr-fill-primary)]",
  accent: "border-[var(--wafflr-fill-accent)]/30 hover:border-[var(--wafflr-fill-accent)]",
  success: "border-[var(--wafflr-fill-success)]/30 hover:border-[var(--wafflr-fill-success)]",
};

export function ModeCard({ href, emoji, title, description, accent = "primary" }: ModeCardProps) {
  return (
    <Link
      href={href}
      className={`
        card flex flex-col gap-3 transition-all duration-200
        active:scale-[0.98] hover:shadow-lg
        border-2 ${accentMap[accent]}
      `}
    >
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <div>
        <h2
          className="text-lg font-semibold text-[var(--wafflr-fg-primary)]"
          style={{ fontFamily: "var(--font-bubble)" }}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--wafflr-fg-secondary)]">{description}</p>
      </div>
    </Link>
  );
}
