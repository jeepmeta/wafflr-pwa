"use client";

import { useCallback, useRef, useState } from "react";
import type { CatalogItem } from "@/lib/catalogs";

interface WheelProps {
  items: CatalogItem[];
  onWinner?: (item: CatalogItem) => void;
}

const SEGMENT_COLORS = [
  "var(--brand-amber-500)",
  "var(--brand-amber-400)",
  "var(--brand-emerald-500)",
  "var(--brand-pink-500)",
  "var(--brand-amber-600)",
  "var(--brand-emerald-400)",
  "var(--brand-pink-400)",
  "var(--brand-amber-300)",
];

export function Wheel({ items, onWinner }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<CatalogItem | null>(null);
  const animRef = useRef<number | null>(null);

  const spin = useCallback(() => {
    if (spinning || items.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const n = items.length;
    const segment = 360 / n;
    const targetIndex = Math.floor(Math.random() * n);
    const extraTurns = 4 + Math.floor(Math.random() * 3);
    const targetAngle =
      extraTurns * 360 + (360 - (targetIndex * segment + segment / 2));

    const start = rotation % 360;
    const delta = targetAngle - start;
    const duration = 4200;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = start + delta * eased;
      setRotation(current);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setSpinning(false);
        const landed = items[targetIndex];
        setWinner(landed);
        onWinner?.(landed);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [spinning, items, rotation, onWinner]);

  const n = items.length;
  const segment = 360 / Math.max(n, 1);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="relative w-[min(86vw,320px)] aspect-square">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 z-20 w-0 h-0"
          style={{
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "20px solid var(--wafflr-fill-primary)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        />
        <div
          className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--wafflr-border-strong)] shadow-xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "none" : "transform 0.2s ease-out",
            background: `conic-gradient(${items
              .map((_, i) => {
                const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                const start = i * segment;
                const end = (i + 1) * segment;
                return `${color} ${start}deg ${end}deg`;
              })
              .join(", ")})`,
          }}
        >
          {items.map((item, i) => {
            const angle = i * segment + segment / 2;
            return (
              <div
                key={item.id}
                className="absolute left-1/2 top-1/2 origin-left text-[10px] sm:text-xs font-semibold text-[var(--brand-slate-900)] whitespace-nowrap max-w-[42%] truncate px-1"
                style={{
                  transform: `rotate(${angle}deg) translate(28%, -50%)`,
                }}
              >
                {item.title}
              </div>
            );
          })}
        </div>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center z-10 border-2 border-[var(--wafflr-border-strong)]"
          style={{ background: "var(--wafflr-bg-elevated)" }}
        >
          <span className="text-xl">🧇</span>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary w-full max-w-xs"
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? "Spinning…" : "Spin the Wheel"}
      </button>

      {winner && (
        <div
          className="card w-full text-center border-2 border-[var(--wafflr-fill-success)]"
          style={{ background: "var(--wafflr-fill-success-muted)" }}
        >
          <p className="text-sm text-[var(--wafflr-fg-secondary)] mb-1">Winner</p>
          <p
            className="text-xl font-bold text-[var(--wafflr-fg-primary)]"
            style={{ fontFamily: "var(--font-bubble)" }}
          >
            {winner.title}
          </p>
          {winner.subtitle && (
            <p className="text-sm text-[var(--wafflr-fg-secondary)] mt-1">{winner.subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
