'use client';

interface Props {
  tabs: string[];       // sheet tab names
  active: string;
  onChange: (tab: string) => void;
}

export default function BranchTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ].join(' ')}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
