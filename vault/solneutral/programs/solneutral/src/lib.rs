use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA");

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const LOCK_PERIOD_SECONDS: i64 = 90 * 24 * 60 * 60; // 90 days
const NET_APY_BPS: u64 = 1481; // 14.81% in basis points
const PERFORMANCE_FEE_BPS: u64 = 2000; // 20% performance fee
const MAX_DRAWDOWN_BPS: u64 = 1000; // 10% max drawdown
const MIN_DEPOSIT: u64 = 10_000_000; // 10 USDC (6 decimals)
const BPS_DENOMINATOR: u64 = 10_000;

// ─────────────────────────────────────────────
// PROGRAM
// ─────────────────────────────────────────────

#[program]
pub mod solneutral {
    use super::*;

    /// Initialize the SolNeutral vault.
    /// Called once by the vault manager to set up the vault state.
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let clock = Clock::get()?;

        // Enforce lock period
        require!(
            clock.unix_timestamp >= ctx.accounts.user_position.unlock_timestamp,
            SolNeutralError::StillLocked
        );
        require!(
            ctx.accounts.user_position.is_active,
            SolNeutralError::PositionInactive
        );

        // Extract data before mutable borrows
        let deposited_amount = ctx.accounts.user_position.deposited_amount;
        let deposit_timestamp = ctx.accounts.user_position.deposit_timestamp;
        let shares = ctx.accounts.user_position.shares;
        let vault_authority = ctx.accounts.vault_state.authority;
        let vault_bump = ctx.accounts.vault_state.bump;

        // Calculate accrued yield
        let seconds_in_vault = clock.unix_timestamp.checked_sub(deposit_timestamp).unwrap() as u64;

        let annual_yield = deposited_amount
            .checked_mul(NET_APY_BPS)
            .unwrap()
            .checked_div(BPS_DENOMINATOR)
            .unwrap();

        let accrued_yield = annual_yield
            .checked_mul(seconds_in_vault)
            .unwrap()
            .checked_div(365 * 24 * 60 * 60)
            .unwrap();

        let performance_fee = accrued_yield
            .checked_mul(PERFORMANCE_FEE_BPS)
            .unwrap()
            .checked_div(BPS_DENOMINATOR)
            .unwrap();

        let net_yield = accrued_yield.checked_sub(performance_fee).unwrap();
        let payout = deposited_amount.checked_add(net_yield).unwrap();

        // Update vault state
        {
            let vault = &mut ctx.accounts.vault_state;
            vault.total_deposits = vault
                .total_deposits
                .checked_sub(deposited_amount)
                .unwrap_or(0);
            vault.total_shares = vault.total_shares.checked_sub(shares).unwrap_or(0);
            vault.total_yield = vault.total_yield.checked_add(accrued_yield).unwrap();
        }

        // Transfer USDC back to user
        let vault_seeds = &[b"vault_state", vault_authority.as_ref(), &[vault_bump]];
        let signer = &[&vault_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.vault_state.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, payout)?;

        // Close position
        ctx.accounts.user_position.is_active = false;
        ctx.accounts.user_position.yield_earned = net_yield;

        emit!(WithdrawEvent {
            user: ctx.accounts.user.key(),
            principal: deposited_amount,
            yield_earned: net_yield,
            performance_fee,
            total_payout: payout,
            days_in_vault: seconds_in_vault / 86400,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Withdrawal: principal={} yield={} fee={} payout={}",
            deposited_amount,
            net_yield,
            performance_fee,
            payout
        );

        Ok(())
    }

