'use client';

import { useEffect, useState } from 'react';
import { DASHBOARDS, type Dashboard } from '@/lib/config';
import { useBranches, type DynamicBranch } from '@/hooks/useBranches';
import { useLeads } from '@/hooks/useLeads';
import Navbar from './Navbar';
import BranchTabs from './BranchTabs';
import StatsCards from './StatsCards';
import SearchBar from './SearchBar';
import LeadsTable from './LeadsTable';

export default function Dashboard() {
  const [activeDashboard, setActiveDashboard] = useState<Dashboard>(DASHBOARDS[0]);
  const [activeBranch, setActiveBranch]       = useState<DynamicBranch | null>(null);
  const [search, setSearch]                   = useState('');

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
    newLeadCount, newLeadRowKeys,
    clearNewLeadCount,
    updateLead, transferLead,
  } = useLeads(activeDashboard.id, activeBranch?.sheetName ?? '');

  const handleDashboardChange = (dashboard: Dashboard) => {
    setActiveDashboard(dashboard);
    setActiveBranch(null);
    setSearch('');
  };

  const handleBranchChange = (branch: DynamicBranch) => {
    setActiveBranch(branch);
    setSearch('');
  };

  return (
    <div className="flex flex-col h-full min-w-0 bg-[#F8FAFC]">
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

      <div className="px-4 sm:px-6 pb-6 flex-1 min-w-0 flex flex-col">
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 border-b border-[#F1F5F9]">
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {error && (
                <span className="text-xs text-[#EA580C] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 text-center">
                  {error}
                </span>
              )}
              <SearchBar value={search} onChange={setSearch} />
            </div>
          </div>

          <div className="flex-1 relative overflow-x-auto">
            <LeadsTable
              leads={leads}
              loading={loading || (!activeBranch && !branchesLoading)}
              search={search}
              onUpdate={updateLead}
              onTransfer={transferLead}
              dashboardId={activeDashboard.id}
              allBranches={branches}
              activeBranchName={activeBranch?.sheetName ?? ''}
              newLeadRowKeys={newLeadRowKeys}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
