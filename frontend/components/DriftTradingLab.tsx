"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from './ConnectWallet';
import { SolPriceChart } from './SolPriceChart';
import { inspectWrappedSol } from '@/lib/native-sol';
import { Icon } from './Icons';
import { assertDevnetGenesis, decimalToUnits, explorerTransactionUrl, validateDevnetAmount } from '@/lib/devnet-execution';
import { reconcileUsdcMovement, type UsdcMovementProof } from '@/lib/collateral-reconciliation';
import { executeDriftDevnetAction, inspectDriftDevnetAccount, inspectDriftDevnetUsdc, inspectDriftDevnetUsdcReadiness, prepareDriftDevnetUsdcReceiveAccount, inspectDriftDevnetWsolReadiness, type DriftWsolReadiness, type DriftUsdcReadiness, type CollateralAsset, type ExecutionAction, type ExecutionResult } from '@/lib/drift-devnet';

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
  if(/user rejected|user denied|rejected by user|denied by user|cancelled by user|wallet rejected/i.test(err.message)) return 'You declined the wallet approval. No transaction was signed.';
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
  const [receiveNotice,setReceiveNotice]=useState('');
  const [receiveSignature,setReceiveSignature]=useState('');
  const autoCheckKey = useRef('');
  const [wsolChecking,setWsolChecking]=useState(false);
  const [wsolReadiness,setWsolReadiness]=useState<DriftWsolReadiness|null>(null);
  const [wsolCheckError,setWsolCheckError]=useState('');
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
  const currentUsdcUnits = (() => { try { return decimalToUnits(amount, 6); } catch { return null; } })();
  const usdcDepositReady = Boolean(usdcReadiness !== null && usdcReadiness.walletTokenAccountExists && currentUsdcUnits !== null && currentUsdcUnits > 0n &&
    BigInt(usdcReadiness.walletAmount) >= currentUsdcUnits);
  const usdcWithdrawReady = Boolean(usdcReadiness !== null && usdcReadiness.walletTokenAccountExists && currentUsdcUnits !== null && currentUsdcUnits > 0n &&
    usdcReadiness.driftDepositedAmount !== null && BigInt(usdcReadiness.driftDepositedAmount) >= currentUsdcUnits);
  const needsUsdc = tab === 'collateral' && collateralAsset === 'usdc' && (action === 'deposit' || action === 'withdraw');
  const collateralCanSign = !needsUsdc || (action === 'deposit' ? usdcDepositReady : usdcWithdrawReady);
  const canSign = ready && approved && collateralCanSign;


  const refresh=useCallback(async()=>{
    if(!connected||!publicKey||!signer){setNetwork('idle');setBalance(null);setDriftAccount(null);setWrappedBalance(null);setUsdcBalance(null);setUsdcReadiness(null);setWsolReadiness(null);return;}
    autoCheckKey.current='';setNetwork('checking');setError('');setDriftAccount(null);setUsdcReadiness(null);setWsolReadiness(null);
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
  useEffect(()=>{setResult(null);setCollateralProof(null);setCollateralBaseline(null);setWsolReadiness(null);setUsdcReadiness(null);setReceiveNotice('');setReceiveSignature('');autoCheckKey.current='';},[walletAddress]);
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
    setUsdcChecking(true); setUsdcCheckError(''); setError(''); setUsdcReadiness(null);setWsolReadiness(null);
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
  // Verify the market automatically on entering Collateral. There is no signature.
  // A wallet-scoped key prevents repeated polling on every UI rerender.
  useEffect(() => {
    if (tab !== 'collateral' || collateralAsset !== 'usdc' || !signer ||
        !connected || !walletAddress || network !== 'verified') return;
    const key = `${walletAddress}:usdc:devnet`;
    if (autoCheckKey.current === key) return;
    autoCheckKey.current = key;
    void checkUsdcCollateral();
  }, [tab, collateralAsset, signer, connected, walletAddress, network, connection]);

  async function copyReceive(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setReceiveNotice(`${label} copied. Only use Solana devnet and the exact token mint shown here.`);
    } catch { setReceiveNotice(`Copy unavailable in this browser. Select the ${label.toLowerCase()} text to copy it.`); }
  }

  async function prepareReceive() {
    if (!signer || !publicKey || network !== 'verified' || !usdcReadiness || busy) return;
    setBusy(true); setReceiveNotice('Preparing the wallet token account. Approve the devnet transaction in your wallet.');
    setReceiveSignature('');
    try {
      const result = await prepareDriftDevnetUsdcReceiveAccount(connection, signer, usdcReadiness.mint);
      setReceiveSignature(result.signature ?? '');
      setReceiveNotice(result.signature
        ? 'Receiving account created and verified on devnet. It holds 0 tokens until a matching-mint sender funds it.'
        : 'Your receiving account already exists and has been verified. It holds only tokens received from others.');
      await checkUsdcCollateral();
      // checkUsdcCollateral does not reset the receive success message.
    } catch (reason) { setReceiveNotice(`Could not prepare the receiving account: ${readableError(reason)}`); }
    finally { setBusy(false); }
  }

  async function checkSolCollateral(){
    if(!signer||!connected||network!=='verified')return;
    setWsolChecking(true);setWsolCheckError('');setWsolReadiness(null);
    try {setWsolReadiness(await inspectDriftDevnetWsolReadiness(connection,signer));}
    catch(err){setWsolCheckError(readableError(err));}
    finally{setWsolChecking(false);}
  }
  function useWalletSol(){
    setTab('collateral');setCollateralAsset('wsol');choose('deposit');setAmount('0.05');
    void checkSolCollateral();
  }
  function choose(id:ExecutionAction){setAction(id);setApproved(false);setError('');setResult(null);setCollateralProof(null);setCollateralBaseline(null);setPendingStep('');setAmount(id==='long'||id==='short'?'0.01':collateralAsset==='usdc'?'5':'0.05');}
  async function submit(){
    if(!ready||!signer) return;
    if(!approved){setError('Review the action and tick the acknowledgement before signing.');return;}
    if (needsUsdc && !collateralCanSign) {setTab('collateral');setError('First receive the matching test USDC and refresh your wallet balance. No transaction was sent.');return;}
    if(!noAmount){try{if((action==='deposit'||action==='withdraw')&&collateralAsset==='usdc'){const n=Number(amount);if(!Number.isFinite(n)||n<=0||n>100||!/^(?:\d+)(?:\.\d{1,6})?$/.test(amount))throw Error('Enter 0–100 test USDC, up to six decimals.');}else validateDevnetAmount(action as 'deposit'|'withdraw'|'long'|'short',amount);}catch(err){setError(readableError(err));return;}}
    if((action==='deposit'||action==='withdraw')&&collateralAsset==='wsol'&&!wsolReadiness){setError('Check the supported Drift SOL market before signing. No transaction was sent.');return;}
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
        <p>{!connected ? 'Connect a test wallet to begin.' : network === 'unavailable' ? 'RPC identity must match Solana devnet before you can sign.' : driftAccount === null ? 'If this check fails, retry. No account creation is assumed.' : driftAccount.exists ? 'Next: deposit supported USDC or SOL collateral before placing an order. Wallet SOL is not automatically Drift margin.' : 'Initialize your Drift account before depositing or trading. Your wallet stays in control of every signature.'}</p>
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
       {tab==='trade'&&<div className="sn-v75-collateral-guide"><strong>Before trading, fund your Drift account</strong><p>Your wallet may hold SOL while your Drift free collateral is zero. Deposit USDC matching Drift's mint, or check whether this devnet deployment accepts wrapped SOL.</p><div className="sn-v75-guide-actions"><button type="button" onClick={()=>selectTab('collateral')}>Open deposits →</button><button type="button" onClick={useWalletSol} disabled={!connected||network!=='verified'||!driftAccount?.exists}>Use my devnet SOL →</button></div></div>}
       {tab==='trade'&&<div className="sn-v6-direction" role="group" aria-label="Order side"><button type="button" onClick={()=>choose('long')} className={action==='long'?'buy active':'buy'} aria-pressed={action==='long'}>↗ Long</button><button type="button" onClick={()=>choose('short')} className={action==='short'?'sell active':'sell'} aria-pressed={action==='short'}>↘ Short</button></div>}
       {tab==='collateral'&&<div className="sn-v6-direction sn-v8-collateral-modes" role="group" aria-label="Collateral action"><button type="button" onClick={()=>choose('deposit')} className={action==='deposit'?'buy active':'buy'} aria-pressed={action==='deposit'}>↓ Deposit</button><button type="button" onClick={()=>choose('withdraw')} className={action==='withdraw'?'sell active':'sell'} aria-pressed={action==='withdraw'}>↑ Withdraw</button><button type="button" onClick={()=>choose('unwrap')} className={action==='unwrap'?'active':''} aria-pressed={action==='unwrap'}>↩ Unwrap wSOL</button></div>}
       {tab==='collateral'&&action!=='unwrap'&&<div className="sn-v73-asset-picker"><span>COLLATERAL ASSET</span><div role="group" aria-label="Choose Drift devnet collateral"><button type="button" aria-pressed={collateralAsset==='usdc'} className={collateralAsset==='usdc'?'active':''} onClick={()=>{setCollateralAsset('usdc');setAmount('5');setApproved(false);setError('')}}>USDC · preferred</button><button type="button" aria-pressed={collateralAsset==='wsol'} className={collateralAsset==='wsol'?'active':''} onClick={()=>{setCollateralAsset('wsol');setAmount('0.05');setApproved(false);setError('')}}>wSOL · if supported</button></div><small>USDC wallet balance: {usdcBalance===null?'Checking…':(Number(usdcBalance)/1e6).toFixed(2)} · Verify the mint and receiving address below</small></div>}
       {tab==='collateral' && action!=='unwrap' && collateralAsset==='wsol' && <div className="sn-v74-collateral-check" role="region" aria-label="Wrapped SOL collateral readiness"><div className="sn-v74-check-heading"><div><strong>Can your SOL fund Drift?</strong><small>Read-only check of the actual wSOL spot market and your wallet balances. No SOL is wrapped by checking.</small></div><button type="button" disabled={!connected||network!=='verified'||busy||wsolChecking} onClick={()=>void checkSolCollateral()}>{wsolChecking?'Checking…':'Check SOL market ↻'}</button></div>{wsolCheckError&&<p role="alert" className="trade-warning">{wsolCheckError} Use the matching test USDC instead if SOL is not supported.</p>}{wsolReadiness&&<div className="sn-v74-check-result"><p><strong>Market verified:</strong> Spot #{wsolReadiness.marketIndex} · wSOL</p><p><strong>Wallet native SOL:</strong> {(Number(BigInt(wsolReadiness.walletSolLamports))/1e9).toFixed(4)} SOL</p><p><strong>Wallet wrapped SOL:</strong> {(Number(BigInt(wsolReadiness.walletWsolLamports))/1e9).toFixed(4)} wSOL</p><p><strong>Drift wSOL deposited:</strong> {wsolReadiness.depositedWsolLamports===null?'Initialize Drift account first':(Number(BigInt(wsolReadiness.depositedWsolLamports))/1e9).toFixed(4)+' wSOL'}</p><p>Depositing SOL first wraps only the needed amount in your wallet (one signature), then requests a separate Drift deposit signature. If the second step fails, the wSOL stays in your wallet; use Unwrap wSOL to recover it.</p></div>}</div>}
       {tab==='collateral' && action!=='unwrap' && collateralAsset==='usdc' &&
         <div className="sn-v74-collateral-check" role="region" aria-label="USDC collateral readiness">
           <div className="sn-v74-check-heading"><div><strong>Verify USDC deposit & withdrawal readiness</strong><small>Reads Drift spot market #0 directly on-chain, verifies its mint and your wallet and Drift balances. No wallet signature required.</small></div><button type="button" onClick={() => void checkUsdcCollateral()} disabled={!connected || network!=='verified' || busy || usdcChecking}>{usdcChecking?'Checking…':'Check collateral ↻'}</button></div>
           {usdcCheckError && <div role="alert" className="trade-warning"><p>{usdcCheckError}</p><p>No transfer was sent by this read-only check. Ensure your Vercel devnet RPC is healthy, then retry. If the actual market does not exist, using another token or deploying a vault cannot create it.</p></div>}
           {usdcReadiness && <div className="sn-v754-funding-flow">
             <div className="sn-v754-balance-row"><div><small>DRIFT QUOTE MARKET #0 · VERIFIED</small><strong>{(Number(BigInt(usdcReadiness.walletAmount)) / 10 ** usdcReadiness.decimals).toLocaleString('en-US',{maximumFractionDigits:6})} <em>test USDC in wallet</em></strong></div><span className={BigInt(usdcReadiness.walletAmount)>0n?'sn-v754-good':'sn-v754-awaiting'}>{BigInt(usdcReadiness.walletAmount)>0n?'Funds detected':'Awaiting tokens'}</span></div>
             <div className="sn-v754-steps"><span className="active">01 · Receive</span><span>02 · Deposit</span><span>03 · Trade / Withdraw</span></div>
             <div className="sn-v754-receive">
               <div className="sn-v754-receive-intro"><div><strong>Receive Drift-compatible test USDC</strong><p>Use the connected devnet wallet and the exact quote mint. This prepares your receiving account; it does not create test money.</p></div>{!usdcReadiness.walletTokenAccountExists && <button type="button" className="sn-v754-create" disabled={busy||!connected||network!=='verified'} onClick={()=>void prepareReceive()}>{busy?'Waiting for wallet…':'1. Prepare receiving account ↗'}</button>}</div>
               <div className="sn-v754-receive-address"><span>YOUR DEVNET WALLET ADDRESS</span><code>{publicKey?.toBase58()}</code><button type="button" disabled={!publicKey} onClick={()=>publicKey&&void copyReceive(publicKey.toBase58(),'Wallet address')}>Copy wallet</button></div>
               <div className="sn-v754-receive-address"><span>EXACT TOKEN MINT · MUST MATCH DRIFT</span><code>{usdcReadiness.mint}</code><button type="button" onClick={()=>void copyReceive(usdcReadiness.mint,'Token mint')}>Copy mint</button></div>
               <div className="sn-v754-receive-address"><span>YOUR ASSOCIATED USDC TOKEN ACCOUNT</span><code>{usdcReadiness.walletTokenAccount}</code><button type="button" onClick={()=>void copyReceive(usdcReadiness.walletTokenAccount,'Receiving token-account address')}>Copy token account</button></div>
               <div className="sn-v754-receive-status"><span>{usdcReadiness.walletTokenAccountExists?'✓ Receiving account is ready':'○ Receiving account not created yet'}</span><a href={`https://explorer.solana.com/address/${usdcReadiness.mint}?cluster=devnet`} target="_blank" rel="noopener noreferrer">Inspect mint ↗</a></div>
               {receiveNotice&&<p className="sn-v754-info" role="status">{receiveNotice}</p>}
               {receiveSignature&&<a className="sn-v754-receipt" href={explorerTransactionUrl(receiveSignature)} target="_blank" rel="noopener noreferrer">View receiving-account transaction ↗</a>}
               <div className="sn-v754-caution"><strong>How to get the tokens</strong><p>Request this exact mint from a compatible Drift devnet token source or someone who already holds it. Circle's standard Solana devnet USDC is a different mint and will not fund this market. SolNeutral cannot mint tokens without the mint authority. Never send real USDC here.</p></div>
               <button type="button" className="sn-v754-refresh" onClick={()=>void checkUsdcCollateral()} disabled={usdcChecking||busy}>{usdcChecking?'Checking devnet…':'2. I received tokens — refresh balance ↻'}</button>
             </div>
             <div className="sn-v754-drift-balance"><span>ALREADY DEPOSITED IN DRIFT</span><strong>{usdcReadiness.driftDepositedAmount===null?'Initialize your Drift account first':(Number(BigInt(usdcReadiness.driftDepositedAmount))/10**usdcReadiness.decimals).toLocaleString('en-US',{maximumFractionDigits:6})+' USDC'}</strong></div>
             {action==='deposit' && BigInt(usdcReadiness.walletAmount) === 0n && <p className="sn-v754-next">Next step: get the matching test tokens into this wallet, then refresh. Deposit unlocks when your balance covers the amount.</p>}
             {action==='withdraw' && usdcReadiness.driftDepositedAmount!==null && BigInt(usdcReadiness.driftDepositedAmount)===0n && <p className="sn-v754-next">You have no deposited USDC to withdraw. Fund the Drift account first.</p>}
           </div>}
           {!usdcReadiness && !usdcChecking && !usdcCheckError && <small>Run this check before attempting any transfer. The app will also check inside the signing flow.</small>}
         </div>}
       {tab==='account'&&<div className="sn-v6-action-info"><strong>{driftAccount?.exists?'Drift account found':'Initialize your Drift user account'}</strong><p>{driftAccount?.exists?'Your derived Drift User account exists on devnet.':'Read the acknowledgement below and click Initialize Drift Account to open a Phantom/Solflare signing request. Test SOL is required for account creation fees.'}</p></div>}
       {tab==='orders'&&<div className="sn-v6-action-info"><strong>Cancel SOL-PERP orders</strong><p>This cancels outstanding orders in your personal Drift User account. It does not close an open position. Open-order counts are not yet independently decoded.</p></div>}
       {!noAmount&&<label className="sn-v6-trade-amount"><span>SIZE <small>{tab==='trade'?'BASE SOL':collateralAsset==='usdc'?'TEST USDC':'DEVNET SOL'}</small></span><input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={amount} onChange={e=>{setAmount(e.target.value);setApproved(false);}} placeholder="0.05" /><span className="sn-v6-trade-limit">{tab==='trade'?'Maximum 0.1 SOL base per order':collateralAsset==='usdc'?'Maximum 100 devnet USDC':'Maximum 0.5 devnet SOL'}</span></label>}
       <div className="sn-v6-ticket-facts"><div><span>Venue</span><strong>Drift · devnet</strong></div><div><span>Execution</span><strong>{tab==='trade'?'Oracle-bounded resting limit':tab==='collateral'?(action==='unwrap'?'Close wallet wSOL account':'Verified market · wallet-owned token'):'Wallet-signed transaction'}</strong></div><div><span>Account</span><strong>{driftAccount?.exists?'Verified existing':driftAccount===null?'Unverified':'Not initialized'}</strong></div></div>
       {tab==='trade'&&<p className="sn-v6-exec-note">This is a resting LIMIT order with a 1% oracle price guard, not an instant trade. If it does not fill, it may remain open until cancelled in Orders. A confirmed signature never proves a fill.</p>}
       {tab==='collateral'&&(collateralAsset==='wsol'||action==='unwrap')&&<div className="sn-v8-wsol-context"><div><span>WALLET wSOL · VERIFIED DEVNET BALANCE</span><strong>{wrappedBalance===null?'Checking balance…':(Number(wrappedBalance)/1e9).toLocaleString('en-US',{maximumFractionDigits:9})+' wSOL'}</strong></div><p>{action==='deposit'?(collateralAsset==='usdc'?'Receive matching-mint test USDC into your devnet wallet first. Once your wallet has enough, Drift deposits can be signed. No tokens are minted in SolNeutral.':'Drift wSOL market must exist before any wrapping. Unsupported markets are disabled; use devnet USDC when available.'):action==='withdraw'?(collateralAsset==='usdc'?'Withdraw deposited devnet USDC to your existing wallet token account, subject to verified available deposits and Drift margin rules.':'Withdraw deposited wSOL to your wallet, then unwrap separately.'): 'Recovery: closes your wallet-owned wSOL token account and returns its ENTIRE balance and rent to native SOL. This does not withdraw any funds deposited inside Drift.'}</p></div>}
       <label className="sn-v6-trade-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/><span>I reviewed this devnet action. Orders may remain open until cancelled; all actions require my wallet signature with test assets.</span></label>
       {needsUsdc&&!collateralCanSign&&<p className="sn-v754-sign-hint">{action==='deposit'?'Deposit is available only when your wallet holds enough of the matching mint. Use Receive above.':'Withdrawal requires enough deposited Drift USDC and a prepared wallet receiving account.'}</p>}
       <button type="button" className="trade-submit" disabled={!canSign} onClick={()=>void submit()}>{busy?'Awaiting wallet approval…':needsUsdc&&!collateralCanSign?(action==='deposit'?'Receive USDC before depositing':'No withdrawable USDC yet'):action === 'initialize' ? 'Initialize Drift Account ↗' : `Review & sign ${action}`} <Icon name="arrowUp" size={16}/></button>
       {!connected&&<div className="sn-v6-trade-connect"><ConnectWallet/><small>Connect Phantom or Solflare to continue.</small></div>}
       {!enableExecution&&<p className="trade-warning">Trading is disabled by project configuration.</p>}
       {network==='unavailable'&&<p className="trade-warning">This RPC has not passed the devnet identity check. Transactions are locked.</p>}
       {connected&&network==='verified'&&driftAccount&&!driftAccount.exists&&tab!=='account'&&<p className="trade-warning">A Drift account is required. <button type="button" className="sn-v61-inline-setup" onClick={() => selectTab('account')}>Open account setup →</button></p>}
       {error&&<div className="trade-warning" role="alert"><p>{error}</p>{/free collateral|before placing an order/i.test(error)&&<button type="button" className="sn-v61-inline-setup" onClick={()=>selectTab('collateral')}>Deposit collateral first →</button>}</div>}
       {pendingStep&&<p className="trade-progress" role="status">{pendingStep}</p>}
       {result&&<div className="trade-receipt"><strong>{result.confirmed?'Transaction signature confirmed on devnet':'Transaction confirmation unverified'}</strong><p>{result.description}</p><a href={explorerTransactionUrl(result.signature)} rel="noopener noreferrer" target="_blank">View transaction ↗</a><code>{result.signature}</code></div>}
       {collateralProof&&<div className="trade-receipt" role="status"><strong>{collateralProof.status==='verified'?'USDC BALANCE MOVEMENT VERIFIED':'USDC BALANCE MOVEMENT NOT VERIFIED'}</strong><p>{collateralProof.detail}</p>{collateralProof.walletDeltaRaw!==null&&<p>Wallet USDC change: {Number(BigInt(collateralProof.walletDeltaRaw))/1e6} · Drift spot change: {Number(BigInt(collateralProof.driftDeltaRaw!))/1e6} USDC</p>}{collateralProof.status==='unverified'&&collateralBaseline&&<button type="button" disabled={usdcChecking||busy||network!=='verified'} onClick={()=>void recheckCollateralProof()}>{usdcChecking?'Rechecking…':'Recheck collateral proof ↻'}</button>}</div>}
      </section>
      <aside className="sn-v6-trade-side">
        <section className="sn-v6-side-card"><div className="sn-v6-side-head"><h3>Account overview</h3><span>{network==='verified'?'DEVNET':'NOT VERIFIED'}</span></div><div className="sn-v6-account-number"><small>NATIVE SOL · WALLET</small><strong>{balance===null?'—':balance.toLocaleString('en-US',{maximumFractionDigits:6})} <em>SOL</em></strong></div><div className="sn-v6-ticket-facts"><div><span>Wallet</span><strong>{publicKey?compact(publicKey.toBase58()):'Not connected'}</strong></div><div><span>Wrapped SOL · wallet</span><strong>{wrappedBalance===null?'Unverified':`${(Number(wrappedBalance)/1e9).toFixed(6)} wSOL`}</strong></div><div><span>Devnet USDC · wallet</span><strong>{usdcBalance===null?'Check collateral':`${(Number(usdcBalance)/1e6).toFixed(2)} USDC`}</strong></div><div><span>Drift account</span><strong>{driftAccount?(driftAccount.exists?'Exists':'Not initialized'):'Not verified'}</strong></div><div><span>Drift USDC spot balance</span><strong>{usdcReadiness?.driftDepositedAmount===null||!usdcReadiness?'Not independently read':`${Number(BigInt(usdcReadiness.driftDepositedAmount))/1e6} USDC (signed)`}</strong></div><div><span>Trading collateral / PnL</span><strong>Not independently verified</strong></div></div><div className="sn-v6-side-note">Wallet SOL and wSOL are not Drift collateral. If a deposit fails after wrapping, recover the wSOL in your wallet. This never touches existing Drift deposits.</div>{wrappedBalance!==null&&wrappedBalance>0n&&<button type="button" className="sn-v61-setup-primary" onClick={()=>{setTab('collateral');choose('unwrap');}}>Recover wallet wSOL →</button>}</section>
        <section className="sn-v6-side-card sn-v6-safety"><div className="sn-v6-side-head"><h3>Execution safety</h3><Icon name="shield" size={19}/></div><div className="sn-v6-evidence-row"><span>Network</span><strong>{network==='verified'?'VERIFIED':'CHECK REQUIRED'}</strong></div><div className="sn-v6-evidence-row"><span>Mainnet</span><strong>DISABLED</strong></div><div className="sn-v6-evidence-row"><span>Personal Drift deposits</span><strong>WALLET-SIGNED</strong></div><a target="_blank" rel="noopener noreferrer" href="https://faucet.solana.com/">Get devnet test SOL ↗</a></section>
      </aside>
    </div>
    </div>
    </div>
   </div>;
}
