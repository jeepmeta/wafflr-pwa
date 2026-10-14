"use client";

import Link from "next/link";
import { Wheel } from "@/components/Wheel";
import { EAT_CATALOG } from "@/lib/catalogs";

export default function EatPage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="screen-pad pt-6 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="btn-ghost text-sm px-3"
          aria-label="Back home"
        >
          ←
        </Link>
        <div>
          <h1
            className="text-xl font-bold text-[var(--wafflr-fg-primary)]"
            style={{ fontFamily: "var(--font-bubble)" }}
          >
            Where to eat
          </h1>
          <p className="text-sm text-[var(--wafflr-fg-secondary)]">Spin for dinner</p>
        </div>
      </header>

      <section className="screen-pad flex-1 flex flex-col justify-center pb-12">
        <Wheel items={EAT_CATALOG} />
      </section>
    </main>
  );
}
