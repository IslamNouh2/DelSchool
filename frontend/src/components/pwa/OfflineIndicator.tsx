import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { OfflineDB } from "@/lib/db";

export const OfflineIndicator = () => {
  const isOnline = useOfflineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';
      const pending = await OfflineDB.getSyncQueue(tenantId);
      setPendingCount(pending.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-[9999] flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300 ${
      !isOnline 
        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    }`}>
      {!isOnline ? (
        <WifiOff className="h-4 w-4" />
      ) : (
        <RefreshCw className="h-4 w-4 animate-spin" />
      )}
      <span>
        {!isOnline 
          ? "You are currently offline" 
          : `Syncing ${pendingCount} change${pendingCount > 1 ? 's' : ''}...`}
      </span>
    </div>
  );
};
