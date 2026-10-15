"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  size?: number;
  label?: string;
}

/**
 * Local QR via dynamic `qrcode` package (no third-party URL leak).
 * Falls back to a large code display if the lib is not installed yet.
 */
export function QrCode({ value, size = 160, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    void (async () => {
      try {
        const QR = await import("qrcode");
        if (cancelled || !canvasRef.current) return;
        await QR.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: "#2D3748", light: "#FFF7F2" },
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className="flex flex-col items-center justify-center border-3 border-obsidian rounded-xl bg-cream p-4"
        style={{ width: size, height: size }}
        role="img"
        aria-label={label || `QR for ${value}`}
      >
        <p className="font-display font-bold text-sm text-center break-all">{value}</p>
        <p className="text-[10px] text-muted mt-2">Install `qrcode` for scannable image</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-xl border-3 border-obsidian bg-cream"
        aria-label={label || `QR code for ${value}`}
      />
      {label && <p className="text-xs text-muted">{label}</p>}
    </div>
  );
}
