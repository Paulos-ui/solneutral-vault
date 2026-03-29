/**
 * SolNeutral — Solana On-Chain Utilities
 * ========================================
 * Handles:
 *  - SOL balance fetching
 *  - Devnet USDC balance fetching
 *  - Devnet SOL airdrop
 *  - Transaction building for vault deposits
 *  - Network switching (devnet ↔ mainnet)
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

// ─────────────────────────────────────────────
// NETWORK CONFIG
// ─────────────────────────────────────────────

export type Network = "devnet" | "mainnet-beta";

export const NETWORKS: Record<Network, string> = {
  "devnet":       clusterApiUrl("devnet"),
  "mainnet-beta": clusterApiUrl("mainnet-beta"),
};

// Current active network
export const ACTIVE_NETWORK: Network = "devnet";

// Devnet USDC mint (Circle's official devnet USDC)
export const DEVNET_USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// Mainnet USDC mint
export const MAINNET_USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

// SolNeutral vault address (devnet — replace with deployed contract)
export const VAULT_ADDRESS_DEVNET = "So1NeutraLVauLtXXXXXXXXXXXXXXXXXXXXXXXXX";

// ─────────────────────────────────────────────
// CONNECTION
// ─────────────────────────────────────────────

export function getConnection(network: Network = ACTIVE_NETWORK): Connection {
  return new Connection(NETWORKS[network], "confirmed");
}

// ─────────────────────────────────────────────
// BALANCE FETCHING
// ─────────────────────────────────────────────

/**
 * Get SOL balance for a wallet address.
 * Returns balance in SOL (not lamports).
 */
export async function getSOLBalance(
  walletAddress: string,
  network: Network = ACTIVE_NETWORK
): Promise<number> {
  try {
    const connection = getConnection(network);
    const pubkey     = new PublicKey(walletAddress);
    const lamports   = await connection.getBalance(pubkey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (e) {
    console.error("Failed to fetch SOL balance:", e);
    return 0;
  }
}

/**
 * Get USDC balance for a wallet address.
 * Returns balance in USDC (human-readable).
 * Uses devnet USDC mint on devnet, mainnet mint on mainnet.
 */
export async function getUSDCBalance(
  walletAddress: string,
  network: Network = ACTIVE_NETWORK
): Promise<number> {
  try {
    const connection = getConnection(network);
    const pubkey     = new PublicKey(walletAddress);
    const usdcMint   = network === "devnet" ? DEVNET_USDC_MINT : MAINNET_USDC_MINT;

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      pubkey,
      { mint: usdcMint }
    );

    if (tokenAccounts.value.length === 0) return 0;

    const balance =
      tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return balance || 0;
  } catch (e) {
    console.error("Failed to fetch USDC balance:", e);
    return 0;
  }
}

/**
 * Get full wallet info: SOL + USDC balances.
 */
export async function getWalletBalances(
  walletAddress: string,
  network: Network = ACTIVE_NETWORK
): Promise<{
  sol: number;
  usdc: number;
  address: string;
  network: Network;
  solscanUrl: string;
}> {
  const [sol, usdc] = await Promise.all([
    getSOLBalance(walletAddress, network),
    getUSDCBalance(walletAddress, network),
  ]);

  return {
    sol:        Math.round(sol * 10000) / 10000,
    usdc:       Math.round(usdc * 100) / 100,
    address:    walletAddress,
    network,
    solscanUrl: `https://solscan.io/account/${walletAddress}${
      network === "devnet" ? "?cluster=devnet" : ""
    }`,
  };
}

// ─────────────────────────────────────────────
// DEVNET AIRDROP
// ─────────────────────────────────────────────

/**
 * Request a devnet SOL airdrop (max 2 SOL per request).
 * Only works on devnet — used for testing.
 */
export async function requestDevnetAirdrop(
  walletAddress: string,
  solAmount: number = 1
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const connection = getConnection("devnet");
    const pubkey     = new PublicKey(walletAddress);
    const lamports   = Math.min(solAmount, 2) * LAMPORTS_PER_SOL;

    const signature = await connection.requestAirdrop(pubkey, lamports);
    await connection.confirmTransaction(signature, "confirmed");

    return { success: true, signature };
  } catch (e: any) {
    return {
      success: false,
      error:   e.message || "Airdrop failed. Try again in 30 seconds.",
    };
  }
}

// ─────────────────────────────────────────────
// TRANSACTION HELPERS
// ─────────────────────────────────────────────

/**
 * Build a mock vault deposit transaction.
 * In production this calls the Anchor smart contract.
 * For now it builds a real signed transaction on devnet
 * as proof of wallet interaction.
 *
 * The transaction sends a tiny amount of SOL (0.000001)
 * to demonstrate wallet signing — replaced by actual
 * vault CPI call when smart contract is deployed.
 */
export async function buildDepositTransaction(
  walletAddress: string,
  amountUSDC: number
): Promise<Transaction | null> {
  try {
    const connection    = getConnection("devnet");
    const fromPubkey    = new PublicKey(walletAddress);
    const { blockhash } = await connection.getLatestBlockhash();

    // Proof-of-interaction transaction
    // Replace with: program.methods.deposit(new BN(amountUSDC * 1e6)).rpc()
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey:   fromPubkey, // Self-transfer as placeholder
        lamports:   1000,       // 0.000001 SOL — negligible
      })
    );

    tx.recentBlockhash = blockhash;
    tx.feePayer        = fromPubkey;

    return tx;
  } catch (e) {
    console.error("Failed to build deposit transaction:", e);
    return null;
  }
}

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────

/**
 * Check if a string is a valid Solana public key.
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

/**
 * Truncate wallet address for display.
 */
export function truncateAddress(
  address: string,
  chars: number = 4
): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
