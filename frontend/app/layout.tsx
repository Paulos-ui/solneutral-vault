import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:       "SolNeutral — Delta-Neutral Vault on Solana",
  description: "Earn stable yield with zero directional risk. SolNeutral runs a delta-neutral strategy on Drift Protocol, targeting 10%+ APY.",
  keywords:    ["Solana", "DeFi", "delta-neutral", "yield", "Drift Protocol", "USDC vault"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-800 mt-16 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center">
                <span className="text-gray-950 font-bold text-xs">SN</span>
              </div>
              <span className="text-gray-400 text-sm">
                SolNeutral — Delta-Neutral Vault
              </span>
            </div>
            <div className="flex gap-6 text-gray-600 text-xs">
              <span>Built on Solana</span>
              <span>Powered by Drift Protocol</span>
              <span>Ranger Hackathon 2025</span>
            </div>
            <p className="text-gray-700 text-xs text-center">
              This is a simulation. Not financial advice. DeFi involves risk.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
