'use client';

import Image from 'next/image';
import type { Dashboard } from '@/lib/config';

interface Props {
  dashboards: Dashboard[];
  activeDashboard: Dashboard;
  newLeadCount: number;
  onDashboardChange: (dashboard: Dashboard) => void;
  onClearNotifications: () => void;
}

export default function Navbar({
  dashboards,
  activeDashboard,
  newLeadCount,
  onDashboardChange,
  onClearNotifications,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-sm shrink-0">
      <div className="flex items-center px-6 gap-5" style={{ height: 88 }}>

        {/* Logo */}
        <div className="shrink-0">
          <Image
            src="/fitclass-logo-white.webp"
            alt="FitClass Logo"
            width={320}
            height={80}
            priority
            className="object-contain"
            style={{ height: 72, width: 'auto' }}
          />
        </div>

        <div className="h-6 w-px bg-[#E2E8F0] shrink-0" />

        {/* Title */}
        <span className="font-bold text-[#0F172A] text-base tracking-tight shrink-0">
          Dashboard
        </span>

        {/* Dashboard toggle buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {dashboards.map((d) => {
            const isActive = d.id === activeDashboard.id;
            return (
              <button
                key={d.id}
                onClick={() => onDashboardChange(d)}
                style={isActive ? {
                  background: '#0b6cbf',
                  color: '#fff',
                  border: '1px solid #0b6cbf',
                } : {
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #E2E8F0',
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 hover:shadow-sm cursor-pointer"
              >
                {d.name}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* New lead notification badge */}
        {newLeadCount > 0 && (
          <button
            onClick={onClearNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-semibold hover:bg-[#DBEAFE] transition-colors shrink-0"
            title="Clear new lead notifications"
          >
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            {newLeadCount} new {newLeadCount === 1 ? 'lead' : 'leads'}
          </button>
        )}
      </div>
    </header>
  );
}
