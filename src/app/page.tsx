import { WafflrMark, WafflrWordmark } from "@/components/WafflrMark";
import { ModeCard } from "@/components/home/ModeCard";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col">
      {/* Hero */}
      <header className="screen-pad pt-10 pb-8 flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-3">
          <WafflrMark size={56} />
          <WafflrWordmark className="text-3xl" />
        </div>
        <p className="text-[var(--wafflr-fg-secondary)] text-base max-w-xs leading-relaxed">
          Decide faster. Fair, fun, and done in under a minute.
        </p>
      </header>

      {/* Mode grid — extensible templates */}
      <section className="screen-pad flex-1 pb-12">
        <h1 className="sr-only">Choose a decision mode</h1>
        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
          <ModeCard
            href="/eat"
            emoji="🍽️"
            title="Where to eat"
            description="Pick dinner without the debate"
            accent="primary"
          />
          <ModeCard
            href="/watch"
            emoji="🎬"
            title="What to watch"
            description="Movie night, no veto wars"
            accent="accent"
          />
          {/* Future templates slot here — same ModeCard + catalog pattern */}
        </div>

        <p className="mt-10 text-center text-xs text-[var(--wafflr-fg-tertiary)]">
          Solo wheel · more modes coming
        </p>
      </section>
    </main>
  );
}
