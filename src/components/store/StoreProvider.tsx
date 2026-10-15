"use client";

import { useEffect } from "react";
import { initStoreBilling } from "@/lib/iap";

/** Mount once in the client tree to restore IAP entitlements in native shells. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void initStoreBilling();
  }, []);
  return <>{children}</>;
}
