import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, Archivo } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { NavigationProvider } from '@/providers/navigation-provider';

// Body / UI face — humanist geometric sans, used at heavy weights.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

// Display face — confident grotesk for big numbers and titles (scoreboard feel).
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Arena',
  description: 'Ranking social para grupos casuais de beach tennis.',
  applicationName: 'Arena',
  appleWebApp: {
    capable: true,
    title: 'Arena',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#f2fbfb',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#10191f',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        'h-full',
        'antialiased',
        'font-sans',
        plusJakarta.variable,
        archivo.variable,
      )}
    >
      <body className="min-h-full flex flex-col dark">
        <NavigationProvider>{children}</NavigationProvider>
      </body>
    </html>
  );
}
