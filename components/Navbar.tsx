'use client';

import type { Dashboard } from '@/lib/config';

interface Props {
  dashboards: Dashboard[];
  activeDashboard: Dashboard;
  onDashboardChange: (dashboard: Dashboard) => void;
}

export default function Navbar({ dashboards, activeDashboard, onDashboardChange }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-0 sm:h-14 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">FC</span>
        </div>
        <span className="font-semibold text-gray-800 text-sm tracking-tight">
          FitClass Leads
        </span>
      </div>
      <span className="text-gray-300 text-sm hidden sm:inline">|</span>
      <select
        value={activeDashboard.id}
        onChange={(e) => {
          const selected = dashboards.find((d) => d.id === e.target.value);
          if (selected) onDashboardChange(selected);
        }}
        className="text-xs text-gray-600 bg-transparent border border-gray-200 rounded px-2 py-2 sm:py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer min-h-[36px] sm:min-h-0"
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
