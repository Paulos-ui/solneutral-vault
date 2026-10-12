import type { Metadata } from 'next';
import { SolNeutralDashboard } from '@/components/SolNeutralDashboard';
export const metadata:Metadata={title:'Dashboard — Wallet Overview',description:'Connected, read-only Solana testnet dashboard with wallet-owned SOL reserve and clearly labeled hedge simulations.'};
export default function DashboardPage(){ return <SolNeutralDashboard/>; }
