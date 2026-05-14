'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Lead, StatsData, UpdatePayload } from '@/types';
import { POLL_INTERVAL_MS } from '@/lib/config';

interface UseLeadsReturn {
  leads: Lead[];
  stats: StatsData;
  loading: boolean;
  error: string | null;
  updateLead: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
}

export function useLeads(dashboardId: string, sheetName: string): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref to the latest dashboardId/sheetName so the interval callback
  // always uses current values without being a dependency that restarts the effect.
  const dashboardIdRef = useRef(dashboardId);
  const sheetNameRef   = useRef(sheetName);
  dashboardIdRef.current = dashboardId;
  sheetNameRef.current   = sheetName;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dashboardId: dashboardIdRef.current,
        sheet:       sheetNameRef.current,
      });
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Lead[] = await res.json();
      setLeads(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []); // stable — never recreated; reads latest values via refs

  // Re-run only when the target (dashboard or branch) actually changes.
  useEffect(() => {
    setLeads([]);
    setLoading(true);

    if (timerRef.current) clearInterval(timerRef.current);
    fetchData();
    timerRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dashboardId, sheetName, fetchData]); // fetchData is stable, so this runs only on id changes

  const updateLead = useCallback(
    async (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l.rowIndex === payload.rowIndex ? { ...l, [payload.field]: payload.value } : l
        )
      );

      const res = await fetch('/api/sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          dashboardId: dashboardIdRef.current,
          sheetName:   sheetNameRef.current,
        }),
      });

      if (!res.ok) {
        await fetchData();
        throw new Error('Failed to save to Google Sheets');
      }
    },
    [fetchData]
  );

  return {
    leads,
    stats: { total: leads.length },
    loading,
    error,
    updateLead,
  };
}
