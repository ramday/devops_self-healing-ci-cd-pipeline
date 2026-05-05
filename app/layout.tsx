import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Self-Healing CI/CD',
  description: 'Phase 1 - Foundation & Webhook Integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
