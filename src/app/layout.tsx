import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'hchat',
  description: 'WhatsApp client with an end-to-end encryption layer (X25519 + Ed25519 + AES-256-GCM)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
