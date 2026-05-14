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
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="flex items-center h-16 pl-2 pr-4 sm:pr-6 gap-3 sm:gap-4">
        {/* Logo + title */}
        <div className="flex items-center gap-3 shrink-0">
          <Image
            src="/fitclass logo white.png"
            alt="FitClass"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
          <span className="font-bold text-[#0F172A] text-sm tracking-tight hidden sm:block">
            FitClass Leads
          </span>
        </div>

        <div className="h-5 w-px bg-[#E2E8F0] hidden sm:block" />

        {/* Dashboard selector */}
        <div className="relative">
          <select
            value={activeDashboard.id}
            onChange={(e) => {
              const selected = dashboards.find((d) => d.id === e.target.value);
              if (selected) onDashboardChange(selected);
            }}
            className="appearance-none text-sm font-medium text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#0A6BA8]/20 focus:border-[#0A6BA8] cursor-pointer transition-colors hover:border-[#94A3B8] min-h-[38px]"
          >
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {/* Chevron icon */}
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  );
}
