"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

const locales = [
  { code: "ar", label: "العربية", flag: "🇩🇿" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const { isMobile, setOpenMobile, state } = useSidebar();

  const isCollapsed = state === "collapsed";
  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    // Close the mobile sidebar sheet after switching language
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 px-2 hover:bg-accent hover:text-accent-foreground",
            isCollapsed && "!w-8 !p-2 justify-center"
          )}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px]">
            {currentLocale.flag}
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-start text-sm font-medium truncate">
                {currentLocale.label}
              </span>
              <Languages className="h-4 w-4 opacity-50 shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRtl ? "start" : "end"}
        side={isCollapsed ? "right" : undefined}
        className="w-[180px]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {locales.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => handleLocaleChange(l.code)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  locale === l.code && "bg-accent"
                )}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {locale === l.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </motion.div>
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
