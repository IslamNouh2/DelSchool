import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/providers/SocketProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { PWAInitializer } from "@/providers/PWAProvider";
import { AuthProvider } from "@/components/contexts/AuthContext";


// Load Inter for LTR
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Load Cairo for Arabic (RTL)
const cairo = Cairo({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-cairo",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  
  return {
    title: t('title'),
    description: "Secure and modern school management system",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t('title'),
    },
    formatDetection: {
      telephone: false,
    },
  };
}


export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const isRtl = locale === 'ar';

  return (
    <html 
      lang={locale} 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className={`${inter.variable} ${cairo.variable}`} 
      suppressHydrationWarning
    >
      <body className={`${isRtl ? 'font-cairo' : 'font-sans'}`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SocketProvider>
              <AuthProvider>
                <PWAInitializer>
                  {children}
                </PWAInitializer>
              </AuthProvider>
              <Toaster richColors position="top-right" />
            </SocketProvider>

          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
