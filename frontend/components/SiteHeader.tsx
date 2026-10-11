"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { Icon } from "./Icons";

const links = [
  { href: "/observatory", label: "Observatory" },
  { href: "/risk-lab", label: "Risk lab" },
  { href: "/about", label: "The thesis" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) => <Link key={link.href} className={`nav-link ${pathname === link.href ? "active" : ""}`} href={link.href}>{link.label}</Link>)}
          </nav>
          <div className="header-actions">
            <span className="status-mini"><span className="status-square" /> RESEARCH MODE</span>
            <Link href="/risk-lab" className="header-launch">Launch simulator <Icon name="arrowUp" size={15}/></Link>
          </div>
          <button className="mobile-menu-btn" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav"><Icon name={open ? "close" : "menu"} size={23}/></button>
        </div>
        {open && <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<Icon name="arrowUp" size={16}/></Link>)}<Link href="/risk-lab" onClick={() => setOpen(false)}>Launch simulator <Icon name="arrow" size={16}/></Link></nav>}
      </header>
    </>
  );
}
