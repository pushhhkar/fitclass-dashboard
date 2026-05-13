'use client';

import type { StatsData } from '@/types';

interface StatCardProps {
  label: string;
  value: number;
  accent?: string;
}

function StatCard({ label, value, accent = 'text-gray-800' }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-1 min-w-[120px]">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    </div>
  );
}

interface Props {
  stats: StatsData;
}

export default function StatsCards({ stats }: Props) {
  return (
    <div className="px-6 py-4">
      <StatCard label="Total Leads" value={stats.total} accent="text-gray-800" />
    </div>
  );
}
