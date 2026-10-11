//! SolNeutral V3 RESEARCH vault. Localnet/devnet only. UNCOMPILED reference implementation.
//! No Drift CPI or automatic strategy execution. Do NOT deploy to mainnet or deposit funds.
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// PLACEHOLDER from legacy source. BEFORE deployment generate a NEW program keypair and run `anchor keys sync`.
// This is not evidence that the legacy deployed address matches this program.
declare_id!("Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA");

#[program]
pub mod solneutral_v3 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        require!(ctx.accounts.asset_mint.decimals == 6, VaultError::UnsupportedDecimals);
        let vault = &mut ctx.accounts.vault;
        vault.admin = ctx.accounts.admin.key();
        vault.asset_mint = ctx.accounts.asset_mint.key();
        vault.asset_custody = ctx.accounts.asset_custody.key();
        vault.total_shares = 0;
        vault.paused = false;
        vault.bump = ctx.bumps.vault;
        emit!(Initialized { vault: vault.key(), admin: vault.admin, mint: vault.asset_mint });
        Ok(())
    }

    /// Shares are internal and non-transferable. No APY is promised or accrued by a clock.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.vault.paused, VaultError::Paused);
        require!(amount >= 1_000_000, VaultError::DepositTooSmall);
        let vault = &mut ctx.accounts.vault;
        let assets_before = ctx.accounts.asset_custody.amount;
        let shares = if vault.total_shares == 0 {
            amount
        } else {
            require!(assets_before > 0, VaultError::Insolvent);
            mul_div_floor(amount, vault.total_shares, assets_before)?
        };
        require!(shares > 0, VaultError::ZeroShares);
        let position = &mut ctx.accounts.position;
        // New position accounts start zeroed. PDA seeds bind wallet and vault.
        if position.owner == Pubkey::default() && position.vault == Pubkey::default() {
            position.owner = ctx.accounts.user.key();
            position.vault = vault.key();
            position.shares = 0;
        }
        require_keys_eq!(position.owner, ctx.accounts.user.key(), VaultError::Unauthorized);
        require_keys_eq!(position.vault, vault.key(), VaultError::InvalidPosition);
        let cpi = Transfer {
            from: ctx.accounts.user_asset.to_account_info(),
            to: ctx.accounts.asset_custody.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi), amount)?;
        position.shares = position.shares.checked_add(shares).ok_or(VaultError::MathOverflow)?;
        vault.total_shares = vault.total_shares.checked_add(shares).ok_or(VaultError::MathOverflow)?;
        emit!(Deposited { owner: ctx.accounts.user.key(), amount, shares });
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        require!(shares > 0, VaultError::ZeroShares);
        let vault = &mut ctx.accounts.vault;
        let position = &mut ctx.accounts.position;
        require!(position.shares >= shares && vault.total_shares >= shares, VaultError::InsufficientShares);
        let assets = ctx.accounts.asset_custody.amount;
        let payout = if shares == vault.total_shares { assets } else { mul_div_floor(shares, assets, vault.total_shares)? };
        require!(payout > 0, VaultError::ZeroPayout);
        position.shares = position.shares.checked_sub(shares).ok_or(VaultError::MathOverflow)?;
        vault.total_shares = vault.total_shares.checked_sub(shares).ok_or(VaultError::MathOverflow)?;
        let mint_key = vault.asset_mint;
        let seeds: &[&[u8]] = &[b"research_vault", mint_key.as_ref(), &[vault.bump]];
        let signer = &[seeds];
        let cpi = Transfer {
            from: ctx.accounts.asset_custody.to_account_info(),
            to: ctx.accounts.user_asset.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        token::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi, signer), payout)?;
        emit!(Withdrawn { owner: ctx.accounts.user.key(), shares, amount: payout });
        Ok(())
    }

    /// Yield exists only if actual tokens are paid in from the manager's USDC account.
    /// No synthetic yield, fee mint, or fake rebalance events.
    pub fn contribute_realized_funds(ctx: Context<ContributeRealizedFunds>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        let cpi = Transfer {
            from: ctx.accounts.admin_asset.to_account_info(),
            to: ctx.accounts.asset_custody.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi), amount)?;
        emit!(FundsContributed { amount });
        Ok(())
    }

    /// Pausing blocks NEW deposits, not owner withdrawals. No admin seizure instruction.
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.vault.paused = paused;
        emit!(PauseChanged { paused });
        Ok(())
    }
}

