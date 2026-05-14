'use client';

import type { DashboardBranch } from '@/lib/config';

interface Props {
  branches: DashboardBranch[];
  activeId: string;
  onChange: (branch: DashboardBranch) => void;
}

export default function BranchTabs({ branches, activeId, onChange }: Props) {
  return (
    <div className="border-b border-[#E2E8F0] bg-white">
      <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 gap-0">
        {branches.map((branch) => {
          const isActive = branch.id === activeId;
          return (
            <button
              key={branch.id}
              onClick={() => onChange(branch)}
              className={[
                'shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? 'border-[#0A6BA8] text-[#0A6BA8] bg-[#0A6BA8]/[0.04]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]',
              ].join(' ')}
            >
              {branch.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
