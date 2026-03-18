import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Manrope, Sora } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AnchoredToastProvider, ToastProvider } from '@/components/ui/toast';
import { QueryProvider } from '@/providers/query-provider';
import { cn } from '@/lib/utils';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const geistMono = localFont({
  src: '../public/fonts/GeistMonoVF.woff',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'dev.me',
  description: 'Your personal AI brain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'scroll-smooth font-sans',
        manrope.variable,
        sora.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <ToastProvider>
            <AnchoredToastProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </AnchoredToastProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
