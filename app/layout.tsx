import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://css-unused-finder-three.vercel.app'),
  title: 'css-unused-finder — fragility & dead-class report for your CSS',
  description:
    'Paste a stylesheet and get an instant report: !important pileups, brittle selectors, runaway specificity, and classes no markup uses. Everything runs in your browser.',
  keywords: [
    'css',
    'css analysis',
    'specificity',
    'dead css',
    'unused css',
    'css linter',
    'fragile selectors',
  ],
  authors: [{ name: 'kea0811' }],
  openGraph: {
    title: 'css-unused-finder',
    description:
      'A fragility + dead-class report for any stylesheet, computed entirely in your browser.',
    type: 'website',
    url: 'https://css-unused-finder-three.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'css-unused-finder',
    description:
      'A fragility + dead-class report for any stylesheet, computed entirely in your browser.',
  },
};

export const viewport: Viewport = {
  themeColor: '#08080f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
