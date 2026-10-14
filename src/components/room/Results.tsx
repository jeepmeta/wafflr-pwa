"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Room } from "@/lib/rooms";
import { isTieTop, rankedCards } from "@/lib/rooms";

interface Props {
  room: Room;
  onBreakTie?: (winnerId: string) => void;
}

function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const colors = ["#F59E0B", "#FCD34D", "#EF4444", "#10B981", "#EC4899", "#3B82F6"];
    const particles = Array.from({ length: 80 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 40,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      g: 0.28 + Math.random() * 0.12,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.008;
        if (p.life <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (alive && frame < 180) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40" aria-hidden />;
}

export function Results({ room, onBreakTie }: Props) {
  const ranked = rankedCards(room);
  const tie = isTieTop(room);
  const winner = ranked[0];

  if (tie && ranked.length >= 2 && onBreakTie) {
    const a = ranked[0];
    const b = ranked[1];
    return (
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto items-center">
        <div
          className="char-frame mb-3"
          style={{
            width: 140,
            height: 140,
            backgroundImage: "url(/characters/eggin-targarian/referee.svg)",
          }}
        />
        <h2 className="font-display font-bold text-2xl mb-1">Sudden death!</h2>
        <p className="text-muted text-sm mb-6 text-center">Tie on top — tap your pick once</p>
        <div className="grid grid-cols-2 gap-3 w-full">
          {[a, b].map((c) => (
            <button key={c.id} type="button" className="tile" onClick={() => onBreakTie(c.id)}>
              <span className="font-display font-bold block">{c.name}</span>
              {c.detail && <span className="text-xs text-muted block mt-1">{c.detail}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto items-center relative">
      <ConfettiCanvas />
      <div
        className="char-frame mb-2"
        style={{
          width: 120,
          height: 120,
          backgroundImage: "url(/characters/butters/victory-sheet.svg)",
          backgroundSize: "960px 120px",
        }}
      />
      <div
        className="char-frame mb-3"
        style={{ width: 72, height: 72, backgroundImage: "url(/characters/oj/idle.svg)" }}
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-syrup mb-1">Winner</p>
      <h2 className="font-display font-bold text-3xl text-center mb-1">{winner?.name}</h2>
      {winner?.detail && <p className="text-muted text-sm text-center mb-4">{winner.detail}</p>}
      {winner && (
        <p className="text-sm font-semibold mb-6">
          {winner.yum} yum · {winner.nah} nah
        </p>
      )}
      <div className="w-full card mb-6">
        <p className="font-display font-semibold text-sm mb-3">Rankings</p>
        <ol className="list-none p-0 m-0 flex flex-col gap-2">
          {ranked.map((c, i) => (
            <li key={c.id} className="flex justify-between items-center text-sm gap-2">
              <span>
                <span className="font-bold text-muted mr-2">{i + 1}.</span>
                {c.name}
              </span>
              <span className="text-xs text-muted whitespace-nowrap">
                {c.yum - c.nah >= 0 ? "+" : ""}
                {c.yum - c.nah}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Link href="/create" className="btn-primary no-underline w-full text-center">
          Start new room
        </Link>
        <Link href="/rooms" className="btn-ghost no-underline w-full text-center">
          Back to rooms
        </Link>
      </div>
    </div>
  );
}
