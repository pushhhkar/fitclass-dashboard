'use client';

import { useState, useEffect } from 'react';
import { useBranches } from '@/hooks/useBranches';
import { useLeads } from '@/hooks/useLeads';
import BranchTabs from './BranchTabs';
import StatsCards from './StatsCards';
import SearchBar from './SearchBar';
import LeadsTable from './LeadsTable';

export default function Dashboard() {
  const { tabs, loading: tabsLoading, error: tabsError } = useBranches();
  const [activeTab, setActiveTab] = useState<string>('');
  const [search, setSearch] = useState('');

  // Set the first tab once tabs are loaded
  useEffect(() => {
    if (tabs.length > 0 && activeTab === '') {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  const { leads, stats, loading: leadsLoading, error: leadsError, updateLead } = useLeads(activeTab);

  const handleTabChange = (tab: string) => {
    setSearch('');
    setActiveTab(tab);
  };

  if (tabsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading branches…
      </div>
    );
  }

  if (tabsError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load branches: {tabsError}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <BranchTabs tabs={tabs} active={activeTab} onChange={handleTabChange} />

      <StatsCards stats={stats} />

      <div className="flex items-center justify-between px-6 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">{activeTab}</span>
          {!leadsLoading && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {leads.length} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {leadsError && (
            <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {leadsError}
            </span>
          )}
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      <div className="px-6 pb-6 relative flex-1">
        <LeadsTable
          leads={leads}
          loading={leadsLoading}
          search={search}
          onUpdate={updateLead}
        />
      </div>
    </div>
  );
}
