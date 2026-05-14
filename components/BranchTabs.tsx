'use client';

import type { DashboardBranch } from '@/lib/config';

interface Props {
  branches: DashboardBranch[];
  activeId: string;
  onChange: (branch: DashboardBranch) => void;
}

export default function BranchTabs({ branches, activeId, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {branches.map((branch) => {
        const isActive = branch.id === activeId;
        return (
          <button
            key={branch.id}
            onClick={() => onChange(branch)}
            className={[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
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
  );
}
