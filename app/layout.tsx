import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: '확률 시뮬레이션',
  description: '13가지 확률 시뮬레이션 인터랙티브 웹앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex bg-white text-[#111] antialiased">
        <Nav />
        <main className="flex-1 ml-56 p-8 max-w-4xl">{children}</main>
      </body>
    </html>
  );
}