    /// Rebalance the vault — called by keeper every 8 hours.
    /// Logs funding fee collection and updates vault APY.
    /// In production this would CPI into Drift Protocol.
    pub fn rebalance(ctx: Context<Rebalance>, funding_earned: u64, new_apy_bps: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        let clock = Clock::get()?;

        // Only vault authority can rebalance
        require!(
            ctx.accounts.authority.key() == vault.authority,
            SolNeutralError::Unauthorized
        );

        // Update vault stats
        vault.total_yield = vault.total_yield.checked_add(funding_earned).unwrap();
        vault.net_apy_bps = new_apy_bps;
        vault.last_rebalance = clock.unix_timestamp;
        vault.rebalance_count = vault.rebalance_count.checked_add(1).unwrap();

        emit!(RebalanceEvent {
            funding_earned,
            new_apy_bps,
            total_deposits: vault.total_deposits,
            rebalance_count: vault.rebalance_count,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "Rebalance #{}: funding={} new_apy={}bps",
            vault.rebalance_count,
            funding_earned,
            new_apy_bps
        );

        Ok(())
    }
}

// ─────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer  = authority,
        space  = VaultState::LEN,
        seeds  = [b"vault_state", authority.key().as_ref()],
        bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: USDC mint address validated by token program
    pub usdc_mint: AccountInfo<'info>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault_state", vault_state.authority.as_ref()],
        bump  = vault_state.bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer  = user,
        space  = UserPosition::LEN,
        seeds  = [b"user_position", user.key().as_ref(), vault_state.key().as_ref()],
        bump,
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault_state", vault_state.authority.as_ref()],
        bump  = vault_state.bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
    mut,
    seeds = [b"user_position", user.key().as_ref(), vault_state.key().as_ref()],
    bump,
    constraint = user_position.owner == user.key() @ SolNeutralError::Unauthorized,
)]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Rebalance<'info> {
    #[account(
        mut,
        seeds = [b"vault_state", vault_state.authority.as_ref()],
        bump  = vault_state.bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    pub authority: Signer<'info>,
}

// ─────────────────────────────────────────────
// STATE ACCOUNTS
// ─────────────────────────────────────────────

#[account]
pub struct VaultState {
    pub authority: Pubkey,    // vault manager
    pub usdc_mint: Pubkey,    // USDC mint address
    pub vault_usdc: Pubkey,   // vault USDC token account
    pub total_deposits: u64,  // total USDC deposited
    pub total_shares: u64,    // total shares outstanding
    pub net_apy_bps: u64,     // current net APY in basis points
    pub last_rebalance: i64,  // unix timestamp of last rebalance
    pub rebalance_count: u64, // total rebalances executed
    pub total_yield: u64,     // total yield generated
    pub is_active: bool,      // vault active flag
    pub bump: u8,             // PDA bump seed
}

impl VaultState {
    pub const LEN: usize = 8   // discriminator
        + 32   // authority
        + 32   // usdc_mint
        + 32   // vault_usdc
        + 8    // total_deposits
        + 8    // total_shares
        + 8    // net_apy_bps
        + 8    // last_rebalance
        + 8    // rebalance_count
        + 8    // total_yield
        + 1    // is_active
        + 1; // bump
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,          // user wallet
    pub vault: Pubkey,          // vault this position belongs to
    pub deposited_amount: u64,  // USDC deposited
    pub shares: u64,            // vault shares held
    pub deposit_timestamp: i64, // when deposit was made
    pub unlock_timestamp: i64,  // when withdrawal is allowed
    pub yield_earned: u64,      // yield earned on withdrawal
    pub is_active: bool,        // position active flag
}

impl UserPosition {
    pub const LEN: usize = 8   // discriminator
        + 32   // owner
        + 32   // vault
        + 8    // deposited_amount
        + 8    // shares
        + 8    // deposit_timestamp
        + 8    // unlock_timestamp
        + 8    // yield_earned
        + 1; // is_active
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────

#[event]
pub struct VaultInitialized {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub shares: u64,
    pub unlock_at: i64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub principal: u64,
    pub yield_earned: u64,
    pub performance_fee: u64,
    pub total_payout: u64,
    pub days_in_vault: u64,
    pub timestamp: i64,
}

#[event]
pub struct RebalanceEvent {
    pub funding_earned: u64,
    pub new_apy_bps: u64,
    pub total_deposits: u64,
    pub rebalance_count: u64,
    pub timestamp: i64,
}

// ─────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────

#[error_code]
pub enum SolNeutralError {
    #[msg("Deposit amount is below the minimum of 10 USDC")]
    DepositTooSmall,

    #[msg("Vault is currently inactive")]
    VaultInactive,

    #[msg("Position is still locked. Wait for the 90-day lock period to expire.")]
    StillLocked,

    #[msg("This position is no longer active")]
    PositionInactive,

    #[msg("Unauthorized: only the vault authority can perform this action")]
    Unauthorized,

    #[msg("Vault has exceeded maximum drawdown limit")]
    MaxDrawdownExceeded,
}
