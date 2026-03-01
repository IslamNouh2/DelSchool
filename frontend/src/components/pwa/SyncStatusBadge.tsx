"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CloudOff } from "lucide-react";

export const SyncStatusBadge = ({ id, isPending }: { id: string | number, isPending: boolean }) => {
  if (!isPending) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center justify-center rounded-full bg-amber-100 p-1 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <CloudOff className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Pending Sync (Local Only)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
