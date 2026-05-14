'use client';

import { useState } from 'react';
import { DASHBOARDS, type Dashboard, type DashboardBranch } from '@/lib/config';
import { useLeads } from '@/hooks/useLeads';
import Navbar from './Navbar';
import BranchTabs from './BranchTabs';
import StatsCards from './StatsCards';
import SearchBar from './SearchBar';
import LeadsTable from './LeadsTable';

export default function Dashboard() {
  const [activeDashboard, setActiveDashboard] = useState<Dashboard>(DASHBOARDS[0]);
  const [activeBranch, setActiveBranch] = useState<DashboardBranch>(DASHBOARDS[0].branches[0]);
  const [search, setSearch] = useState('');

  const { leads, stats, loading, error, updateLead } = useLeads(
    activeDashboard.id,
    activeBranch.sheetName
  );

  const handleDashboardChange = (dashboard: Dashboard) => {
    setActiveDashboard(dashboard);
    setActiveBranch(dashboard.branches[0]);
    setSearch('');
  };

  const handleBranchChange = (branch: DashboardBranch) => {
    setActiveBranch(branch);
    setSearch('');
  };

  return (
    <div className="flex flex-col h-full">
      <Navbar
        dashboards={DASHBOARDS}
        activeDashboard={activeDashboard}
        onDashboardChange={handleDashboardChange}
      />

      <BranchTabs
        branches={activeDashboard.branches}
        activeId={activeBranch.id}
        onChange={handleBranchChange}
      />

      <StatsCards stats={stats} />

      <div className="flex items-center justify-between px-6 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">{activeBranch.name}</span>
          {!loading && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {leads.length} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {error}
            </span>
          )}
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      <div className="px-6 pb-6 relative flex-1">
        <LeadsTable
          leads={leads}
          loading={loading}
          search={search}
          onUpdate={updateLead}
        />
      </div>
    </div>
  );
}
