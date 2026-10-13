import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MAQE | Engineering Intelligence Platform',
  description: 'Company intelligence, supplier discovery, and AI lead matching for engineering supply chains.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
