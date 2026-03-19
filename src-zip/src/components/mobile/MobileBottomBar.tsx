/**
 * Mobile Bottom Bar Component
 *
 * Fixed bottom navigation for mobile devices.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Home, Calculator, FileText, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/lib/mobile/hooks';
import { useTranslation } from '@/i18n/provider';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'home', href: '/', icon: Home },
  { labelKey: 'calculator', href: '/calculator', icon: Calculator },
  { labelKey: 'boq', href: '/boq-analyzer', icon: FileText },
  { labelKey: 'account', href: '/dashboard', icon: User },
];

interface MobileBottomBarProps {
  onMenuClick?: () => void;
}

export function MobileBottomBar({ onMenuClick }: MobileBottomBarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();

  // Build translated nav items
  const navItems = useMemo(() => {
    return NAV_ITEMS.map(item => ({
      ...item,
      label: t(`mobileNav.${item.labelKey}`),
    }));
  }, [t]);

  // Hide on scroll down, show on scroll up
  const isHidden = scrollDirection === 'down';

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isHidden ? 100 : 0 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/95 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottombar-indicator"
                  className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400"
        >
          <Menu className="h-5 w-5" />
          <span>{t('common.more')}</span>
        </button>
      </div>
    </motion.nav>
  );
}
