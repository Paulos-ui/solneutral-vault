import type { Metadata } from 'next';
import { SolNeutralDashboard } from '@/components/SolNeutralDashboard';
export const metadata:Metadata={title:'Dashboard — Wallet Overview',description:'Connected, read-only Solana devnet dashboard with clearly labeled Drift funding and hedge simulations.'};
export default function DashboardPage(){ return <SolNeutralDashboard/>; }
