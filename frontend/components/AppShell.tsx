'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icons';
import { SiteFooter } from '@/components/SiteFooter';

const appPaths = ['/dashboard','/terminal','/observatory','/trade','/analyst','/history','/risk-lab','/risk-engine','/wallet-lens','/drift-lens','/settings','/docs'];
const destinations = [
  { href:'/dashboard', label:'Dashboard', icon:'home' },
  { href:'/observatory', label:'Observatory', icon:'pulse' },
  { href:'/trade', label:'SOL Reserve', icon:'diagonal' },
  { href:'/analyst', label:'AI Analyst', icon:'spark' },
  { href:'/history', label:'History', icon:'history' },
  { href:'/risk-lab', label:'Risk Lab', icon:'shield' },
  { href:'/docs', label:'Documentation', icon:'book' },
  { href:'/settings', label:'Settings', icon:'settings' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inApp = appPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!inApp) return <><main id="content">{children}</main><SiteFooter/></>;
  return <div className="sn-app-shell">
    <aside className="sn-app-rail" aria-label="Workspace navigation">
      <nav>
        {destinations.map(link => <Link key={link.href} href={link.href} title={link.label} aria-label={link.label} aria-current={pathname===link.href?'page':undefined} className={`sn-rail-link ${pathname===link.href?'is-current':''}`}>
          <Icon name={link.icon} size={19}/><span>{link.label}</span>
        </Link>)}
      </nav>
      <span className="sn-rail-foot">SOLNEUTRAL · TESTNET</span>
    </aside>
    <main id="content" className="sn-app-content">{children}</main>
  </div>;
}
