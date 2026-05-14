'use client';

import { useEffect, useState } from 'react';
import type { StatsData } from '@/types';

function useRelativeTime(date: Date | null): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!date) { setLabel(''); return; }

    const update = () => {
      const secs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (secs < 10)  { setLabel('just now'); return; }
      if (secs < 60)  { setLabel(`${secs}s ago`); return; }
      const mins = Math.floor(secs / 60);
      if (mins < 60)  { setLabel(`${mins}m ago`); return; }
      setLabel(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, [date]);

  return label;
}

interface Props {
  stats: StatsData;
}

export default function StatsCards({ stats }: Props) {
  const timeLabel = useRelativeTime(stats.lastUpdated);

  return (
    <div className="px-4 sm:px-6 py-4 flex flex-wrap items-end gap-3">
      <div className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-4 flex flex-col gap-1 min-w-[120px] shadow-sm">
        <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-widest">
          Total Leads
        </span>
        <span className="text-2xl font-bold text-[#0F172A] tabular-nums">{stats.total}</span>
      </div>
      {timeLabel && (
        <span className="text-xs text-[#94A3B8] pb-4">
          Updated {timeLabel}
        </span>
      )}
    </div>
  );
}
