"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from './ConnectWallet';
import { SolPriceChart } from './SolPriceChart';
import { inspectWrappedSol } from '@/lib/native-sol';
import { Icon } from './Icons';
import { assertDevnetGenesis, decimalToUnits, explorerTransactionUrl, validateDevnetAmount } from '@/lib/devnet-execution';
import { reconcileUsdcMovement, type UsdcMovementProof } from '@/lib/collateral-reconciliation';
import { executeDriftDevnetAction, inspectDriftDevnetAccount, inspectDriftDevnetUsdc, inspectDriftDevnetUsdcReadiness, type DriftUsdcReadiness, type CollateralAsset, type ExecutionAction, type ExecutionResult } from '@/lib/drift-devnet';

type ConnectionState = 'idle'|'checking'|'verified'|'unavailable';
type DeskTab = 'trade'|'collateral'|'account'|'orders';
const ACTIONS = [
  { id: 'initialize', label: 'Initialize', tagline: 'Open a Drift user subaccount' },
  { id: 'deposit', label: 'Deposit', tagline: 'Deposit matching devnet USDC into Drift' },
  { id: 'withdraw', label: 'Withdraw', tagline: 'Withdraw matching devnet USDC to your wallet' },
  { id: 'unwrap', label: 'Unwrap wSOL', tagline: 'Return all wallet-owned wSOL to native SOL' },
  { id: 'long', label: 'Long', tagline: 'SOL-PERP bounded resting limit order' },
  { id: 'short', label: 'Short', tagline: 'SOL-PERP bounded resting limit order' },
  { id: 'cancel', label: 'Cancel', tagline: 'Cancel SOL-PERP open orders' },
] as const;

function compact(addr: string){ return `${addr.slice(0,6)}…${addr.slice(-6)}`; }
function readableError(err:unknown){
  if(!(err instanceof Error)) return 'Transaction could not be completed.';
  if(/reject|denied|cancelled/i.test(err.message)) return 'The wallet rejected the transaction; no action was submitted.';
  return err.message.slice(0,450);
}

