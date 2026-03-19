/**
 * Mobile Navigation Component
 *
 * Slide-out mobile menu with touch gestures.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Calculator,
  FileText,
  Building2,
  Users,
  BookOpen,
  LogIn,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  children?: { labelKey: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'home', href: '/', icon: Home },
  { labelKey: 'calculator', href: '/calculator', icon: Calculator },
  { labelKey: 'boqAnalyzer', href: '/boq-analyzer', icon: FileText },
  { labelKey: 'pricing', href: '/pricing', icon: Building2 },
  {
    labelKey: 'solutions',
    href: '/solutions',
    icon: Users,
    children: [
      { labelKey: 'forContractors', href: '/solutions/contractors' },
      { labelKey: 'forArchitects', href: '/solutions/architects' },
      { labelKey: 'forDevelopers', href: '/solutions/developers' },
      { labelKey: 'forConsultants', href: '/solutions/consultants' },
    ],
  },
  { labelKey: 'blog', href: '/blog', icon: BookOpen },
];

export function MobileNav() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();

  // Build translated nav items
  const navItems = useMemo(() => {
    return NAV_ITEMS.map(item => ({
      ...item,
      label: t(`mobileNav.${item.labelKey}`),
      children: item.children?.map(child => ({
        ...child,
        label: t(`mobileNav.${child.labelKey}`),
      })),
    }));
  }, [t]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe to close
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -100 || info.velocity.x < -500) {
        setIsOpen(false);
      }
    },
    []
  );

  const toggleExpanded = (labelKey: string) => {
    setExpandedItem(expandedItem === labelKey ? null : labelKey);
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 md:hidden"
        aria-label={t('mobileNav.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl dark:bg-slate-900 md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">CarbonBIM</span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={t('mobileNav.closeMenu')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.labelKey}>
                      {item.children ? (
                        <>
                          <button
                            onClick={() => toggleExpanded(item.labelKey)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                              'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <item.icon className="h-5 w-5" />
                              {item.label}
                            </span>
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 transition-transform',
                                expandedItem === item.labelKey && 'rotate-90'
                              )}
                            />
                          </button>
                          <AnimatePresence>
                            {expandedItem === item.labelKey && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="ml-8 mt-1 space-y-1 overflow-hidden"
                              >
                                {item.children.map((child) => (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      className={cn(
                                        'block rounded-lg px-3 py-2 text-sm transition-colors',
                                        pathname === child.href
                                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                      )}
                                    >
                                      {child.label}
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            pathname === item.href
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Footer */}
              <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                <Link
                  href="/auth/login"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  <LogIn className="h-4 w-4" />
                  {t('nav.signIn')}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
