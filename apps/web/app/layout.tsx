import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../styles/index.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AnchoredToastProvider, ToastProvider } from '@/components/ui/toast';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>
          <AnchoredToastProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
