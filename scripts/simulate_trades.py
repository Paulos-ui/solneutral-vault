"""
SolNeutral - Delta-Neutral Vault Simulation Script v2
Fixes: correct fee model, 8h rebalance, realistic synthetic data
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

VAULT_SIZE_USDC       = 10_000
POSITION_SPLIT        = 0.5
MAX_DRAWDOWN_LIMIT    = 0.10
REBALANCE_HOURS       = 8
PERFORMANCE_FEE_PCT   = 0.20
TARGET_APY            = 0.10
MAX_FEE_PER_REBALANCE = 2.00
TAKER_FEE_PCT         = 0.0006
DRIFT_FUNDING_URL     = "https://mainnet-beta.api.drift.trade/fundingRates"


def fetch_drift_funding_rates(market="SOL-PERP", days=90):
    print(f"\n[SolNeutral] Fetching {days}-day funding rate history for {market}...")
    try:
        r = requests.get(DRIFT_FUNDING_URL,
                         params={"marketName": market, "limit": days * 24},
                         timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data and len(data) > 0:
                df = pd.DataFrame(data)
                df["timestamp"]    = pd.to_datetime(df["ts"], unit="s")
                df["funding_rate"] = df["fundingRate"].astype(float) / 1e9
                df = df[["timestamp", "funding_rate"]].sort_values("timestamp")
                print(f"[SolNeutral] Fetched {len(df)} real records from Drift.")
                return df
    except Exception as e:
        print(f"[SolNeutral] API unavailable ({e}). Using synthetic model.")
    return generate_synthetic_funding_rates(days)


def generate_synthetic_funding_rates(days=90):
    print(f"[SolNeutral] Generating {days}-day synthetic funding rate model...")
    np.random.seed(42)
    n = days * 24
    timestamps = [datetime.now() - timedelta(hours=n - i) for i in range(n)]

    regimes = np.random.choice(["bull", "neutral", "bear"], size=days, p=[0.40, 0.45, 0.15])
    mults = []
    for r in regimes:
        base = {"bull": np.random.uniform(1.5, 2.5),
                "bear": np.random.uniform(-0.3, 0.5),
                "neutral": np.random.uniform(0.7, 1.3)}[r]
        for _ in range(24):
            mults.append(base * np.random.uniform(0.7, 1.3))
    mults = np.array(mults[:n])

    raw  = np.random.normal(0, 0.000025, n)
    noise = np.zeros(n)
    for i in range(1, n):
        noise[i] = 0.75 * noise[i-1] + 0.25 * raw[i]

    spk_idx = np.random.choice(n, size=int(n * 0.02), replace=False)
    spikes  = np.zeros(n)
    spikes[spk_idx] = (np.random.choice([-1,1], size=len(spk_idx)) *
                       np.random.uniform(0.0002, 0.0005, size=len(spk_idx)))

    rates = (0.000030 * mults) + noise + spikes
    print(f"[SolNeutral] Generated {n} synthetic hourly records.")
    return pd.DataFrame({"timestamp": timestamps, "funding_rate": rates})


def simulate_delta_neutral(df):
    print("\n[SolNeutral] Running delta-neutral simulation...")
    vault        = VAULT_SIZE_USDC
    initial      = VAULT_SIZE_USDC
    collateral   = vault * POSITION_SPLIT
    cum_funding  = 0.0
    cum_fees     = 0.0
    rebal_count  = 0
    peak         = vault
    max_dd       = 0.0
    stopped      = False
    stop_reason  = None

    entry_fee = collateral * TAKER_FEE_PCT
    vault    -= entry_fee
    cum_fees += entry_fee

    records = []
    for idx, row in df.iterrows():
        if stopped:
            break

        rate     = row["funding_rate"]
        earned   = collateral * rate
        cum_funding += earned
        vault       += earned

        if vault > peak:
            peak = vault
        dd = (peak - vault) / peak
        if dd > max_dd:
            max_dd = dd
        if dd > MAX_DRAWDOWN_LIMIT:
            stopped     = True
            stop_reason = f"Drawdown {dd:.2%} exceeded {MAX_DRAWDOWN_LIMIT:.0%} at hour {idx}"

        rebalanced = (idx > 0 and idx % REBALANCE_HOURS == 0)
        if rebalanced and not stopped:
            new_col   = vault * POSITION_SPLIT
            fee       = min(abs(new_col - collateral) * TAKER_FEE_PCT, MAX_FEE_PER_REBALANCE)
            vault    -= fee
            cum_fees += fee
            collateral = new_col
            rebal_count += 1

        records.append({"timestamp": row["timestamp"], "vault_usdc": vault,
                        "funding_rate": rate, "funding_earned": earned,
                        "cumulative_funding": cum_funding,
                        "cumulative_fees": cum_fees,
                        "drawdown": dd, "rebalanced": rebalanced})

    rdf        = pd.DataFrame(records)
    n_hours    = len(rdf)
    n_days     = n_hours / 24
    ret        = (vault - initial) / initial
    apy        = ((1 + ret) ** (365 / n_days) - 1) * 100
    hr         = rdf["funding_earned"] / initial
    sharpe     = (hr.mean() / hr.std() * np.sqrt(8760)) if hr.std() > 0 else 0
    pos_pct    = (rdf["funding_rate"] > 0).sum() / n_hours * 100
    gross      = max(0, vault - initial)
    net_profit = gross * (1 - PERFORMANCE_FEE_PCT)
    net_apy    = (net_profit / initial) * (365 / n_days) * 100

    return {
        "simulation":  {"days": n_days, "hours": n_hours,
                        "stopped_early": stopped, "stop_reason": stop_reason},
        "performance": {"initial_vault_usdc": initial, "final_vault_usdc": round(vault,2),
                        "gross_profit_usdc": round(gross,2),
                        "total_fees_usdc": round(cum_fees,2),
                        "net_profit_usdc": round(net_profit,2),
                        "gross_apy_pct": round(apy,2), "net_apy_pct": round(net_apy,2),
                        "target_apy_pct": TARGET_APY*100,
                        "target_met": apy >= TARGET_APY*100},
        "risk":        {"max_drawdown_pct": round(max_dd*100,2),
                        "max_drawdown_limit": MAX_DRAWDOWN_LIMIT*100,
                        "sharpe_ratio": round(sharpe,2),
                        "rebalance_count": rebal_count},
        "funding":     {"total_funding_earned_usdc": round(cum_funding,2),
                        "avg_hourly_rate_pct": round(rdf["funding_rate"].mean()*100,4),
                        "positive_funding_hours_pct": round(pos_pct,1),
                        "min_hourly_rate_pct": round(rdf["funding_rate"].min()*100,4),
                        "max_hourly_rate_pct": round(rdf["funding_rate"].max()*100,4)},
        "dataframe":   rdf,
    }


def print_report(r):
    s,p,k,f = r["simulation"],r["performance"],r["risk"],r["funding"]
    print("\n" + "="*58)
    print("         SOLNEUTRAL - SIMULATION REPORT v2")
    print("         Delta-Neutral USDC Vault on Solana")
    print("="*58)
    print(f"\n  SIMULATION PERIOD")
    print(f"   Duration      : {s['days']:.0f} days ({s['hours']:.0f} hours)")
    if s["stopped_early"]:
        print(f"   WARNING       : {s['stop_reason']}")
    else:
        print(f"   Status        : Completed full 90-day period")
    print(f"\n  PERFORMANCE")
    print(f"   Initial vault : ${p['initial_vault_usdc']:>10,.2f} USDC")
    print(f"   Final vault   : ${p['final_vault_usdc']:>10,.2f} USDC")
    print(f"   Gross profit  : ${p['gross_profit_usdc']:>10,.2f} USDC")
    print(f"   Exec fees     : ${p['total_fees_usdc']:>10,.2f} USDC")
    print(f"   Net profit    : ${p['net_profit_usdc']:>10,.2f} USDC")
    print(f"   Gross APY     : {p['gross_apy_pct']:>9.2f}%")
    print(f"   Net APY       : {p['net_apy_pct']:>9.2f}%")
    print(f"   Target APY    : {p['target_apy_pct']:>9.1f}%")
    print(f"   Target met    : {'YES' if p['target_met'] else 'NO'}")
    print(f"\n  FUNDING RATES (SOL-PERP on Drift)")
    print(f"   Total earned  : ${f['total_funding_earned_usdc']:>10,.2f} USDC")
    print(f"   Avg hourly    : {f['avg_hourly_rate_pct']:>9.4f}%")
    print(f"   Best hourly   : {f['max_hourly_rate_pct']:>9.4f}%")
    print(f"   Worst hourly  : {f['min_hourly_rate_pct']:>9.4f}%")
    print(f"   Positive hrs  : {f['positive_funding_hours_pct']:>9.1f}%")
    print(f"\n  RISK MANAGEMENT")
    print(f"   Max drawdown  : {k['max_drawdown_pct']:>9.2f}%")
    print(f"   DD limit      : {k['max_drawdown_limit']:>9.1f}%")
    print(f"   Sharpe ratio  : {k['sharpe_ratio']:>9.2f}")
    print(f"   Rebalances    : {k['rebalance_count']:>9,}")
    print("\n" + "="*58)
    print("   SolNeutral | Ranger Hackathon 2025 | Drift Protocol")
    print("="*58)


def export_csv(r, fn="solneutral_simulation.csv"):
    r["dataframe"].to_csv(fn, index=False)
    print(f"\n[SolNeutral] Exported -> {fn}")


def export_json(r, fn="solneutral_summary.json"):
    summary = {"product": "SolNeutral", "chain": "Solana",
               "generated": datetime.now().isoformat(),
               "simulation": {k:v for k,v in r["simulation"].items() if k!="stop_reason"},
               "performance": r["performance"], "risk": r["risk"], "funding": r["funding"]}
    with open(fn, "w") as fp:
        json.dump(summary, fp, indent=2, default=str)
    print(f"[SolNeutral] Exported -> {fn}")


if __name__ == "__main__":
    print("="*58)
    print("   SOLNEUTRAL - DELTA-NEUTRAL VAULT SIMULATOR v2")
    print("   Powered by Drift Protocol | Built on Solana")
    print("="*58)
    df = fetch_drift_funding_rates(market="SOL-PERP", days=90)
    results = simulate_delta_neutral(df)
    print_report(results)
    export_csv(results)
    export_json(results)
    print("\n[SolNeutral] Simulation complete. Ready to build.\n")
