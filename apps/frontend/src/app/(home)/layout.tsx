'use client';

import { Navbar } from '@/components/home/navbar';
import { usePathname } from 'next/navigation';

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return <div className="w-full min-h-dvh relative">{children}</div>;
  }

  return (
    <div className="w-full min-h-dvh relative">
      <div>
        <Navbar isAbsolute={isHomePage} />
      </div>
      {children}
    </div>
  );
}
