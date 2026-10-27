import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RotaCloud | Rota Planning, Time & Attendance, and Leave Management',
  description:
    'RotaCloud makes rota planning, time and attendance, and leave management easy for managers and staff.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Sans+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
