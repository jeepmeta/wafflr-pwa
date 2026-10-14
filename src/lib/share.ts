/**
 * Share helpers — native share sheet + clipboard fallback + canvas share card.
 */

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export function roomShareUrl(code: string): string {
  if (typeof window === "undefined") return `/room/${code}`;
  return `${window.location.origin}/room/${code}`;
}

export function resultsSharePayload(input: {
  code: string;
  roomTitle: string;
  winnerName: string;
  yum?: number;
  nah?: number;
}): SharePayload {
  const url = roomShareUrl(input.code);
  const score =
    typeof input.yum === "number"
      ? ` (${input.yum} yum${typeof input.nah === "number" ? ` · ${input.nah} nah` : ""})`
      : "";
  return {
    title: "Wafflr results",
    text: `We picked “${input.winnerName}”${score} on Wafflr — “${input.roomTitle}”. Code ${input.code}. Stop waffling!`,
    url,
  };
}

/** navigator.share when available; otherwise copy text+url. */
export async function shareNative(payload: SharePayload): Promise<"shared" | "copied" | "dismissed"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return "shared";
    } catch (e) {
      // User cancelled
      if (e instanceof DOMException && e.name === "AbortError") return "dismissed";
    }
  }
  const blob = `${payload.text}\n${payload.url}`;
  try {
    await navigator.clipboard.writeText(blob);
    return "copied";
  } catch {
    return "dismissed";
  }
}

/**
 * Draw a simple branded share card (PNG blob) for files share / download.
 * Cream canvas, syrup accent, winner + code.
 */
export async function buildResultsShareCard(input: {
  code: string;
  roomTitle: string;
  winnerName: string;
  yum?: number;
  nah?: number;
}): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const w = 720;
  const h = 900;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // cream bg
  ctx.fillStyle = "#FFFBEB";
  ctx.fillRect(0, 0, w, h);

  // syrup top bar
  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(0, 0, w, 16);

  // border
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WAFFLR", w / 2, 90);

  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("Stop waffling. Start living.", w / 2, 140);

  // winner card block
  roundRect(ctx, 60, 200, w - 120, 320, 28);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("WINNER", w / 2, 260);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 48px system-ui, sans-serif";
  const name = truncate(ctx, input.winnerName, w - 160);
  ctx.fillText(name, w / 2, 340);

  if (typeof input.yum === "number") {
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText(
      `${input.yum} yum · ${input.nah ?? 0} nah`,
      w / 2,
      400
    );
  }

  ctx.fillStyle = "#0F172A";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText(truncate(ctx, input.roomTitle, w - 120), w / 2, 580);

  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText(input.code.toUpperCase(), w / 2, 680);

  ctx.font = "22px system-ui, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("wafflr.app · join with code", w / 2, 780);

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function shareResultsWithCard(input: {
  code: string;
  roomTitle: string;
  winnerName: string;
  yum?: number;
  nah?: number;
}): Promise<"shared" | "copied" | "dismissed"> {
  const payload = resultsSharePayload(input);
  const blob = await buildResultsShareCard(input);

  if (
    blob &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    const file = new File([blob], `wafflr-${input.code}.png`, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: payload.title,
          text: payload.text,
        });
        return "shared";
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return "dismissed";
      }
    }
  }

  return shareNative(payload);
}
