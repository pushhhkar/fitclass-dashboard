'use client';

import type { DashboardBranch } from '@/lib/config';

interface Props {
  branches: DashboardBranch[];
  activeId: string;
  onChange: (branch: DashboardBranch) => void;
}

export default function BranchTabs({ branches, activeId, onChange }: Props) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 gap-0">
        {branches.map((branch) => {
          const isActive = branch.id === activeId;
          return (
            <button
              key={branch.id}
              onClick={() => onChange(branch)}
              className={[
                'shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
