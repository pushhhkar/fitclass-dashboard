'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Lead, StatsData, UpdatePayload } from '@/types';
import { POLL_INTERVAL_MS } from '@/lib/config';

interface UseLeadsReturn {
  leads: Lead[];
  stats: StatsData;
  loading: boolean;
  error: string | null;
  updateLead: (payload: Omit<UpdatePayload, 'sheetName'>) => Promise<void>;
}

export function useLeads(sheetName: string): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads?sheet=${encodeURIComponent(sheetName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Lead[] = await res.json();
      setLeads(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sheetName]);

  useEffect(() => {
    setLeads([]);
    setLoading(true);
    fetchData();
    timerRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  const updateLead = useCallback(
    async (payload: Omit<UpdatePayload, 'sheetName'>) => {
      // Optimistic local update
      setLeads((prev) =>
        prev.map((l) =>
          l.rowIndex === payload.rowIndex ? { ...l, [payload.field]: payload.value } : l
        )
      );

      const res = await fetch('/api/sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, sheetName }),
      });

      if (!res.ok) {
        await fetchData();
        throw new Error('Failed to save to Google Sheets');
      }
    },
    [sheetName, fetchData]
  );

  const stats: StatsData = {
    total: leads.length,
  };

  return { leads, stats, loading, error, updateLead };
}