fn mul_div_floor(a: u64, b: u64, denominator: u64) -> Result<u64> {
    require!(denominator > 0, VaultError::MathOverflow);
    let value = (a as u128).checked_mul(b as u128).ok_or(VaultError::MathOverflow)?
        .checked_div(denominator as u128).ok_or(VaultError::MathOverflow)?;
    u64::try_from(value).map_err(|_| error!(VaultError::MathOverflow))
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=admin, space=8+VaultState::SPACE, seeds=[b"research_vault", asset_mint.key().as_ref()], bump)]
    pub vault: Account<'info, VaultState>,
    #[account(init, payer=admin, token::mint=asset_mint, token::authority=vault, seeds=[b"custody", vault.key().as_ref()], bump)]
    pub asset_custody: Account<'info, TokenAccount>,
    pub asset_mint: Account<'info, Mint>,
    #[account(mut)] pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds=[b"research_vault", vault.asset_mint.as_ref()], bump=vault.bump, has_one=asset_custody)]
    pub vault: Account<'info, VaultState>,
    #[account(mut, constraint=asset_custody.owner==vault.key() @ VaultError::InvalidCustody, constraint=asset_custody.mint==vault.asset_mint @ VaultError::InvalidCustody)]
    pub asset_custody: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer=user, space=8+UserShares::SPACE, seeds=[b"user_shares", vault.key().as_ref(),user.key().as_ref()], bump)]
    pub position: Account<'info, UserShares>,
    #[account(mut)] pub user: Signer<'info>,
    #[account(mut, constraint=user_asset.owner==user.key() @ VaultError::Unauthorized, constraint=user_asset.mint==vault.asset_mint @ VaultError::InvalidMint)]
    pub user_asset: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds=[b"research_vault", vault.asset_mint.as_ref()], bump=vault.bump, has_one=asset_custody)]
    pub vault: Account<'info, VaultState>,
    #[account(mut, constraint=asset_custody.owner==vault.key() @ VaultError::InvalidCustody, constraint=asset_custody.mint==vault.asset_mint @ VaultError::InvalidCustody)]
    pub asset_custody: Account<'info, TokenAccount>,
    #[account(mut, seeds=[b"user_shares",vault.key().as_ref(),user.key().as_ref()], bump, constraint=position.owner==user.key() @ VaultError::Unauthorized, constraint=position.vault==vault.key() @ VaultError::InvalidPosition)]
    pub position: Account<'info, UserShares>,
    #[account(mut)] pub user: Signer<'info>,
    #[account(mut, constraint=user_asset.owner==user.key() @ VaultError::Unauthorized, constraint=user_asset.mint==vault.asset_mint @ VaultError::InvalidMint)]
    pub user_asset: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ContributeRealizedFunds<'info> {
    #[account(seeds=[b"research_vault",vault.asset_mint.as_ref()],bump=vault.bump,has_one=admin,has_one=asset_custody)]
    pub vault: Account<'info, VaultState>,
    #[account(mut,constraint=asset_custody.owner==vault.key() @ VaultError::InvalidCustody,constraint=asset_custody.mint==vault.asset_mint @ VaultError::InvalidCustody)]
    pub asset_custody: Account<'info, TokenAccount>,
    #[account(mut, constraint=admin_asset.owner==admin.key() @ VaultError::Unauthorized, constraint=admin_asset.mint==vault.asset_mint @ VaultError::InvalidMint)]
    pub admin_asset: Account<'info, TokenAccount>,
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut,seeds=[b"research_vault",vault.asset_mint.as_ref()],bump=vault.bump,has_one=admin)]
    pub vault: Account<'info, VaultState>,
    pub admin: Signer<'info>,
}

#[account]
pub struct VaultState {
    pub admin: Pubkey,
    pub asset_mint: Pubkey,
    pub asset_custody: Pubkey,
    pub total_shares: u64,
    pub paused: bool,
    pub bump: u8,
}
impl VaultState { pub const SPACE: usize = 32+32+32+8+1+1; }
#[account]
pub struct UserShares { pub owner: Pubkey, pub vault: Pubkey, pub shares: u64 }
impl UserShares { pub const SPACE: usize = 32+32+8; }
#[event] pub struct Initialized { pub vault: Pubkey, pub admin: Pubkey, pub mint: Pubkey }
#[event] pub struct Deposited { pub owner: Pubkey, pub amount: u64, pub shares: u64 }
#[event] pub struct Withdrawn { pub owner: Pubkey, pub shares: u64, pub amount: u64 }
#[event] pub struct FundsContributed { pub amount: u64 }
#[event] pub struct PauseChanged { pub paused: bool }
#[error_code]
pub enum VaultError {
    #[msg("Unauthorized account")] Unauthorized,
    #[msg("Vault custody constraint failed")] InvalidCustody,
    #[msg("Asset mint mismatch")] InvalidMint,
    #[msg("User share record mismatch")] InvalidPosition,
    #[msg("Vault paused for deposits")] Paused,
    #[msg("Amount too small: minimum 1 USDC")] DepositTooSmall,
    #[msg("Share calculation rounded to zero")] ZeroShares,
    #[msg("No shares to redeem")] InsufficientShares,
    #[msg("Withdrawal would round to zero tokens")] ZeroPayout,
    #[msg("Zero amount not permitted")] ZeroAmount,
    #[msg("Vault has zero assets and outstanding shares")] Insolvent,
    #[msg("Only six-decimal SPL mints supported by reference implementation")] UnsupportedDecimals,
    #[msg("Checked arithmetic failed")] MathOverflow,
}

#[cfg(test)]
mod math_tests {
 use super::*;
 #[test] fn initial_share_price(){ assert_eq!(mul_div_floor(1000000,1000000,1000000).unwrap(),1000000); }
 #[test] fn donated_funds_increase_share_value(){ assert_eq!(mul_div_floor(1000000,2000000,1000000).unwrap(),2000000); }
 #[test] fn fractional_shares_round_down(){ assert_eq!(mul_div_floor(1,1,3).unwrap(),0); }
 #[test] fn checked_math(){ assert!(mul_div_floor(u64::MAX,u64::MAX,1).is_err()); }
}
