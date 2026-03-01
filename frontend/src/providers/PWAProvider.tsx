"use client";

import { useEffect } from "react";
import { initSyncListeners } from "@/lib/sync-service";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";

export const PWAInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    initSyncListeners();
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
    </>
  );
};
