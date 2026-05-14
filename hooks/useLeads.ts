'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Lead, StatsData, UpdatePayload } from '@/types';

const REFRESH_INTERVAL_MS = 300_000; // 5 minutes

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dashboardIdRef = useRef(dashboardId);
  const sheetNameRef   = useRef(sheetName);
  dashboardIdRef.current = dashboardId;
  sheetNameRef.current   = sheetName;

  // silent=true → background refresh; no loading spinner, no table reset
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        dashboardId: dashboardIdRef.current,
        sheet:       sheetNameRef.current,
      });
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Lead[] = await res.json();
      setLeads(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Tab/dashboard changed — reset and do a full (non-silent) load
    setLeads([]);
    setLoading(true);
    setLastUpdated(null);

    if (timerRef.current) clearInterval(timerRef.current);

    fetchData(false);
    timerRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dashboardId, sheetName, fetchData]);

  const updateLead = useCallback(
    async (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => {
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
        await fetchData(true);
        throw new Error('Failed to save to Google Sheets');
      }
    },
    [fetchData]
  );

  return {
    leads,
    stats: { total: leads.length, lastUpdated },
    loading,
    error,
    updateLead,
  };
}