export function DriftTradingLab() {
  const { connection }=useConnection();
  const { publicKey, connected }=useWallet();
  const signer=useAnchorWallet();
  const walletAddress=publicKey?.toBase58() ?? null;
  const [network,setNetwork]=useState<ConnectionState>('idle');
  const [genesis,setGenesis]=useState('');
  const [balance,setBalance]=useState<number|null>(null);
  const [wrappedBalance,setWrappedBalance]=useState<bigint|null>(null);
  const [usdcBalance,setUsdcBalance]=useState<bigint|null>(null);
  const [usdcMint,setUsdcMint]=useState('');
  const [usdcReadiness,setUsdcReadiness]=useState<DriftUsdcReadiness|null>(null);
  const [usdcChecking,setUsdcChecking]=useState(false);
  const [usdcCheckError,setUsdcCheckError]=useState('');
  const [collateralAsset,setCollateralAsset]=useState<CollateralAsset>('usdc');
  const [driftAccount,setDriftAccount]=useState<{address:string;exists:boolean}|null>(null);
  const [action,setAction]=useState<ExecutionAction>('long');
  const [tab,setTab]=useState<DeskTab>('trade');
  const [amount,setAmount]=useState('0.05');
  const [approved,setApproved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [pendingStep,setPendingStep]=useState('');
  const [error,setError]=useState('');
  const [result,setResult]=useState<ExecutionResult|null>(null);
  const [collateralProof,setCollateralProof]=useState<UsdcMovementProof|null>(null);
  const [collateralBaseline,setCollateralBaseline]=useState<{snapshot:DriftUsdcReadiness;action:'deposit'|'withdraw';amountRaw:string;wallet:string}|null>(null);
  const enableExecution = process.env.NEXT_PUBLIC_ENABLE_DEVNET_TRADING !== 'false';
  const current = ACTIONS.find(a=>a.id===action)!;
  const noAmount=action==='initialize'||action==='cancel'||action==='unwrap';
  const ready=Boolean(connected&&publicKey&&signer&&network==='verified'&&!busy&&enableExecution&&(action==='unwrap'?wrappedBalance!==null&&wrappedBalance>0n:driftAccount&&(action==='initialize'?!driftAccount.exists:driftAccount.exists)));

  const refresh=useCallback(async()=>{
    if(!connected||!publicKey||!signer){setNetwork('idle');setBalance(null);setDriftAccount(null);setWrappedBalance(null);setUsdcBalance(null);setUsdcReadiness(null);return;}
    setNetwork('checking');setError('');setDriftAccount(null);setUsdcReadiness(null);
    try{
      const hash=await connection.getGenesisHash();
      setGenesis(hash);
      assertDevnetGenesis(hash);
      const lamports=await connection.getBalance(publicKey,'confirmed');
      setBalance(lamports/1e9);
      try { const wsol = await inspectWrappedSol(connection,publicKey); setWrappedBalance(wsol.amount); }
      catch(err) { setWrappedBalance(null); setError(`Cannot verify wSOL balance: ${readableError(err)}`); }
      try{const quote=await inspectDriftDevnetUsdc(connection,signer);setUsdcBalance(quote.amount);setUsdcMint(quote.mint)}catch{setUsdcBalance(null);setUsdcMint('');}
      setNetwork('verified');
      // Account read is independent; a temporary Drift SDK/indexer problem must not fake network status.
      try{
        const account=await inspectDriftDevnetAccount(connection,signer);
        setDriftAccount({address:account.address,exists:account.exists});
      }catch(err){setError(`Drift account lookup unavailable: ${readableError(err)}`);}
    }catch(err){setNetwork('unavailable');setError(readableError(err));}
  },[connected,publicKey,signer,connection]);
  useEffect(()=>{void refresh();},[refresh]);
  // Never show a previous wallet's transaction evidence under a newly connected wallet.
  useEffect(()=>{setResult(null);setCollateralProof(null);setCollateralBaseline(null);},[walletAddress]);
  // First visit: show the required setup action immediately if the verified
  // account is missing. Do not repeatedly redirect when the user switches tabs.
  useEffect(() => {
    if (connected && network === 'verified' && driftAccount?.exists === false) {
      setTab('account');
      setAction('initialize');
      setApproved(false);
    }
  // Only react when the account's existence changes, not on every tab click.
  }, [connected, network, driftAccount?.exists]);

  async function checkUsdcCollateral(){
    if (!signer || !connected || network !== 'verified') return;
    setUsdcChecking(true); setUsdcCheckError(''); setUsdcReadiness(null);
    try {
      const state = await inspectDriftDevnetUsdcReadiness(connection, signer);
      setUsdcReadiness(state);
      setUsdcBalance(BigInt(state.walletAmount));
      setUsdcMint(state.mint);
    } catch (err) {
      setUsdcCheckError(readableError(err));
    } finally {
      setUsdcChecking(false);
    }
  }
  function choose(id:ExecutionAction){setAction(id);setApproved(false);setError('');setResult(null);setCollateralProof(null);setCollateralBaseline(null);setPendingStep('');setAmount(id==='long'||id==='short'?'0.01':collateralAsset==='usdc'?'5':'0.05');}
  async function submit(){
    if(!ready||!signer) return;
    if(!approved){setError('Review the action and tick the acknowledgement before signing.');return;}
    if(!noAmount){try{if((action==='deposit'||action==='withdraw')&&collateralAsset==='usdc'){const n=Number(amount);if(!Number.isFinite(n)||n<=0||n>100||!/^(?:\d+)(?:\.\d{1,6})?$/.test(amount))throw Error('Enter 0–100 test USDC, up to six decimals.');}else validateDevnetAmount(action as 'deposit'|'withdraw'|'long'|'short',amount);}catch(err){setError(readableError(err));return;}}
    setBusy(true);setError('');setResult(null);setCollateralProof(null);setCollateralBaseline(null);setApproved(false);
    setPendingStep('Checking devnet and preparing Drift transaction…');
    try{
      const usdcAction = (action === 'deposit' || action === 'withdraw') && collateralAsset === 'usdc';
      // An independent BEFORE snapshot is mandatory for USDC reconciliation.
      // Refuse to sign if the market, mint or user balance cannot be read.
      const before = usdcAction ? await inspectDriftDevnetUsdcReadiness(connection,signer) : null;
      const receipt=await executeDriftDevnetAction(connection,signer,action,amount,collateralAsset);
      setResult(receipt);
      if (usdcAction && before && receipt.confirmed && publicKey && (action === 'deposit' || action === 'withdraw')) {
        setCollateralBaseline({snapshot:before,action,amountRaw:decimalToUnits(amount,6).toString(),wallet:publicKey.toBase58()});
      }
      setPendingStep(receipt.confirmed?'Transaction signature confirmed. Rechecking chain balances…':'Transaction submitted; network confirmation is still unverified.');
      await refresh();
      if (usdcAction && before && receipt.confirmed && (action === 'deposit' || action === 'withdraw')) {
        try {
          // Rebuild a new client and re-read both token accounts at confirmed
          // commitment, rather than trusting the pre-transaction SDK cache.
          const after = await inspectDriftDevnetUsdcReadiness(connection,signer);
          setUsdcReadiness(after);
          setUsdcBalance(BigInt(after.walletAmount));
          setUsdcMint(after.mint);
          const proof = reconcileUsdcMovement(before,after,action,decimalToUnits(amount,6));
          setCollateralProof(proof);
          setPendingStep(proof.status === 'verified'
            ? 'Signature confirmed and matching on-chain collateral changes observed.'
            : 'Signature confirmed, but collateral changes are not reconciled. Check the balances again before proceeding.');
        } catch (verificationError) {
          setCollateralProof({status:'unverified',walletDeltaRaw:null,driftDeltaRaw:null,
            detail:`Fresh collateral balance read failed: ${readableError(verificationError)}`});
          setPendingStep('Signature confirmed. Collateral balance proof is unavailable; retry the read-only check.');
        }
      } else if (receipt.confirmed) {
        setPendingStep('Transaction confirmed. For limit orders, a confirmation does not establish a fill.');
      }
    }catch(err){setError(readableError(err));setPendingStep('Action was not verified as successful.');}
    finally{setBusy(false);}
  }
  async function recheckCollateralProof() {
    if (!collateralBaseline || !signer || !publicKey ||
        collateralBaseline.wallet !== publicKey.toBase58() || network !== 'verified') return;
    setUsdcChecking(true);
    try {
      const after=await inspectDriftDevnetUsdcReadiness(connection,signer);
      setUsdcReadiness(after);
      setUsdcBalance(BigInt(after.walletAmount));
      setUsdcMint(after.mint);
      const proof=reconcileUsdcMovement(
        collateralBaseline.snapshot,after,collateralBaseline.action,BigInt(collateralBaseline.amountRaw));
      setCollateralProof(proof);
      setPendingStep(proof.status === 'verified'
        ? 'Fresh confirmed-chain wallet and Drift USDC balance changes reconciled.'
        : 'Transaction receipt exists, but fresh token and Drift balances still do not reconcile.');
    } catch (reason) {
      setCollateralProof({status:'unverified',detail:readableError(reason),walletDeltaRaw:null,driftDeltaRaw:null});
    } finally {setUsdcChecking(false);}
  }
  const tabs: {id:DeskTab;label:string;action:ExecutionAction}[]=[
    {id:'trade',label:'Trade',action:'long'},
    {id:'collateral',label:'Collateral',action:'deposit'},
    {id:'account',label:'Account',action:'initialize'},
    {id:'orders',label:'Orders',action:'cancel'},
  ];
  function selectTab(next:DeskTab){setTab(next);choose(tabs.find(t=>t.id===next)!.action);}
  return <div className="sn-v6-trade" aria-label="Drift devnet execution workspace">
    <div className="sn-v6-trade-bar"><div className="sn-v6-market-name"><span className="sn-v6-market-icon">◎</span><div><strong>SOL-PERP</strong><span>Drift · Solana Devnet</span></div></div><div className="sn-v6-market-signals"><span className={network==='verified'?'online':''}><i/>{network==='verified'?'Verified devnet':network==='checking'?'Checking network':network==='unavailable'?'RPC not verified':'Connect wallet'}</span><span>1% oracle-bound limit orders may remain open</span></div><button type="button" className="sn-v6-refresh" disabled={!connected||busy} onClick={()=>void refresh()}>↻ Refresh</button></div>
    <div className="sn-v61-setup-banner" role="status">
      <div className="sn-v61-setup-copy">
        <span>DRIFT ACCOUNT SETUP</span>
        <strong>{!connected ? '1 / Connect Phantom or Solflare' : network === 'checking' ? 'Checking devnet…' : network !== 'verified' ? 'Verify your devnet RPC' : driftAccount === null ? 'Checking your Drift user account…' : driftAccount.exists ? 'Drift account verified' : '2 / Initialize your Drift account'}</strong>
        <p>{!connected ? 'Connect a test wallet to begin.' : network === 'unavailable' ? 'RPC identity must match Solana devnet before you can sign.' : driftAccount === null ? 'If this check fails, retry. No account creation is assumed.' : driftAccount.exists ? 'Account exists. You can review collateral or open a small devnet order.' : 'Your wallet is connected, but Drift needs a user account before you can deposit or trade.'}</p>
      </div>
      <div className="sn-v61-setup-actions">
        {!connected ? <ConnectWallet/> : network === 'verified' && driftAccount && !driftAccount.exists ? <button type="button" className="sn-v61-setup-primary" onClick={() => selectTab('account')}>Initialize Drift Account →</button> : network === 'verified' && driftAccount?.exists ? <button type="button" className="sn-v61-setup-primary" onClick={() => selectTab('collateral')}>Manage Collateral →</button> : <button type="button" className="sn-v61-setup-primary" disabled={busy} onClick={() => void refresh()}>Retry account check ↻</button>}
      </div>
    </div>
    <div className="sn-v7-trade-workspace"><div className="sn-v7-market-context"><SolPriceChart/><aside className="sn-v7-market-clarity"><span>LIVE REFERENCE / VERIFIED SOURCE</span><h3>Watch SOL. Review every order.</h3><p>The candle chart shows <strong>Coinbase SOL/USD spot</strong>. Wallet signatures below execute separate <strong>Drift SOL-PERP devnet</strong> actions. Spot candles are never used as the oracle or as a guarantee of a fill.</p><div><strong>01</strong> Observe the market</div><div><strong>02</strong> Initialize Drift account</div><div><strong>03</strong> Deposit test collateral</div><div><strong>04</strong> Approve each order</div></aside></div>
    <div className="sn-v7-trade-order-column"><div className="sn-v6-trade-tabs" role="tablist" aria-label="Trading tools">{tabs.map(item=><button type="button" role="tab" aria-selected={tab===item.id} key={item.id} className={tab===item.id?'active':''} onClick={()=>selectTab(item.id)}>{item.label}</button>)}</div>
    <div className="sn-v6-trade-grid">
      <section className="sn-v6-ticket" aria-label="Transaction form">
       <div className="sn-v6-ticket-header"><div><span>YOUR ORDER TICKET</span><h2>{tab==='trade'?'Place an order':tab==='collateral'?'Manage collateral':tab==='account'?'Drift account':'Manage orders'}</h2></div><span className="sn-v6-test-pill">TEST ASSETS ONLY</span></div>
       {tab==='trade'&&<div className="sn-v6-direction" role="group" aria-label="Order side"><button type="button" onClick={()=>choose('long')} className={action==='long'?'buy active':'buy'} aria-pressed={action==='long'}>↗ Long</button><button type="button" onClick={()=>choose('short')} className={action==='short'?'sell active':'sell'} aria-pressed={action==='short'}>↘ Short</button></div>}
       {tab==='collateral'&&<div className="sn-v6-direction sn-v8-collateral-modes" role="group" aria-label="Collateral action"><button type="button" onClick={()=>choose('deposit')} className={action==='deposit'?'buy active':'buy'} aria-pressed={action==='deposit'}>↓ Deposit</button><button type="button" onClick={()=>choose('withdraw')} className={action==='withdraw'?'sell active':'sell'} aria-pressed={action==='withdraw'}>↑ Withdraw</button><button type="button" onClick={()=>choose('unwrap')} className={action==='unwrap'?'active':''} aria-pressed={action==='unwrap'}>↩ Unwrap wSOL</button></div>}
       {tab==='collateral'&&action!=='unwrap'&&<div className="sn-v73-asset-picker"><span>COLLATERAL ASSET</span><div role="group" aria-label="Choose Drift devnet collateral"><button type="button" aria-pressed={collateralAsset==='usdc'} className={collateralAsset==='usdc'?'active':''} onClick={()=>{setCollateralAsset('usdc');setAmount('5');setApproved(false);setError('')}}>USDC · preferred</button><button type="button" aria-pressed={collateralAsset==='wsol'} className={collateralAsset==='wsol'?'active':''} onClick={()=>{setCollateralAsset('wsol');setAmount('0.05');setApproved(false);setError('')}}>wSOL · if supported</button></div><small>USDC wallet balance: {usdcBalance===null?'Not verified':(Number(usdcBalance)/1e6).toFixed(2)} · Drift-configured mint: {usdcMint||'Checking…'}</small></div>}
       {tab==='collateral' && action!=='unwrap' && collateralAsset==='usdc' &&
         <div className="sn-v74-collateral-check" role="region" aria-label="USDC collateral readiness">
           <div className="sn-v74-check-heading"><div><strong>Verify USDC deposit & withdrawal readiness</strong><small>Checks the actual Drift spot market, matching token mint, wallet USDC and deposited Drift balance. No signature required.</small></div><button type="button" onClick={() => void checkUsdcCollateral()} disabled={!connected || network!=='verified' || busy || usdcChecking}>{usdcChecking?'Checking…':'Check collateral ↻'}</button></div>
           {usdcCheckError && <p role="alert" className="trade-warning">{usdcCheckError}</p>}
           {usdcReadiness && <div className="sn-v74-check-result">
             <p><strong>Market verified:</strong> Spot #{usdcReadiness.marketIndex} · {usdcReadiness.decimals} decimals</p>
             <p><strong>Mint:</strong> <code>{usdcReadiness.mint}</code></p>
             <p><strong>Wallet USDC:</strong> {(Number(BigInt(usdcReadiness.walletAmount))/10**usdcReadiness.decimals).toLocaleString('en-US',{maximumFractionDigits:6})}</p>
             <p><strong>Deposited in Drift:</strong> {usdcReadiness.driftDepositedAmount===null?'Drift account missing':(Number(BigInt(usdcReadiness.driftDepositedAmount))/10**usdcReadiness.decimals).toLocaleString('en-US',{maximumFractionDigits:6})}</p>
             {!usdcReadiness.userAccountExists ? <p className="trade-warning">Initialize the Drift account before collateral operations.</p> : BigInt(usdcReadiness.walletAmount)===0n && action==='deposit' ? <p className="trade-warning">Your wallet has 0 of the EXACT devnet USDC mint used by this market. Acquire matching test USDC first. Ordinary devnet SOL, Circle USDC, and other faucet tokens may use different mints and cannot be substituted.</p> : <p>Collateral market verified. Signing may proceed, subject to your balance and Drift's margin rules.</p>}
           </div>}
           {!usdcReadiness && !usdcChecking && !usdcCheckError && <small>Run this check before attempting any transfer. The app will also check inside the signing flow.</small>}
         </div>}
       {tab==='account'&&<div className="sn-v6-action-info"><strong>{driftAccount?.exists?'Drift account found':'Initialize your Drift user account'}</strong><p>{driftAccount?.exists?'Your derived Drift User account exists on devnet.':'Read the acknowledgement below and click Initialize Drift Account to open a Phantom/Solflare signing request. Test SOL is required for account creation fees.'}</p></div>}
       {tab==='orders'&&<div className="sn-v6-action-info"><strong>Cancel SOL-PERP orders</strong><p>This cancels outstanding orders in your personal Drift User account. It does not close an open position. Open-order counts are not yet independently decoded.</p></div>}
       {!noAmount&&<label className="sn-v6-trade-amount"><span>SIZE <small>{tab==='trade'?'BASE SOL':collateralAsset==='usdc'?'TEST USDC':'DEVNET SOL'}</small></span><input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={amount} onChange={e=>{setAmount(e.target.value);setApproved(false);}} placeholder="0.05" /><span className="sn-v6-trade-limit">{tab==='trade'?'Maximum 0.1 SOL base per order':collateralAsset==='usdc'?'Maximum 100 devnet USDC':'Maximum 0.5 devnet SOL'}</span></label>}
       <div className="sn-v6-ticket-facts"><div><span>Venue</span><strong>Drift · devnet</strong></div><div><span>Execution</span><strong>{tab==='trade'?'Oracle-bounded resting limit':tab==='collateral'?(action==='unwrap'?'Close wallet wSOL account':'Verified market · wallet-owned token'):'Wallet-signed transaction'}</strong></div><div><span>Account</span><strong>{driftAccount?.exists?'Verified existing':driftAccount===null?'Unverified':'Not initialized'}</strong></div></div>
       {tab==='trade'&&<p className="sn-v6-exec-note">This is a resting LIMIT order with a 1% oracle price guard, not an instant trade. If it does not fill, it may remain open until cancelled in Orders. A confirmed signature never proves a fill.</p>}
       {tab==='collateral'&&<div className="sn-v8-wsol-context"><div><span>WALLET wSOL · VERIFIED DEVNET BALANCE</span><strong>{wrappedBalance===null?'Unavailable':(Number(wrappedBalance)/1e9).toLocaleString('en-US',{maximumFractionDigits:9})+' wSOL'}</strong></div><p>{action==='deposit'?(collateralAsset==='usdc'?'Devnet USDC (not native SOL) is required. SolNeutral checks the mint, actual Drift spot market and wallet token balance BEFORE signing. Get matching test USDC from a supported Drift devnet faucet; no minting occurs inside SolNeutral.':'Drift wSOL market must exist before any wrapping. Unsupported markets are disabled; use devnet USDC when available.'):action==='withdraw'?(collateralAsset==='usdc'?'Withdraw deposited devnet USDC to your existing wallet token account, subject to verified available deposits and Drift margin rules.':'Withdraw deposited wSOL to your wallet, then unwrap separately.'): 'Recovery: closes your wallet-owned wSOL token account and returns its ENTIRE balance and rent to native SOL. This does not withdraw any funds deposited inside Drift.'}</p></div>}
       <label className="sn-v6-trade-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/><span>I reviewed this devnet action. Orders may remain open until cancelled; all actions require my wallet signature with test assets.</span></label>
       <button type="button" className="trade-submit" disabled={!ready||!approved} onClick={()=>void submit()}>{busy?'Awaiting wallet approval…':action === 'initialize' ? 'Initialize Drift Account ↗' : `Review & sign ${action}`} <Icon name="arrowUp" size={16}/></button>
       {!connected&&<div className="sn-v6-trade-connect"><ConnectWallet/><small>Connect Phantom or Solflare to continue.</small></div>}
       {!enableExecution&&<p className="trade-warning">Trading is disabled by project configuration.</p>}
       {network==='unavailable'&&<p className="trade-warning">This RPC has not passed the devnet identity check. Transactions are locked.</p>}
       {connected&&network==='verified'&&driftAccount&&!driftAccount.exists&&tab!=='account'&&<p className="trade-warning">A Drift account is required. <button type="button" className="sn-v61-inline-setup" onClick={() => selectTab('account')}>Open account setup →</button></p>}
       {error&&<p className="trade-warning" role="alert">{error}</p>}
       {pendingStep&&<p className="trade-progress" role="status">{pendingStep}</p>}
       {result&&<div className="trade-receipt"><strong>{result.confirmed?'Transaction signature confirmed on devnet':'Transaction confirmation unverified'}</strong><p>{result.description}</p><a href={explorerTransactionUrl(result.signature)} rel="noopener noreferrer" target="_blank">View transaction ↗</a><code>{result.signature}</code></div>}
       {collateralProof&&<div className="trade-receipt" role="status"><strong>{collateralProof.status==='verified'?'USDC BALANCE MOVEMENT VERIFIED':'USDC BALANCE MOVEMENT NOT VERIFIED'}</strong><p>{collateralProof.detail}</p>{collateralProof.walletDeltaRaw!==null&&<p>Wallet USDC change: {Number(BigInt(collateralProof.walletDeltaRaw))/1e6} · Drift spot change: {Number(BigInt(collateralProof.driftDeltaRaw!))/1e6} USDC</p>}{collateralProof.status==='unverified'&&collateralBaseline&&<button type="button" disabled={usdcChecking||busy||network!=='verified'} onClick={()=>void recheckCollateralProof()}>{usdcChecking?'Rechecking…':'Recheck collateral proof ↻'}</button>}</div>}
      </section>
      <aside className="sn-v6-trade-side">
        <section className="sn-v6-side-card"><div className="sn-v6-side-head"><h3>Account overview</h3><span>{network==='verified'?'DEVNET':'NOT VERIFIED'}</span></div><div className="sn-v6-account-number"><small>NATIVE SOL · WALLET</small><strong>{balance===null?'—':balance.toLocaleString('en-US',{maximumFractionDigits:6})} <em>SOL</em></strong></div><div className="sn-v6-ticket-facts"><div><span>Wallet</span><strong>{publicKey?compact(publicKey.toBase58()):'Not connected'}</strong></div><div><span>Wrapped SOL · wallet</span><strong>{wrappedBalance===null?'Unverified':`${(Number(wrappedBalance)/1e9).toFixed(6)} wSOL`}</strong></div><div><span>Devnet USDC · wallet</span><strong>{usdcBalance===null?'Unverified':`${(Number(usdcBalance)/1e6).toFixed(2)} USDC`}</strong></div><div><span>Drift account</span><strong>{driftAccount?(driftAccount.exists?'Exists':'Not initialized'):'Not verified'}</strong></div><div><span>Drift USDC spot balance</span><strong>{usdcReadiness?.driftDepositedAmount===null||!usdcReadiness?'Not independently read':`${Number(BigInt(usdcReadiness.driftDepositedAmount))/1e6} USDC (signed)`}</strong></div><div><span>Trading collateral / PnL</span><strong>Not independently verified</strong></div></div><div className="sn-v6-side-note">Native SOL and wallet-owned wSOL are separate from your deposited Drift collateral. If a deposit fails after wrapping, select Collateral → Unwrap wSOL to recover wallet-owned wSOL.</div></section>
        <section className="sn-v6-side-card sn-v6-safety"><div className="sn-v6-side-head"><h3>Execution safety</h3><Icon name="shield" size={19}/></div><div className="sn-v6-evidence-row"><span>Network</span><strong>{network==='verified'?'VERIFIED':'CHECK REQUIRED'}</strong></div><div className="sn-v6-evidence-row"><span>Mainnet</span><strong>DISABLED</strong></div><div className="sn-v6-evidence-row"><span>Vault deposits</span><strong>NOT ENABLED</strong></div><a target="_blank" rel="noopener noreferrer" href="https://faucet.solana.com/">Get devnet test SOL ↗</a></section>
      </aside>
    </div>
    </div>
    </div>
   </div>;
}
