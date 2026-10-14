"use client";

interface Props {
  value: string;
  size?: number;
  label?: string;
}

export function QrCode({ value, size = 180, label }: Props) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=8`;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-xl border-3 border-obsidian bg-white p-2 shadow-[0_3px_0_rgba(15,23,42,0.12)]"
        style={{ width: size + 16, height: size + 16 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={size} height={size} alt={label || "Room QR code"} className="block rounded-lg" />
      </div>
      {label && <p className="text-xs text-muted">{label}</p>}
    </div>
  );
}
