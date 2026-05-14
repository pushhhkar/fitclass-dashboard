'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lead, StatsData } from '@/types';

// ── relative time label ──────────────────────────────────────────────────────
function useRelativeTime(date: Date | null): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!date) { setLabel(''); return; }
    const update = () => {
      const secs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (secs < 10)  return setLabel('just now');
      if (secs < 60)  return setLabel(`${secs}s ago`);
      const mins = Math.floor(secs / 60);
      if (mins < 60)  return setLabel(`${mins}m ago`);
      setLabel(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, [date]);
  return label;
}

// ── icons ────────────────────────────────────────────────────────────────────
function IconPeople() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87a4 4 0 100-8 4 4 0 000 8zm6-12a4 4 0 11-8 0 4 4 0 018 0zm-12 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function IconPersonPlus() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-6-3a4 4 0 100 8 4 4 0 000-8zm-6 8s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H3z" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 17.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function IconBadge() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ── sub-stat card ─────────────────────────────────────────────────────────────
interface SubCardProps {
  label: string;
  count: number;
  total: number;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}
function SubCard({ label, count, total, iconBg, iconColor, icon }: SubCardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[140px] flex-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-[#0F172A] tabular-nums">{count}</span>
        <span className="ml-2 text-sm font-semibold" style={{ color: pct > 0 ? '#16A34A' : '#94A3B8' }}>
          {pct}%
        </span>
      </div>
      <p className="text-xs text-[#94A3B8]">of total leads</p>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────
interface Props {
  stats: StatsData;
  leads: Lead[];
}

export default function StatsCards({ stats, leads }: Props) {
  const timeLabel = useRelativeTime(stats.lastUpdated);

  const counts = useMemo(() => ({
    new:       leads.filter(l => l.Status === 'New').length,
    contacted: leads.filter(l => l.Status === 'Contacted').length,
    membership:leads.filter(l => l.Status === 'Interested' || l.Status === 'Follow Up').length,
    converted: leads.filter(l => l.Status === 'Converted').length,
  }), [leads]);

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="flex flex-wrap gap-3">

        {/* Total Leads — wider hero card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[180px] w-full sm:w-auto sm:flex-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest">Total Leads</span>
              <div className="text-3xl font-bold text-[#0F172A] tabular-nums mt-1">{stats.total}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#0A6BA8] shrink-0">
              <IconPeople />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-xs text-[#64748B]">
              {timeLabel ? `Updated ${timeLabel}` : 'Loading…'}
            </span>
          </div>
        </div>

        {/* Dynamic sub-cards */}
        <SubCard
          label="New Leads"
          count={counts.new}
          total={stats.total}
          iconBg="bg-blue-50"
          iconColor="text-[#0A6BA8]"
          icon={<IconPersonPlus />}
        />
        <SubCard
          label="Contacted"
          count={counts.contacted}
          total={stats.total}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          icon={<IconPhone />}
        />
        <SubCard
          label="Interested"
          count={counts.membership}
          total={stats.total}
          iconBg="bg-green-50"
          iconColor="text-[#16A34A]"
          icon={<IconBadge />}
        />
        <SubCard
          label="Converted"
          count={counts.converted}
          total={stats.total}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          icon={<IconCheck />}
        />
      </div>
    </div>
  );
}
