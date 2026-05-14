'use client';

import Image from 'next/image';
import type { Dashboard } from '@/lib/config';

interface Props {
  dashboards: Dashboard[];
  activeDashboard: Dashboard;
  onDashboardChange: (dashboard: Dashboard) => void;
}

export default function Navbar({ dashboards, activeDashboard, onDashboardChange }: Props) {
  return (
    <header className="border-b border-[#E2E8F0] bg-white pl-2 pr-4 sm:pr-6 py-2 sm:py-0 sm:h-16 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shadow-sm">
      <div className="flex items-center gap-3 shrink-0">
        <Image
          src="/fitclass logo white.png"
          alt="FitClass"
          width={56}
          height={56}
          className="object-contain"
          priority
        />
        <span className="font-semibold text-[#0F172A] text-sm tracking-tight">
          FitClass Leads
        </span>
      </div>
      <span className="text-[#E2E8F0] text-sm hidden sm:inline">|</span>
      <select
        value={activeDashboard.id}
        onChange={(e) => {
          const selected = dashboards.find((d) => d.id === e.target.value);
          if (selected) onDashboardChange(selected);
        }}
        className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-2.5 py-2 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A6BA8]/20 focus:border-[#0A6BA8] cursor-pointer min-h-[36px] sm:min-h-0 transition-colors hover:border-[#94A3B8]"
      >
        {dashboards.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </header>
  );
}
