"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from './ConnectWallet';
import { SolPriceChart } from './SolPriceChart';
import { inspectWrappedSol } from '@/lib/native-sol';
import { Icon } from './Icons';
import { assertDevnetGenesis, explorerTransactionUrl, validateDevnetAmount } from '@/lib/devnet-execution';
import { executeDriftDevnetAction, inspectDriftDevnetAccount, type ExecutionAction, type ExecutionResult } from '@/lib/drift-devnet';

type ConnectionState = 'idle'|'checking'|'verified'|'unavailable';
type DeskTab = 'trade'|'collateral'|'account'|'orders';
const ACTIONS = [
  { id: 'initialize', label: 'Initialize', tagline: 'Open a Drift user subaccount' },
  { id: 'deposit', label: 'Deposit', tagline: 'Wrap devnet SOL → deposit wSOL to Drift' },
  { id: 'withdraw', label: 'Withdraw', tagline: 'Drift wSOL collateral → your wallet token account' },
  { id: 'unwrap', label: 'Unwrap wSOL', tagline: 'Return all wallet-owned wSOL to native SOL' },
  { id: 'long', label: 'Long', tagline: 'SOL-PERP buy limit IOC order' },
  { id: 'short', label: 'Short', tagline: 'SOL-PERP sell limit IOC order' },
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
  const [network,setNetwork]=useState<ConnectionState>('idle');
  const [genesis,setGenesis]=useState('');
  const [balance,setBalance]=useState<number|null>(null);
  const [wrappedBalance,setWrappedBalance]=useState<bigint|null>(null);
  const [driftAccount,setDriftAccount]=useState<{address:string;exists:boolean}|null>(null);
  const [action,setAction]=useState<ExecutionAction>('long');
  const [tab,setTab]=useState<DeskTab>('trade');
  const [amount,setAmount]=useState('0.05');
  const [approved,setApproved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [pendingStep,setPendingStep]=useState('');
  const [error,setError]=useState('');
  const [result,setResult]=useState<ExecutionResult|null>(null);
  const enableExecution = process.env.NEXT_PUBLIC_ENABLE_DEVNET_TRADING !== 'false';
  const current = ACTIONS.find(a=>a.id===action)!;
  const noAmount=action==='initialize'||action==='cancel'||action==='unwrap';
  const ready=Boolean(connected&&publicKey&&signer&&network==='verified'&&!busy&&enableExecution&&(action==='unwrap'?wrappedBalance!==null&&wrappedBalance>0n:driftAccount&&(action==='initialize'?!driftAccount.exists:driftAccount.exists)));

  const refresh=useCallback(async()=>{
    if(!connected||!publicKey||!signer){setNetwork('idle');setBalance(null);setDriftAccount(null);setWrappedBalance(null);return;}
    setNetwork('checking');setError('');setDriftAccount(null);
    try{
      const hash=await connection.getGenesisHash();
      setGenesis(hash);
      assertDevnetGenesis(hash);
      const lamports=await connection.getBalance(publicKey,'confirmed');
      setBalance(lamports/1e9);
      try { const wsol = await inspectWrappedSol(connection,publicKey); setWrappedBalance(wsol.amount); }
      catch(err) { setWrappedBalance(null); setError(`Cannot verify wSOL balance: ${readableError(err)}`); }
      setNetwork('verified');
      // Account read is independent; a temporary Drift SDK/indexer problem must not fake network status.
      try{
        const account=await inspectDriftDevnetAccount(connection,signer);
        setDriftAccount({address:account.address,exists:account.exists});
      }catch(err){setError(`Drift account lookup unavailable: ${readableError(err)}`);}
    }catch(err){setNetwork('unavailable');setError(readableError(err));}
  },[connected,publicKey,signer,connection]);
  useEffect(()=>{void refresh();},[refresh]);
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

  function choose(id:ExecutionAction){setAction(id);setApproved(false);setError('');setResult(null);setPendingStep('');setAmount(id==='long'||id==='short'?'0.01':'0.05');}
  async function submit(){
    if(!ready||!signer) return;
    if(!approved){setError('Review the action and tick the acknowledgement before signing.');return;}
    if(!noAmount){try{validateDevnetAmount(action as 'deposit'|'withdraw'|'long'|'short',amount);}catch(err){setError(readableError(err));return;}}
    setBusy(true);setError('');setResult(null);setApproved(false);
    setPendingStep('Checking devnet and preparing Drift transaction…');
    try{
      const receipt=await executeDriftDevnetAction(connection,signer,action,amount);
      setResult(receipt);
      setPendingStep(receipt.confirmed?'Confirmed on devnet. Read the signature below.':'Submitted; network confirmation is still unverified.');
      await refresh();
    }catch(err){setError(readableError(err));setPendingStep('Action was not verified as successful.');}
    finally{setBusy(false);}
  }
  const tabs: {id:DeskTab;label:string;action:ExecutionAction}[]=[
    {id:'trade',label:'Trade',action:'long'},
    {id:'collateral',label:'Collateral',action:'deposit'},
    {id:'account',label:'Account',action:'initialize'},
    {id:'orders',label:'Orders',action:'cancel'},
  ];
  function selectTab(next:DeskTab){setTab(next);choose(tabs.find(t=>t.id===next)!.action);}
  return <div className="sn-v6-trade" aria-label="Drift devnet execution workspace">
    <div className="sn-v6-trade-bar"><div className="sn-v6-market-name"><span className="sn-v6-market-icon">◎</span><div><strong>SOL-PERP</strong><span>Drift · Solana Devnet</span></div></div><div className="sn-v6-market-signals"><span className={network==='verified'?'online':''}><i/>{network==='verified'?'Verified devnet':network==='checking'?'Checking network':network==='unavailable'?'RPC not verified':'Connect wallet'}</span><span>Market orders use bounded IOC limits</span></div><button type="button" className="sn-v6-refresh" disabled={!connected||busy} onClick={()=>void refresh()}>↻ Refresh</button></div>
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
       {tab==='account'&&<div className="sn-v6-action-info"><strong>{driftAccount?.exists?'Drift account found':'Initialize your Drift user account'}</strong><p>{driftAccount?.exists?'Your derived Drift User account exists on devnet.':'Read the acknowledgement below and click Initialize Drift Account to open a Phantom/Solflare signing request. Test SOL is required for account creation fees.'}</p></div>}
       {tab==='orders'&&<div className="sn-v6-action-info"><strong>Cancel SOL-PERP orders</strong><p>This cancels outstanding orders in your personal Drift User account. It does not close an open position. Open-order counts are not yet independently decoded.</p></div>}
       {!noAmount&&<label className="sn-v6-trade-amount"><span>SIZE <small>{tab==='trade'?'BASE SOL':'DEVNET SOL'}</small></span><input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={amount} onChange={e=>{setAmount(e.target.value);setApproved(false);}} placeholder="0.05" /><span className="sn-v6-trade-limit">{tab==='trade'?'Maximum 0.1 SOL base per order':'Maximum 0.5 SOL per transaction'}</span></label>}
       <div className="sn-v6-ticket-facts"><div><span>Venue</span><strong>Drift · devnet</strong></div><div><span>Execution</span><strong>{tab==='trade'?'Oracle-bounded limit · IOC':tab==='collateral'?(action==='unwrap'?'Close wallet wSOL account':'Verified market · wallet-owned wSOL'):'Wallet-signed transaction'}</strong></div><div><span>Account</span><strong>{driftAccount?.exists?'Verified existing':driftAccount===null?'Unverified':'Not initialized'}</strong></div></div>
       {tab==='trade'&&<p className="sn-v6-exec-note">A confirmed order submission does not guarantee an order fill. The limit guard is 1% from the observed oracle price.</p>}
       {tab==='collateral'&&<div className="sn-v8-wsol-context"><div><span>WALLET wSOL · VERIFIED DEVNET BALANCE</span><strong>{wrappedBalance===null?'Unavailable':(Number(wrappedBalance)/1e9).toLocaleString('en-US',{maximumFractionDigits:9})+' wSOL'}</strong></div><p>{action==='deposit'?'Before any wrapping, SolNeutral checks the actual Drift wSOL spot market. Existing wallet wSOL is reused so you are not asked to wrap the same amount twice.':action==='withdraw'?'Drift withdrawals return wSOL to your wallet; account deposits and margin availability are checked before signing.':'Recovery: closes your wallet-owned wSOL token account and returns its ENTIRE balance and rent to native SOL. This does not withdraw any funds deposited inside Drift.'}</p></div>}
       <label className="sn-v6-trade-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/><span>I reviewed this devnet action and understand it requires a real wallet signature using test assets.</span></label>
       <button type="button" className="trade-submit" disabled={!ready||!approved} onClick={()=>void submit()}>{busy?'Awaiting wallet approval…':action === 'initialize' ? 'Initialize Drift Account ↗' : `Review & sign ${action}`} <Icon name="arrowUp" size={16}/></button>
       {!connected&&<div className="sn-v6-trade-connect"><ConnectWallet/><small>Connect Phantom or Solflare to continue.</small></div>}
       {!enableExecution&&<p className="trade-warning">Trading is disabled by project configuration.</p>}
       {network==='unavailable'&&<p className="trade-warning">This RPC has not passed the devnet identity check. Transactions are locked.</p>}
       {connected&&network==='verified'&&driftAccount&&!driftAccount.exists&&tab!=='account'&&<p className="trade-warning">A Drift account is required. <button type="button" className="sn-v61-inline-setup" onClick={() => selectTab('account')}>Open account setup →</button></p>}
       {error&&<p className="trade-warning" role="alert">{error}</p>}
       {pendingStep&&<p className="trade-progress" role="status">{pendingStep}</p>}
       {result&&<div className="trade-receipt"><strong>{result.confirmed?'Confirmed on devnet':'Confirmation unverified'}</strong><p>{result.description}</p><a href={explorerTransactionUrl(result.signature)} rel="noopener noreferrer" target="_blank">View transaction ↗</a><code>{result.signature}</code></div>}
      </section>
      <aside className="sn-v6-trade-side">
        <section className="sn-v6-side-card"><div className="sn-v6-side-head"><h3>Account overview</h3><span>{network==='verified'?'DEVNET':'NOT VERIFIED'}</span></div><div className="sn-v6-account-number"><small>NATIVE SOL · WALLET</small><strong>{balance===null?'—':balance.toLocaleString('en-US',{maximumFractionDigits:6})} <em>SOL</em></strong></div><div className="sn-v6-ticket-facts"><div><span>Wallet</span><strong>{publicKey?compact(publicKey.toBase58()):'Not connected'}</strong></div><div><span>Wrapped SOL · wallet</span><strong>{wrappedBalance===null?'Unverified':`${(Number(wrappedBalance)/1e9).toFixed(6)} wSOL`}</strong></div><div><span>Drift account</span><strong>{driftAccount?(driftAccount.exists?'Exists':'Not initialized'):'Not verified'}</strong></div><div><span>Trading collateral / PnL</span><strong>Not decoded</strong></div></div><div className="sn-v6-side-note">Native SOL and wallet-owned wSOL are separate from your deposited Drift collateral. If a deposit fails after wrapping, select Collateral → Unwrap wSOL to recover wallet-owned wSOL.</div></section>
        <section className="sn-v6-side-card sn-v6-safety"><div className="sn-v6-side-head"><h3>Execution safety</h3><Icon name="shield" size={19}/></div><div className="sn-v6-evidence-row"><span>Network</span><strong>{network==='verified'?'VERIFIED':'CHECK REQUIRED'}</strong></div><div className="sn-v6-evidence-row"><span>Mainnet</span><strong>DISABLED</strong></div><div className="sn-v6-evidence-row"><span>Vault deposits</span><strong>NOT ENABLED</strong></div><a target="_blank" rel="noopener noreferrer" href="https://faucet.solana.com/">Get devnet test SOL ↗</a></section>
      </aside>
    </div>
    </div>
    </div>
   </div>;
}
