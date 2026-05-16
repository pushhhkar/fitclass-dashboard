'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lead, StatsData } from '@/types';

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
function IconXCircle() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconCalendarCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 14l2 2 4-4" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

// ── card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  label: string;
  count: number;
  total: number;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  isHero?: boolean;
  timeLabel?: string;
}

function StatCard({ label, count, total, iconBg, iconColor, icon, isHero, timeLabel }: CardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1 min-w-[110px]">
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-widest leading-tight">
          {label}
        </span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
        </div>
      </div>

      <div className="flex items-end gap-1.5">
        <span className={`font-bold text-[#0F172A] tabular-nums ${isHero ? 'text-xl' : 'text-lg'}`}>
          {count}
        </span>
        {!isHero && (
          <span className="text-[11px] font-semibold mb-px" style={{ color: pct > 0 ? '#16A34A' : '#94A3B8' }}>
            {pct}%
          </span>
        )}
      </div>

      {isHero ? (
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-[9px] text-[#64748B]">
            {timeLabel ? `Updated ${timeLabel}` : 'Loading…'}
          </span>
        </div>
      ) : (
        <p className="text-[9px] text-[#94A3B8]">of total leads</p>
      )}
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

  const counts = useMemo(() => {
    const CALL_ATTEMPTED  = new Set(['Call Attempted', 'Not Answering', 'Call Back Later']);
    const UNQUALIFIED     = new Set(['Budget Issue', 'Wrong Branch', 'Location Issue', 'Not Interested', 'Job Applicant']);

    return {
      new:            leads.filter(l => l.Status === 'New').length,
      callAttempted:  leads.filter(l => CALL_ATTEMPTED.has(l.Status ?? '')).length,
      unqualified:    leads.filter(l => UNQUALIFIED.has(l.Status ?? '')).length,
      visitScheduled: leads.filter(l => l.Status === 'Visit Scheduled').length,
      converted:      leads.filter(l => l.Status === 'Membership Purchased').length,
    };
  }, [leads]);

  const total = stats.total;

  return (
    <div className="px-4 sm:px-5 py-1.5">
      <div className="flex flex-wrap gap-1.5">

        <StatCard
          label="TOTAL LEADS"
          count={total}
          total={total}
          iconBg="bg-[#EFF6FF]"
          iconColor="text-[#0A6BA8]"
          icon={<IconPeople />}
          isHero
          timeLabel={timeLabel}
        />

        <StatCard
          label="NEW LEADS"
          count={counts.new}
          total={total}
          iconBg="bg-blue-50"
          iconColor="text-[#0A6BA8]"
          icon={<IconPersonPlus />}
        />

        <StatCard
          label="CALL ATTEMPTED"
          count={counts.callAttempted}
          total={total}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          icon={<IconPhone />}
        />

        <StatCard
          label="UNQUALIFIED LEADS"
          count={counts.unqualified}
          total={total}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          icon={<IconXCircle />}
        />

        <StatCard
          label="VISIT SCHEDULED"
          count={counts.visitScheduled}
          total={total}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          icon={<IconCalendarCheck />}
        />

        <StatCard
          label="CONVERTED"
          count={counts.converted}
          total={total}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          icon={<IconTrophy />}
        />

      </div>
    </div>
  );
}
