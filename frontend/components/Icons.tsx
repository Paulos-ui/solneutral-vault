import type { SVGProps, ReactNode } from "react";

type IconName = "arrow" | "arrowUp" | "arrowLeft" | "cross" | "menu" | "close" | "diagonal" | "shield" | "pulse" | "layers" | "chevron" | "external" | "spark" | "home" | "history" | "book" | "settings" | "wallet" | "clock";
export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
    arrowUp: <><path d="M5 19 19 5" /><path d="M8 5h11v11" /></>,
    arrowLeft: <><path d="M20 12H5" /><path d="m11 6-6 6 6 6" /></>,
    cross: <><path d="M12 2v20M2 12h20" /></>,
    menu: <><path d="M3 7h18M3 17h18" /></>,
    close: <><path d="M5 5 19 19M19 5 5 19" /></>,
    diagonal: <><path d="m4 18 7-7 4 4 5-9" /><path d="M15 6h5v5" /></>,
    shield: <><path d="m12 2 8 4v6c0 5-3.7 8-8 10-4.3-2-8-5-8-10V6l8-4Z" /><path d="m9 12 2 2 4-4" /></>,
    pulse: <><path d="M2 12h4l3-7 5 14 3-7h5" /></>,
    layers: <><path d="m12 3 10 5-10 5L2 8l10-5ZM2 13l10 5 10-5M2 18l10 5 10-5" /></>,
    chevron: <><path d="m6 9 6 6 6-6" /></>,
    external: <><path d="M13 5h6v6M19 5l-9 9" /><path d="M19 14v5H5V5h5" /></>,
    spark: <><path d="M12 2 9.6 9.6 2 12l7.6 2.4L12 22l2.4-7.6L22 12l-7.6-2.4L12 2Z" /></>,
    home: <><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5"/><path d="M12 7v5l3 2"/></>,
    book: <><path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1Z"/><path d="M12 6v14"/></>,
    settings: <><path d="M4 7h16M4 17h16M9 4v6M16 14v6"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="17" r="2"/></>,
    wallet: <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M6 6V4h12v2M16 13h5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
  };
  return <svg {...common} aria-hidden="true">{paths[name]}</svg>;
}
