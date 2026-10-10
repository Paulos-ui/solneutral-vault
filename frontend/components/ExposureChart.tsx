"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const curves = {
  spot: Array.from({ length: 46 }, (_, i) => ({ x: i, y: 30 + i * .78 + Math.sin(i * .63) * 7 })),
  hedge: Array.from({ length: 46 }, (_, i) => ({ x: i, y: 78 - i * .76 + Math.cos(i * .58) * 6 })),
  net: Array.from({ length: 46 }, (_, i) => ({ x: i, y: 52 + Math.sin(i * .55) * 5 + Math.sin(i * .19) * 3 })),
};
function pathOf(data: Array<{ x: number; y: number }>) {
  return data.map((p, i) => `${i ? "L" : "M"} ${(p.x / 45) * 930 + 20} ${215 - p.y * 1.6}`).join(" ");
}
export function ExposureChart() {
  const [visible, setVisible] = useState({ spot: true, hedge: true, net: true });
  const reduced = useReducedMotion();
  return <div className="exposure-chart">
    <div className="exposure-chart-head"><div><span className="micro-label">THEORY / INDEXED EXPOSURE</span><h3>Two opposing forces.<br/><em>One residual position.</em></h3></div><div className="chart-legend">{(["spot", "hedge", "net"] as const).map((k) => <button key={k} aria-pressed={visible[k]} className={!visible[k] ? "inactive" : ""} onClick={() => setVisible((v) => ({ ...v, [k]: !v[k] }))}><span className={`legend-dot legend-${k}`}/>{k === "spot" ? "SPOT" : k === "hedge" ? "PERP HEDGE" : "NET DELTA"}</button>)}</div></div>
    <div className="chart-container"><div className="chart-y-label">SIMULATED INDEX</div><svg viewBox="0 0 975 260" preserveAspectRatio="none" role="img" aria-label="Illustrative spot and short exposure moving oppositely, with near-flat residual delta">
      {[25, 75, 125, 175, 225].map((v) => <line key={v} x1="20" y1={v} x2="960" y2={v} stroke="#A2C8AA" strokeOpacity=".16" strokeDasharray="3 6" />)}
      {Object.entries(curves).map(([key, points]) => visible[key as keyof typeof visible] && <motion.path key={key} d={pathOf(points)} fill="none" stroke={key === "spot" ? "#C7FF91" : key === "hedge" ? "#75D3AE" : "#F0B883"} strokeWidth={key === "net" ? 2.5 : 3} strokeDasharray={key === "net" ? "7 6" : undefined} strokeLinecap="round" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />)}
    </svg><div className="chart-bottom"><span>T − 30</span><span>T − 20</span><span>T − 10</span><span>NOW</span></div></div>
    <div className="chart-note">CONCEPTUAL ILLUSTRATION · NOT HISTORICAL PRICES OR ACTUAL VAULT PERFORMANCE</div>
  </div>;
}
