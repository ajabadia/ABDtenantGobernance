'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { SidebarLinks } from './sidebar/SidebarLinks';
import { SidebarUserCard } from './sidebar/SidebarUserCard';

interface UserSession {
  authenticated: boolean;
  user?: {
    name: string;
    surname: string;
    email: string;
    role: string;
    branding?: {
      logoUrl?: string | null;
    } | null;
  };
}

interface SidebarNavigationProps {
  session: UserSession;
}

export function SidebarNavigation({ session }: SidebarNavigationProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;
  const isAdmin = isLoggedIn && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* 🍔 Floating Trigger Button (Top-Left) */}
      <button
        onClick={toggleSidebar}
        type="button"
        aria-label={t('menuTitle')}
        aria-expanded={isOpen}
        className="fixed top-6 left-6 z-40 p-3 bg-background/80 backdrop-blur-md border border-border hover:border-primary/40 hover:bg-muted active:scale-95 text-foreground transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-none shadow-lg"
      >
        <Menu className="w-5 h-5 text-foreground" aria-hidden="true" />
      </button>

      {/* 🌑 Dark Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Escape' && toggleSidebar()}
          role="button"
          tabIndex={0}
          aria-label={t('close')}
          className="fixed inset-0 z-45 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* 🚀 Tactical Sidebar Drawer (Slides from left) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-background border-r border-border p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out transform rounded-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Sidebar Navigation"
      >
        {/* TOP SEGMENT: Brand & Navigation */}
        <div className="flex flex-col gap-8">
          
          {/* Header & Brand */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <Link
              href="/"
              onClick={toggleSidebar}
              className="hover:opacity-90 transition-opacity duration-200 cursor-pointer focus:outline-none flex items-center"
            >
              {user?.branding?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.branding.logoUrl}
                  alt="Logo"
                  className="max-h-8 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text logo if image fails to load
                    e.currentTarget.style.display = 'none';
                    const sib = e.currentTarget.nextElementSibling as HTMLElement;
                    if (sib) sib.style.display = 'inline';
                  }}
                />
              ) : null}
              <span 
                className={`text-xl font-black tracking-tighter text-foreground italic uppercase hover:text-primary transition-colors duration-200 ${
                  user?.branding?.logoUrl ? 'hidden' : 'inline'
                }`}
              >
                {t('brandPart1')}<span className="text-primary">{t('brandPart2')}</span>
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              type="button"
              aria-label={t('close')}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer focus:outline-none"
            >
              <X className="w-4.5 h-4.5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Links */}
          <SidebarLinks 
            toggleSidebar={toggleSidebar}
            locale={locale}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
          />
        </div>

        {/* BOTTOM SEGMENT: Cyber-Industrial User Card / Access Trigger */}
        <SidebarUserCard 
          isLoggedIn={isLoggedIn}
          user={user}
          locale={locale}
          toggleSidebar={toggleSidebar}
        />

      </div>
    </>
  );
}
