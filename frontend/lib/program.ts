/**
 * SolNeutral — Anchor Program Client
 * =====================================
 * Connects the Next.js frontend to the deployed
 * SolNeutral Anchor smart contract on Solana.
 *
 * Program ID: Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA
 * Network:    Solana Devnet
 */

import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { IDL, SolneutralIDL } from "./idl";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  "Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA"
);

// Devnet USDC mint (Circle official devnet USDC)
export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// USDC has 6 decimal places
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = Math.pow(10, USDC_DECIMALS);

// ─────────────────────────────────────────────
// PROGRAM SETUP
// ─────────────────────────────────────────────

export function getConnection(): Connection {
  return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export function getProgram(wallet: any): Program<SolneutralIDL> {
  const connection = getConnection();
  const provider   = new AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );
  return new Program(IDL as any, PROGRAM_ID, provider);
}

// ─────────────────────────────────────────────
// PDA DERIVATION
// ─────────────────────────────────────────────

export async function getVaultStatePDA(
  authority: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_state"), authority.toBuffer()],
    PROGRAM_ID
  );
}

export async function getUserPositionPDA(
  user:       PublicKey,
  vaultState: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_position"), user.toBuffer(), vaultState.toBuffer()],
    PROGRAM_ID
  );
}

// ─────────────────────────────────────────────
// VAULT STATE FETCHING
// ─────────────────────────────────────────────

export interface VaultStateData {
  authority:       PublicKey;
  usdcMint:        PublicKey;
  vaultUsdc:       PublicKey;
  totalDeposits:   number;
  totalShares:     number;
  netApyBps:       number;
  lastRebalance:   number;
  rebalanceCount:  number;
  totalYield:      number;
  isActive:        boolean;
  bump:            number;
}

export async function fetchVaultState(
  wallet:    any,
  authority: PublicKey
): Promise<VaultStateData | null> {
  try {
    const program              = getProgram(wallet);
    const [vaultStatePDA]      = await getVaultStatePDA(authority);
    const state: any           = await program.account.vaultState.fetch(vaultStatePDA);

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
    console.error("Failed to fetch vault state:", e);
    return null;
  }
}

// ─────────────────────────────────────────────
// USER POSITION FETCHING
// ─────────────────────────────────────────────

export interface UserPositionData {
  owner:             PublicKey;
  vault:             PublicKey;
  depositedAmount:   number;
  shares:            number;
  depositTimestamp:  number;
  unlockTimestamp:   number;
  yieldEarned:       number;
  isActive:          boolean;
  daysInVault:       number;
  daysRemaining:     number;
  isLocked:          boolean;
  unlockDate:        Date;
}

export async function fetchUserPosition(
  wallet:    any,
  user:      PublicKey,
  authority: PublicKey
): Promise<UserPositionData | null> {
  try {
    const program         = getProgram(wallet);
    const [vaultStatePDA] = await getVaultStatePDA(authority);
    const [userPosPDA]    = await getUserPositionPDA(user, vaultStatePDA);
    const pos: any        = await program.account.userPosition.fetch(userPosPDA);

    const now            = Date.now() / 1000;
    const depositTs      = pos.depositTimestamp.toNumber();
    const unlockTs       = pos.unlockTimestamp.toNumber();
    const daysInVault    = (now - depositTs) / 86400;
    const daysRemaining  = Math.max(0, (unlockTs - now) / 86400);

    return {
      owner:            pos.owner,
      vault:            pos.vault,
      depositedAmount:  pos.depositedAmount.toNumber() / USDC_MULTIPLIER,
      shares:           pos.shares.toNumber(),
      depositTimestamp: depositTs,
      unlockTimestamp:  unlockTs,
      yieldEarned:      pos.yieldEarned.toNumber() / USDC_MULTIPLIER,
      isActive:         pos.isActive,
      daysInVault:      Math.round(daysInVault * 10) / 10,
      daysRemaining:    Math.round(daysRemaining),
      isLocked:         now < unlockTs,
      unlockDate:       new Date(unlockTs * 1000),
    };
  } catch (e) {
    return null;
  }
}

// ─────────────────────────────────────────────
// CALCULATE ACCRUED YIELD
// ─────────────────────────────────────────────

export function calculateAccruedYield(
  depositedAmount: number,
  depositTimestamp: number,
  netApyBps: number = 1481
): number {
  const now             = Date.now() / 1000;
  const secondsInVault  = now - depositTimestamp;
  const annualYield     = depositedAmount * (netApyBps / 10000);
  const accrued         = annualYield * (secondsInVault / (365 * 24 * 3600));
  const performanceFee  = accrued * 0.20;
  return Math.max(0, accrued - performanceFee);
}

// ─────────────────────────────────────────────
// DEPOSIT INSTRUCTION
// ─────────────────────────────────────────────

export async function depositToVault(
  wallet:    any,
  user:      PublicKey,
  authority: PublicKey,
  amountUSDC: number
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program              = getProgram(wallet);
    const connection           = getConnection();
    const amountRaw            = new BN(Math.floor(amountUSDC * USDC_MULTIPLIER));

    // Derive PDAs
    const [vaultStatePDA]      = await getVaultStatePDA(authority);
    const [userPositionPDA]    = await getUserPositionPDA(user, vaultStatePDA);

    // Get token accounts
    const userUsdcATA          = await getAssociatedTokenAddress(USDC_MINT, user);
    const vaultUsdcATA         = await getAssociatedTokenAddress(USDC_MINT, vaultStatePDA, true);

    // Execute deposit instruction
    const signature = await program.methods
      .deposit(amountRaw)
      .accounts({
        vaultState:    vaultStatePDA,
        userPosition:  userPositionPDA,
        user:          user,
        userUsdc:      userUsdcATA,
        vaultUsdc:     vaultUsdcATA,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    await connection.confirmTransaction(signature, "confirmed");

    return { success: true, signature };
  } catch (e: any) {
    console.error("Deposit failed:", e);
    return {
      success: false,
      error: e.message || "Deposit transaction failed.",
    };
  }
}

// ─────────────────────────────────────────────
// WITHDRAW INSTRUCTION
// ─────────────────────────────────────────────

export async function withdrawFromVault(
  wallet:    any,
  user:      PublicKey,
  authority: PublicKey
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program           = getProgram(wallet);
    const connection        = getConnection();

    const [vaultStatePDA]   = await getVaultStatePDA(authority);
    const [userPositionPDA] = await getUserPositionPDA(user, vaultStatePDA);

    const userUsdcATA       = await getAssociatedTokenAddress(USDC_MINT, user);
    const vaultUsdcATA      = await getAssociatedTokenAddress(USDC_MINT, vaultStatePDA, true);

    const signature = await program.methods
      .withdraw()
      .accounts({
        vaultState:   vaultStatePDA,
        userPosition: userPositionPDA,
        user:         user,
        userUsdc:     userUsdcATA,
        vaultUsdc:    vaultUsdcATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await connection.confirmTransaction(signature, "confirmed");

    return { success: true, signature };
  } catch (e: any) {
    console.error("Withdraw failed:", e);
    return {
      success: false,
      error: e.message || "Withdrawal transaction failed.",
    };
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function formatSolscanTx(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

export function formatSolscanAccount(address: string): string {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}
