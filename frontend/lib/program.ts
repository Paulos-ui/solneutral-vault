/**
 * SolNeutral — Anchor Program Client
 * =====================================
 * Program ID:          Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA
 * Vault Authority:     5CrPzp95LedfGpSEcSuLY873E4TfWvRaSK6kLjjPx8n7
 * Vault PDA:           3X8BTvktbRv2CLcLaortUrMa9s5Sk5qhuzKe47Y8GYhj
 * Vault USDC Account:  HDHkF3CqGNZwP6MubsvS9coxWgHU2s1SHKWzicUpDuRe
 * Network:             Solana Devnet
 */

import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { IDL } from "./idl";

export const PROGRAM_ID = new PublicKey("Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA");
export const VAULT_AUTHORITY = new PublicKey("5CrPzp95LedfGpSEcSuLY873E4TfWvRaSK6kLjjPx8n7");
export const VAULT_STATE_PDA = new PublicKey("3X8BTvktbRv2CLcLaortUrMa9s5Sk5qhuzKe47Y8GYhj");
export const VAULT_USDC_ACCOUNT = new PublicKey("HDHkF3CqGNZwP6MubsvS9coxWgHU2s1SHKWzicUpDuRe");
export const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = Math.pow(10, USDC_DECIMALS);

export function getConnection(): Connection {
  return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export function getProgram(wallet: any): Program<any> {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program(IDL as any, provider);
}

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

export interface VaultStateData {
  authority: PublicKey;
  usdcMint: PublicKey;
  vaultUsdc: PublicKey;
  totalDeposits: number;
  totalShares: number;
  netApyBps: number;
  lastRebalance: number;
  rebalanceCount: number;
  totalYield: number;
  isActive: boolean;
  bump: number;
}

export async function fetchVaultState(wallet: any): Promise<VaultStateData | null> {
  try {
    const program = getProgram(wallet);
    const state: any = await (program.account as any).vaultState.fetch(VAULT_STATE_PDA);
    return {
      authority: state.authority,
      usdcMint: state.usdcMint,
      vaultUsdc: state.vaultUsdc,
      totalDeposits: state.totalDeposits.toNumber() / USDC_MULTIPLIER,
      totalShares: state.totalShares.toNumber(),
      netApyBps: state.netApyBps.toNumber(),
      lastRebalance: state.lastRebalance.toNumber(),
      rebalanceCount: state.rebalanceCount.toNumber(),
      totalYield: state.totalYield.toNumber() / USDC_MULTIPLIER,
      isActive: state.isActive,
      bump: state.bump,
    };
  } catch (e) {
    console.error("Failed to fetch vault state:", e);
    return null;
  }
}

export interface UserPositionData {
  owner: PublicKey;
  vault: PublicKey;
  depositedAmount: number;
  shares: number;
  depositTimestamp: number;
  unlockTimestamp: number;
  yieldEarned: number;
  isActive: boolean;
  daysInVault: number;
  daysRemaining: number;
  isLocked: boolean;
  unlockDate: Date;
}

export async function fetchUserPosition(wallet: any, user: PublicKey): Promise<UserPositionData | null> {
  try {
    const program = getProgram(wallet);
    const [userPosPDA] = getUserPositionPDA(user, VAULT_STATE_PDA);
    const pos: any = await (program.account as any).userPosition.fetch(userPosPDA);
    const now = Date.now() / 1000;
    const depositTs = pos.depositTimestamp.toNumber();
    const unlockTs = pos.unlockTimestamp.toNumber();
    return {
      owner: pos.owner,
      vault: pos.vault,
      depositedAmount: pos.depositedAmount.toNumber() / USDC_MULTIPLIER,
      shares: pos.shares.toNumber(),
      depositTimestamp: depositTs,
      unlockTimestamp: unlockTs,
      yieldEarned: pos.yieldEarned.toNumber() / USDC_MULTIPLIER,
      isActive: pos.isActive,
      daysInVault: Math.round(((now - depositTs) / 86400) * 10) / 10,
      daysRemaining: Math.round(Math.max(0, (unlockTs - now) / 86400)),
      isLocked: now < unlockTs,
      unlockDate: new Date(unlockTs * 1000),
    };
  } catch (e) {
    return null;
  }
}

export function calculateAccruedYield(
  depositedAmount: number,
  depositTimestamp: number,
  netApyBps: number = 1481
): number {
  const now = Date.now() / 1000;
  const secondsInVault = now - depositTimestamp;
  const annualYield = depositedAmount * (netApyBps / 10000);
  const accrued = annualYield * (secondsInVault / (365 * 24 * 3600));
  return Math.max(0, accrued - accrued * 0.20);
}

export async function depositToVault(
  wallet: any,
  user: PublicKey,
  amountUSDC: number
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program = getProgram(wallet);
    const connection = getConnection();
    const amountRaw = new BN(Math.floor(amountUSDC * USDC_MULTIPLIER));
    const [userPositionPDA] = getUserPositionPDA(user, VAULT_STATE_PDA);
    const userUsdcATA = await getAssociatedTokenAddress(USDC_MINT, user);

    const signature = await (program.methods as any)
      .deposit(amountRaw)
      .accounts({
        vaultState: VAULT_STATE_PDA,
        userPosition: userPositionPDA,
        user: user,
        userUsdc: userUsdcATA,
        vaultUsdc: VAULT_USDC_ACCOUNT,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    await connection.confirmTransaction(signature, "confirmed");
    return { success: true, signature };
  } catch (e: any) {
    console.error("Deposit failed:", e);
    return { success: false, error: e.message || "Deposit transaction failed." };
  }
}

export async function withdrawFromVault(
  wallet: any,
  user: PublicKey
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program = getProgram(wallet);
    const connection = getConnection();
    const [userPositionPDA] = getUserPositionPDA(user, VAULT_STATE_PDA);
    const userUsdcATA = await getAssociatedTokenAddress(USDC_MINT, user);

    const signature = await (program.methods as any)
      .withdraw()
      .accounts({
        vaultState: VAULT_STATE_PDA,
        userPosition: userPositionPDA,
        user: user,
        userUsdc: userUsdcATA,
        vaultUsdc: VAULT_USDC_ACCOUNT,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await connection.confirmTransaction(signature, "confirmed");
    return { success: true, signature };
  } catch (e: any) {
    console.error("Withdraw failed:", e);
    return { success: false, error: e.message || "Withdrawal transaction failed." };
  }
}

export function formatSolscanTx(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

export function formatSolscanAccount(address: string): string {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}