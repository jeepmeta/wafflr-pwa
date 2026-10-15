"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { joinedCountActive } from "@/lib/joined";

export function AppHeader() {
  const pathname = usePathname();
  const inRoom = pathname?.startsWith("/room");
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(joinedCountActive());
    const t = setInterval(() => setCount(joinedCountActive()), 15000);
    return () => clearInterval(t);
  }, [pathname]);

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
        <span className="font-display font-bold text-xl tracking-tight">Wafflr</span>
      </Link>

      <Link href="/rooms" className="pill no-underline text-obsidian flex items-center gap-1.5">
        Your Rooms
        {count > 0 && (
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-syrup text-obsidian text-[10px] font-bold border border-obsidian">
            {count}
          </span>
        )}
      </Link>
    </header>
  );
}
