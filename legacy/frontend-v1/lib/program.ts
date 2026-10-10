/**
 * SolNeutral — Anchor Program Client
 * Program ID:         Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA
 * Vault Authority:    5CrPzp95LedfGpSEcSuLY873E4TfWvRaSK6kLjjPx8n7
 * Vault PDA:          3X8BTvktbRv2CLcLaortUrMa9s5Sk5qhuzKe47Y8GYhj
 * Vault USDC Account: HDHkF3CqGNZwP6MubsvS9coxWgHU2s1SHKWzicUpDuRe
 * Network:            Solana Devnet
 */

import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { IDL } from "./idl";

// ── Constants ────────────────────────────────
export const PROGRAM_ID         = new PublicKey("Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA");
export const VAULT_AUTHORITY    = new PublicKey("5CrPzp95LedfGpSEcSuLY873E4TfWvRaSK6kLjjPx8n7");
export const VAULT_STATE_PDA    = new PublicKey("3X8BTvktbRv2CLcLaortUrMa9s5Sk5qhuzKe47Y8GYhj");
export const VAULT_USDC_ACCOUNT = new PublicKey("HDHkF3CqGNZwP6MubsvS9coxWgHU2s1SHKWzicUpDuRe");
export const USDC_MINT          = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_DECIMALS      = 6;
export const USDC_MULTIPLIER    = Math.pow(10, USDC_DECIMALS);

// ── Connection + Program ─────────────────────
export function getConnection(): Connection {
  // Use Helius public RPC for better reliability than default devnet
  const rpc = process.env.NEXT_PUBLIC_RPC_URL || 
    "https://api.devnet.solana.com";
  return new Connection(rpc, "confirmed");
}

// NOTE: Program<any> — avoids IDL generic constraint errors with Turbopack
export function getProgram(wallet: any): Program<any> {
  const provider = new AnchorProvider(getConnection(), wallet, { commitment: "confirmed" });
  return new Program<any>(IDL as any, PROGRAM_ID, provider);
}

// ── PDA helpers ──────────────────────────────
export function getVaultStatePDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_state"), authority.toBuffer()],
    PROGRAM_ID
  );
}

export function getUserPositionPDA(user: PublicKey, vaultState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_position"), user.toBuffer(), vaultState.toBuffer()],
    PROGRAM_ID
  );
}

// ── Types ────────────────────────────────────
export interface VaultStateData {
  authority: PublicKey; usdcMint: PublicKey; vaultUsdc: PublicKey;
  totalDeposits: number; totalShares: number; netApyBps: number;
  lastRebalance: number; rebalanceCount: number; totalYield: number;
  isActive: boolean; bump: number;
}

export interface UserPositionData {
  owner: PublicKey; vault: PublicKey;
  depositedAmount: number; shares: number;
  depositTimestamp: number; unlockTimestamp: number;
  yieldEarned: number; isActive: boolean;
  daysInVault: number; daysRemaining: number;
  isLocked: boolean; unlockDate: Date;
}

// ── Vault state fetch ────────────────────────
export async function fetchVaultState(wallet: any): Promise<VaultStateData | null> {
  try {
    const program = getProgram(wallet);
    const state: any = await (program.account as any).vaultState.fetch(VAULT_STATE_PDA);
    return {
      authority:      state.authority,
      usdcMint:       state.usdcMint,
      vaultUsdc:      state.vaultUsdc,
      totalDeposits:  state.totalDeposits.toNumber() / USDC_MULTIPLIER,
      totalShares:    state.totalShares.toNumber(),
      netApyBps:      state.netApyBps.toNumber(),
      lastRebalance:  state.lastRebalance.toNumber(),
      rebalanceCount: state.rebalanceCount.toNumber(),
      totalYield:     state.totalYield.toNumber() / USDC_MULTIPLIER,
      isActive:       state.isActive,
      bump:           state.bump,
    };
  } catch (e) {
    console.error("fetchVaultState failed:", e);
    return null;
  }
}

// ── User position fetch ──────────────────────
export async function fetchUserPosition(wallet: any, user: PublicKey): Promise<UserPositionData | null> {
  try {
    const program = getProgram(wallet);
    const [userPosPDA] = getUserPositionPDA(user, VAULT_STATE_PDA);
    const pos: any = await (program.account as any).userPosition.fetch(userPosPDA);
    const now = Date.now() / 1000;
    const depositTs = pos.depositTimestamp.toNumber();
    const unlockTs  = pos.unlockTimestamp.toNumber();
    return {
      owner:            pos.owner,
      vault:            pos.vault,
      depositedAmount:  pos.depositedAmount.toNumber() / USDC_MULTIPLIER,
      shares:           pos.shares.toNumber(),
      depositTimestamp: depositTs,
      unlockTimestamp:  unlockTs,
      yieldEarned:      pos.yieldEarned.toNumber() / USDC_MULTIPLIER,
      isActive:         pos.isActive,
      daysInVault:      Math.round(((now - depositTs) / 86400) * 10) / 10,
      daysRemaining:    Math.round(Math.max(0, (unlockTs - now) / 86400)),
      isLocked:         now < unlockTs,
      unlockDate:       new Date(unlockTs * 1000),
    };
  } catch (e) {
    return null;
  }
}

// ── Yield calculation ────────────────────────
export function calculateAccruedYield(
  depositedAmount: number,
  depositTimestamp: number,
  netApyBps: number = 1481
): number {
  const secondsInVault = Date.now() / 1000 - depositTimestamp;
  const annualYield    = depositedAmount * (netApyBps / 10000);
  const accrued        = annualYield * (secondsInVault / (365 * 24 * 3600));
  return Math.max(0, accrued * 0.80);
}

// ── Deposit ──────────────────────────────────
export async function depositToVault(
  wallet: any, user: PublicKey, amountUSDC: number
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program    = getProgram(wallet);
    const connection = getConnection();
    const amountRaw  = new BN(Math.floor(amountUSDC * USDC_MULTIPLIER));
    const [userPositionPDA] = getUserPositionPDA(user, VAULT_STATE_PDA);
    const userUsdcATA = await getAssociatedTokenAddress(USDC_MINT, user);

    const signature = await (program.methods as any)
      .deposit(amountRaw)
      .accounts({
        vaultState:    VAULT_STATE_PDA,
        userPosition:  userPositionPDA,
        user:          user,
        userUsdc:      userUsdcATA,
        vaultUsdc:     VAULT_USDC_ACCOUNT,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash:            latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, "confirmed");

    return { success: true, signature };
  } catch (e: any) {
    console.error("Deposit failed:", e);
    return { success: false, error: e.message || "Deposit transaction failed." };
  }
}

// ── Withdraw ─────────────────────────────────
export async function withdrawFromVault(
  wallet: any, user: PublicKey
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program    = getProgram(wallet);
    const connection = getConnection();
    const [userPositionPDA] = getUserPositionPDA(user, VAULT_STATE_PDA);
    const userUsdcATA = await getAssociatedTokenAddress(USDC_MINT, user);

    const signature = await (program.methods as any)
      .withdraw()
      .accounts({
        vaultState:   VAULT_STATE_PDA,
        userPosition: userPositionPDA,
        user:         user,
        userUsdc:     userUsdcATA,
        vaultUsdc:    VAULT_USDC_ACCOUNT,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash:            latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, "confirmed");

    return { success: true, signature };
  } catch (e: any) {
    console.error("Withdraw failed:", e);
    return { success: false, error: e.message || "Withdrawal transaction failed." };
  }
}

// ── Helpers ──────────────────────────────────
export function formatSolscanTx(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

export function formatSolscanAccount(address: string): string {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}