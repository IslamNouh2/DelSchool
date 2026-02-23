"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslations } from "next-intl";
import React from "react";

export function GlobalBreadcrumb() {
  const t = useTranslations("menu");
  const pathname = usePathname();
  const segments = pathname.split("/").filter((item) => item !== "");

  // Don't show breadcrumb on dashboard home or login
  if (pathname === "/" || pathname === "/login" || segments.length === 0) {
    return null;
  }

  // Filter out the locale segment (first segment if it matches a locale)
  const locales = ["en", "ar", "fr"];
  const breadcrumbSegments = locales.includes(segments[0]) ? segments.slice(1) : segments;

  return (
    <Breadcrumb className="hidden md:flex mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{t("dashboard")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbSegments.map((segment, index) => {
          const href = `/${breadcrumbSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === breadcrumbSegments.length - 1;
          
          // Try to translate the segment using the 'menu' namespace
          // If not found, fallback to capitalized segment
          let title = segment;
          try {
            // Check if it's a known menu key
            title = t(segment as any);
          } catch (e) {
            title = segment.charAt(0).toUpperCase() + segment.slice(1);
          }

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
