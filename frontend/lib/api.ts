/**
 * SolNeutral — API Client
 * ========================
 * All calls to the Flask backend in one place.
 * Import these functions in any page or component.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface VaultStats {
  vault_name: string;
  strategy: string;
  protocol: string;
  chain: string;
  tvl_usdc: number;
  gross_apy_pct: number;
  net_apy_pct: number;
  target_apy_pct: number;
  target_met: boolean;
  gross_profit_usdc: number;
  net_profit_usdc: number;
  total_fees_usdc: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  rebalance_count: number;
  simulation_days: number;
  lock_period_days: number;
  performance_fee_pct: number;
  last_updated: string;
}

export interface VaultAPY {
  net_apy_pct: number;
  gross_apy_pct: number;
  current_hourly_rate_pct: number;
  projected_daily_pct: number;
  projected_annual_pct: number;
  positive_hours_pct: number;
  best_hourly_pct: number;
  worst_hourly_pct: number;
  funding_source: string;
}

export interface PnLDataPoint {
  timestamp: string;
  vault_usdc: number;
  funding_earned: number;
  cumulative_yield: number;
  drawdown_pct: number;
}

export interface PnLData {
  hours_returned: number;
  chart_data: PnLDataPoint[];
}

export interface RebalanceEvent {
  event_id: number;
  timestamp: string;
  type: string;
  trigger: string;
  spot_adj_pct: number;
  perp_adj_pct: number;
  cost_usdc: number;
  status: string;
}

export interface RebalanceData {
  total_rebalances: number;
  events_returned: number;
  rebalance_events: RebalanceEvent[];
}

export interface FundingRate {
  timestamp: string;
  rate_pct: number;
  earned_usdc: number;
}

export interface FundingRateData {
  market: string;
  protocol: string;
  hours_returned: number;
  rates: FundingRate[];
}

export interface UserBalance {
  wallet: string;
  has_deposit: boolean;
  deposit_usdc?: number;
  accrued_yield?: number;
  current_value?: number;
  days_in_vault?: number;
  days_remaining?: number;
  unlock_date?: string;
  is_locked?: boolean;
  apy_applied_pct?: number;
  vault_net_apy: number;
  message?: string;
}

export interface DepositResult {
  wallet: string;
  deposited: number;
  shares: number;
  unlock_date: string;
  lock_days: number;
  vault_tvl: number;
  message: string;
  tx_note: string;
}

export interface RiskMetrics {
  max_drawdown_pct: number;
  drawdown_limit_pct: number;
  drawdown_status: "safe" | "warning" | "critical";
  sharpe_ratio: number;
  rebalance_count: number;
  positive_funding_pct: number;
  collateral_buffer_pct: number;
  max_position_pct: number;
  liquidation_risk: string;
  strategy_status: string;
  last_rebalance: string;
  next_rebalance: string;
}

// ─────────────────────────────────────────────
// FETCH HELPER
// ─────────────────────────────────────────────

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

// ─────────────────────────────────────────────
// VAULT API
// ─────────────────────────────────────────────

export async function getVaultStats(): Promise<VaultStats> {
  return fetchAPI<VaultStats>("/api/vault/stats");
}

export async function getVaultAPY(): Promise<VaultAPY> {
  return fetchAPI<VaultAPY>("/api/vault/apy");
}

export async function getPnLData(hours: number = 168): Promise<PnLData> {
  return fetchAPI<PnLData>(`/api/vault/pnl?hours=${hours}`);
}

export async function getRebalanceEvents(): Promise<RebalanceData> {
  return fetchAPI<RebalanceData>("/api/vault/rebalances");
}

export async function getFundingRates(hours: number = 72): Promise<FundingRateData> {
  return fetchAPI<FundingRateData>(`/api/vault/funding-rates?hours=${hours}`);
}

// ─────────────────────────────────────────────
// USER API
// ─────────────────────────────────────────────

export async function getUserBalance(wallet: string): Promise<UserBalance> {
  return fetchAPI<UserBalance>(`/api/user/${wallet}/balance`);
}

export async function depositUSDC(wallet: string, amount: number): Promise<DepositResult> {
  return fetchAPI<DepositResult>("/api/user/deposit", {
    method: "POST",
    body: JSON.stringify({ wallet, amount_usdc: amount }),
  });
}

export async function withdrawUSDC(wallet: string): Promise<any> {
  return fetchAPI("/api/user/withdraw", {
    method: "POST",
    body: JSON.stringify({ wallet }),
  });
}

// ─────────────────────────────────────────────
// RISK API
// ─────────────────────────────────────────────

export async function getRiskMetrics(): Promise<RiskMetrics> {
  return fetchAPI<RiskMetrics>("/api/risk");
}

// ─────────────────────────────────────────────
// FORMATTERS (used across all pages)
// ─────────────────────────────────────────────

export function formatUSDC(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
