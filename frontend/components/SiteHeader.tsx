"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { Icon } from "./Icons";
import { ConnectWallet } from "./ConnectWallet";
const links = [
 {href:'/terminal',label:'Dashboard'},
 {href:'/observatory',label:'Observatory'},
 {href:'/risk-lab',label:'Risk lab'},
 {href:'/analyst',label:'AI analyst'},
 {href:'/trade',label:'Trade lab'},
 {href:'/docs',label:'Docs'},
];
export function SiteHeader(){
 const pathname=usePathname();const [open,setOpen]=useState(false);
 return <header className="site-header"><div className="shell header-inner"><Brand/>
  <nav className="nav-links" aria-label="Main navigation">{links.map(x=><Link href={x.href} key={x.href} className={`nav-link ${pathname===x.href?'active':''}`}>{x.label}</Link>)}</nav>
  <div className="header-actions"><span className="status-mini"><span className="status-square"/> DEVNET LAB</span><ConnectWallet compact/><Link href="/terminal" className="header-launch">OPEN TERMINAL <Icon name="arrowUp" size={15}/></Link></div>
  <button className="mobile-menu-btn" onClick={()=>setOpen(v=>!v)} aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-nav"><Icon name={open?'close':'menu'} size={23}/></button></div>
  {open&&<nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{links.map(x=><Link href={x.href} key={x.href} onClick={()=>setOpen(false)}>{x.label}<Icon name="arrowUp" size={16}/></Link>)}<Link href="/wallet-lens" onClick={()=>setOpen(false)}>Wallet Lens</Link><Link href="/drift-lens" onClick={()=>setOpen(false)}>Drift Lens</Link><Link href="/risk-engine" onClick={()=>setOpen(false)}>Risk Engine</Link><Link href="/about" onClick={()=>setOpen(false)}>About</Link><ConnectWallet/></nav>}
 </header>;
}
