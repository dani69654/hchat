import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'hchat',
  description: 'WhatsApp client with end-to-end RSA encryption',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
