"use client";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "blue" | "amber" | "red" | "purple";
  large?: boolean;
}

const accentMap = {
  green:  "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  blue:   "text-blue-400   border-blue-500/20   bg-blue-500/5",
  amber:  "text-amber-400  border-amber-500/20  bg-amber-500/5",
  red:    "text-red-400    border-red-500/20    bg-red-500/5",
  purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
};

export default function StatCard({
  label,
  value,
  sub,
  accent = "green",
  large = false,
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
      <p className={`font-bold tracking-tight ${large ? "text-4xl" : "text-2xl"} text-white`}>
        {value}
      </p>
      {sub && (
        <p className="text-gray-500 text-xs mt-1">{sub}</p>
      )}
    </div>
  );
}
