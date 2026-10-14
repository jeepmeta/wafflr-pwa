"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const inRoom = pathname?.startsWith("/room");

  function handleLogoClick(e: React.MouseEvent) {
    if (inRoom) {
      const ok = window.confirm("Leave this room and go home?");
      if (!ok) e.preventDefault();
    }
  }

  return (
    <header className="app-header">
      <Link
        href="/"
        onClick={handleLogoClick}
        className="flex items-center gap-2 no-underline text-obsidian"
        aria-label="Wafflr home"
      >
        <span
          className="char-nav"
          style={{ backgroundImage: "url(/characters/butters/nav-head.svg)" }}
          aria-hidden
        />
        <span className="font-display font-bold text-xl tracking-tight">
          Wafflr
        </span>
      </Link>

      <Link href="/rooms" className="pill no-underline text-obsidian">
        Your Rooms
      </Link>
    </header>
  );
}
