"use client";

import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ConnectivityIndicator = () => {
    const isOnline = useOfflineStatus();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                        isOnline 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                    }`}>
                        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {isOnline ? "Online" : "Offline Mode"}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isOnline ? "Connected to server" : "Running in offline mode. Changes will sync when online."}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
