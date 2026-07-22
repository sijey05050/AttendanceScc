import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Attendance System',
  description: 'QR code attendance management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
