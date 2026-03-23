import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Sora, Geist } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AnchoredToastProvider, ToastProvider } from '@/components/ui/toast';
import { QueryProvider } from '@/providers/query-provider';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
  title: 'Recall',
  description: 'Your personal knowledge engine',
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
        sora.variable,
        geistMono.variable,
        geist.variable,
      )}
    >
      <body className="min-h-svh bg-background antialiased selection:bg-primary selection:text-primary-foreground">
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
