'use client';

import { useEffect, useState } from 'react';

interface UseBranchesReturn {
  tabs: string[];       // sheet tab names from the API
  loading: boolean;
  error: string | null;
}

export function useBranches(): UseBranchesReturn {
  const [tabs, setTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<string[]>;
      })
      .then((data) => {
        setTabs(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return { tabs, loading, error };
}
