import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../styles/index.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AnchoredToastProvider, ToastProvider } from '@/components/ui/toast';
import { QueryProvider } from '@/providers/query-provider';
import { cn } from '@/lib/utils';

const geistSans = localFont({
  src: '../public/fonts/GeistVF.woff',
  variable: '--font-sans',
});
const geistMono = localFont({
  src: '../public/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Mind Stack',
  description: 'Your personal knowledge graph',
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
      className={cn('font-sans', geistSans.variable)}
    >
      <body className={geistMono.variable}>
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
