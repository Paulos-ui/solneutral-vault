import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SolanaSessionProvider } from "@/components/SolanaSessionProvider";

export const metadata: Metadata = {
  title: { default: "SolNeutral — The Hedge Observatory", template: "%s | SolNeutral" },
  description: "A risk-intelligent research interface for understanding delta-neutral strategies on Solana. Explore hedge exposure, funding assumptions, and modeled scenarios without yield promises.",
  keywords: ["Solana", "Delta neutral", "Risk research", "Hedging", "Drift", "Funding rate", "Simulation"],
  openGraph: { title: "SolNeutral / The Hedge Observatory", description: "Look beyond the yield. See the risk.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#content">Skip to content</a><SolanaSessionProvider><SiteHeader/><main id="content">{children}</main><SiteFooter/></SolanaSessionProvider></body></html>;
}
