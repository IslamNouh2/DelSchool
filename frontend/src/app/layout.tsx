import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

// Load Inter with best practices
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter", // optional but recommended for Tailwind
});

export const metadata: Metadata = {
  title: "Clean School App",
  description: "Secure and modern school management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* <Toaster richColors position="top-right" /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
