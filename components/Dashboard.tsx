'use client';

import { useEffect, useState } from 'react';
import { DASHBOARDS, type Dashboard } from '@/lib/config';
import { useBranches, type DynamicBranch } from '@/hooks/useBranches';
import { useLeads } from '@/hooks/useLeads';
import Navbar from './Navbar';
import BranchTabs from './BranchTabs';
import StatsCards from './StatsCards';
import LeadsTable from './LeadsTable';

export default function Dashboard() {
  const [activeDashboard, setActiveDashboard] = useState<Dashboard>(DASHBOARDS[0]);
  const [activeBranch, setActiveBranch]       = useState<DynamicBranch | null>(null);

  const { branches, loading: branchesLoading, error: branchesError } = useBranches(activeDashboard.id);

  useEffect(() => {
    if (branches.length > 0) {
      setActiveBranch((prev) => {
        if (prev && branches.some((b) => b.id === prev.id)) return prev;
        return branches[0];
      });
    } else {
      setActiveBranch(null);
    }
  }, [branches]);

  const {
    leads, stats, loading, error,
    websiteHeaders, statusOptions,
    newLeadCount, newLeadRowKeys,
    clearNewLeadCount,
    updateLead, transferLead,
  } = useLeads(activeDashboard.id, activeBranch?.sheetName ?? '');

  const handleDashboardChange = (dashboard: Dashboard) => {
    setActiveDashboard(dashboard);
    setActiveBranch(null);
  };

  const handleBranchChange = (branch: DynamicBranch) => {
    setActiveBranch(branch);
  };

  return (
    /*
      Desktop: rigid flex column filling the viewport shell from layout.tsx.
        - Navbar / BranchTabs / StatsCards / Toolbar → shrink-0 (fixed height)
        - .dashboard-grid-region → flex:1 1 0, minHeight:0 — takes ALL remaining
          space and hands it directly to AG Grid which fills it with its own scroll.
      Mobile: overflow-y:auto on the root + mobile card list = natural page scroll.
    */
    <div className="dashboard-root">

      {/* ── Fixed chrome ──────────────────────────────────────────────────── */}
      <Navbar
        dashboards={DASHBOARDS}
        activeDashboard={activeDashboard}
        newLeadCount={newLeadCount}
        onDashboardChange={handleDashboardChange}
        onClearNotifications={clearNewLeadCount}
      />

      <BranchTabs
        branches={branches}
        activeId={activeBranch?.id ?? ''}
        loading={branchesLoading}
        onChange={handleBranchChange}
      />

      {branchesError && (
        <div className="mx-4 sm:mx-6 mt-3 text-xs text-[#EA580C] bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">
          Could not load tabs: {branchesError}
        </div>
      )}

      <StatsCards stats={stats} leads={leads} />

      {/* Toolbar */}
      <div className="dashboard-toolbar">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-[#0F172A]">
            {activeBranch?.name ?? '—'}
          </span>
          {!loading && activeBranch && (
            <span className="text-xs text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-full font-medium tabular-nums">
              {leads.length} total
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-[#EA580C] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
            {error}
          </span>
        )}
      </div>

      {/* ── Grid region — flex:1, hands exact height to LeadsTable ────────── */}
      <div className="dashboard-grid-region">
        <div className="dashboard-grid-card">
          <LeadsTable
            leads={leads}
            loading={loading || (!activeBranch && !branchesLoading)}
            onUpdate={updateLead}
            onTransfer={transferLead}
            dashboardId={activeDashboard.id}
            allBranches={branches}
            activeBranchName={activeBranch?.sheetName ?? ''}
            newLeadRowKeys={newLeadRowKeys}
            websiteHeaders={websiteHeaders}
            statusOptions={statusOptions}
          />
        </div>
      </div>

    </div>
  );
}
