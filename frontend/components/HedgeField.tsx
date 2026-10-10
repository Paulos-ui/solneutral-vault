"use client";
import { useId, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "./Icons";

function signed(v: number) { return `${v > 0 ? "+" : ""}${v.toFixed(0)}%`; }

export function HedgeField() {
  const [hedge, setHedge] = useState(100);
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const delta = 100 - hedge;
  return (
    <div className="hedge-machine">
      <div className="field-top"><span><span className="live-pixel"/> BALANCE FIELD / 001</span><span>ILLUSTRATIVE MODEL <Icon name="cross" size={12}/></span></div>
      <div className="field-canvas">
        <div className="grid-field" aria-hidden="true" />
        <span className="field-axis field-axis-y">EXPOSURE / Y</span>
        <span className="field-axis field-axis-x">HEDGE INTENSITY / X</span>
        <motion.div className="field-graphic" initial={reduced ? false : { opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3 }}>
          <svg viewBox="0 0 620 510" fill="none" role="img" aria-label={`Conceptual hedge visualization. Spot exposure 100%, perpetual hedge ${hedge}%, net price exposure ${signed(delta)}.`}>
            <defs>
              <linearGradient id={`${id}a`} x1="95" y1="110" x2="490" y2="425" gradientUnits="userSpaceOnUse"><stop stopColor="#D9FFAE"/><stop offset=".5" stopColor="#94FEB5"/><stop offset="1" stopColor="#3A9D72"/></linearGradient>
              <linearGradient id={`${id}b`} x1="95" y1="400" x2="520" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#245640"/><stop offset=".5" stopColor="#7ACCAA"/><stop offset="1" stopColor="#E7EDC6"/></linearGradient>
              <filter id={`${id}glow`}><feGaussianBlur stdDeviation="6"/></filter>
            </defs>
            <circle cx="310" cy="255" r="194" stroke="#C7FF91" strokeOpacity=".10" strokeDasharray="2 8" />
            <circle cx="310" cy="255" r="150" stroke="#C7FF91" strokeOpacity=".1" />
            <circle cx="310" cy="255" r="105" stroke="#C7FF91" strokeOpacity=".13" />
            <circle cx="310" cy="255" r="52" stroke="#C7FF91" strokeOpacity=".12" strokeDasharray="4 8" />
            <path d="M73 255H547M310 18V492" stroke="#A3C3A7" strokeOpacity=".13" strokeDasharray="3 7" />
            <path d="M102 415C166 340 208 106 308 106S449 315 515 98" stroke={`url(#${id}a)`} strokeWidth="21" strokeLinecap="round" strokeOpacity=".15" filter={`url(#${id}glow)`}/>
            <motion.path d="M102 415C166 340 208 106 308 106S449 315 515 98" stroke={`url(#${id}a)`} strokeWidth="5.5" strokeLinecap="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: "easeOut" }}/>
            <motion.path d={`M102 ${120+(100-hedge)*.55}C178 ${184+(100-hedge)*.65} 208 ${390-(100-hedge)*.35} 308 ${390-(100-hedge)*.65}S455 195 515 412`} stroke={`url(#${id}b)`} strokeWidth="5.5" strokeLinecap="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: .25, ease: "easeOut" }}/>
            <motion.circle cx="310" cy="255" r="32" fill="#102A1D" stroke={Math.abs(delta) < 5 ? "#C7FF91" : "#E6A97F"} strokeOpacity=".7" strokeWidth="1.5" animate={reduced ? undefined : { r: [31, 35, 31] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <path d="M296 255h28m-14-14v28" stroke="#C7FF91" strokeWidth="1" strokeOpacity=".6" />
            <circle cx="310" cy="255" r="4" fill="#E7FFD3" />
            <circle cx="102" cy="415" r="5" fill="#D9FFAE" /><circle cx="515" cy="98" r="5" fill="#D9FFAE"/>
            <circle cx="102" cy={120+(100-hedge)*.55} r="5" fill="#7ACCAA" /><circle cx="515" cy="412" r="5" fill="#7ACCAA" />
          </svg>
        </motion.div>
        <div className="field-label label-spot"><span className="label-marker spot-marker"/> LONG SPOT <strong>+100%</strong></div>
        <div className="field-label label-perp"><span className="label-marker perp-marker"/> SHORT PERP <strong>−{hedge}%</strong></div>
        <div className="field-center-value"><small>NET EXPOSURE</small><strong>{signed(delta)}</strong><span>{Math.abs(delta) <= 4 ? "NEAR NEUTRAL" : delta > 0 ? "LONG BIAS" : "SHORT BIAS"}</span></div>
        <div className="field-corner">F / 02<br/>SOLANA</div>
      </div>
      <div className="field-control"><div className="control-head"><div><span className="micro-label">INTERACTIVE STUDY</span><strong>Adjust the counterweight</strong></div><div className="control-value">{hedge}<small>% HEDGE</small></div></div>
        <label htmlFor={`${id}hedge`} className="sr-only">Hedge percentage</label>
        <input type="range" id={`${id}hedge`} min="60" max="140" step="5" value={hedge} onChange={(e) => setHedge(Number(e.target.value))} style={{ "--value": `${((hedge - 60) / 80) * 100}%` } as CSSProperties}/>
        <div className="range-ends"><span>UNDERHEDGED / 60</span><span>NEUTRAL / 100</span><span>OVERHEDGED / 140</span></div>
      </div>
      <div className="field-bottom"><span>NOT AN EXECUTED POSITION</span><span>SEE HOW ASSUMPTIONS CHANGE THE EXPOSURE <Icon name="arrowUp" size={12}/></span></div>
    </div>
  );
}
