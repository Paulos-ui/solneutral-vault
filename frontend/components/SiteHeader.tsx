"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { Icon } from "./Icons";
import { ConnectWallet } from "./ConnectWallet";
const links = [
 {href:'/dashboard',label:'Dashboard'},
 {href:'/observatory',label:'Observatory'},
 {href:'/trade',label:'Trade Lab'},
 {href:'/docs',label:'Docs'},
];
export function SiteHeader(){
 const pathname=usePathname();const [open,setOpen]=useState(false);
 return <header className="site-header"><div className="shell header-inner"><Brand/>
  <nav className="nav-links" aria-label="Main navigation">{links.map(x=><Link href={x.href} key={x.href} className={`nav-link ${pathname===x.href||(x.href==='/dashboard'&&pathname==='/terminal')?'active':''}`}>{x.label}</Link>)}</nav>
  <div className="header-actions"><span className="status-mini"><span className="status-square"/> DEVNET</span><ConnectWallet compact/></div>
  <button className="mobile-menu-btn" onClick={()=>setOpen(v=>!v)} aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-nav"><Icon name={open?'close':'menu'} size={23}/></button></div>
  {open&&<nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{links.map(x=><Link href={x.href} key={x.href} onClick={()=>setOpen(false)}>{x.label}<Icon name="arrowUp" size={16}/></Link>)}<Link href="/wallet-lens" onClick={()=>setOpen(false)}>Wallet Lens</Link><Link href="/drift-lens" onClick={()=>setOpen(false)}>Drift Lens</Link><Link href="/risk-engine" onClick={()=>setOpen(false)}>Risk Engine</Link><Link href="/analyst" onClick={()=>setOpen(false)}>AI Analyst</Link><Link href="/history" onClick={()=>setOpen(false)}>History</Link><Link href="/risk-lab" onClick={()=>setOpen(false)}>Risk Lab</Link><Link href="/about" onClick={()=>setOpen(false)}>About</Link><ConnectWallet/></nav>}
 </header>;
}
