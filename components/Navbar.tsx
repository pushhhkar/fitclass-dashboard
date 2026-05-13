'use client';

export default function Navbar() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">FC</span>
        </div>
        <span className="font-semibold text-gray-800 text-sm tracking-tight">
          FitClass Leads
        </span>
      </div>
      <span className="text-gray-300 text-sm">|</span>
      <span className="text-gray-500 text-xs">Operations Dashboard</span>
    </header>
  );
}
