'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { Lead, UpdatePayload } from '@/types';
import { STATUS_OPTIONS } from '@/lib/config';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  leads: Lead[];
  loading: boolean;
  search: string;
  dashboardId: string;
  onUpdate: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
}

// ── status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  New:              { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  Contacted:        { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  Interested:       { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  'Not Interested': { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  Converted:        { bg: '#FAF5FF', color: '#7E22CE', dot: '#A855F7' },
  'Follow Up':      { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
};

function StatusBadge({ value }: { value: string }) {
  const cfg = STATUS_CONFIG[value];
  const bg    = cfg?.bg    ?? '#F1F5F9';
  const color = cfg?.color ?? '#475569';
  const dot   = cfg?.dot   ?? '#94A3B8';
  return (
    <span
      style={{ background: bg, color }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    >
      <span style={{ background: dot }} className="w-1.5 h-1.5 rounded-full shrink-0" />
      {value || '—'}
    </span>
  );
}

// ── shared editable columns ──────────────────────────────────────────────────
const STATUS_COL: ColDef<Lead> = {
  headerName: 'Status',
  field: 'Status',
  width: 160,
  editable: true,
  sortable: true,
  filter: true,
  cellEditor: 'agSelectCellEditor',
  cellEditorParams: { values: STATUS_OPTIONS },
  cellRenderer: (params: { value: string }) => <StatusBadge value={params.value} />,
  cellStyle: { display: 'flex', alignItems: 'center' } as Record<string, string>,
  headerClass: 'editable-col-header',
};

function commentsCol(headerName: string): ColDef<Lead> {
  return {
    headerName,
    field: 'Comments',
    flex: 2,
    minWidth: 200,
    editable: true,
    filter: true,
    cellEditor: 'agTextCellEditor',
    cellStyle: { color: '#475569' },
    headerClass: 'editable-col-header',
  };
}

// ── column sets ───────────────────────────────────────────────────────────────
const META_COLUMNS: ColDef<Lead>[] = [
  { headerName: 'Created Time',  field: 'createdTime',        width: 150, editable: false, sortable: true, filter: true },
  { headerName: 'Campaign',      field: 'campaignName',       width: 140, editable: false, sortable: true, filter: true },
  { headerName: 'Joining Plan',  field: 'joiningPlan',        width: 130, editable: false, sortable: true, filter: true },
  { headerName: 'Membership',    field: 'membershipInterest', width: 130, editable: false, sortable: true, filter: true },
  { headerName: 'Full Name',     field: 'fullName',           flex: 1, minWidth: 140, editable: false, sortable: true, filter: true },
  { headerName: 'Phone',         field: 'phoneNumber',        width: 130, editable: false, filter: true },
  { headerName: 'Address',       field: 'address',            flex: 1, minWidth: 160, editable: false, filter: true },
  STATUS_COL,
  commentsCol('Comments'),
];

const WEBSITE_COLUMNS: ColDef<Lead>[] = [
  { headerName: 'Date',            field: 'createdTime',  width: 130,             editable: false, sortable: true, filter: true },
  { headerName: 'First Name',      field: 'fullName',     flex: 1, minWidth: 130, editable: false, sortable: true, filter: true },
  { headerName: 'Phone Number',    field: 'phoneNumber',  width: 150,             editable: false, filter: true },
  { headerName: 'Email Address',   field: 'email',        flex: 1, minWidth: 180, editable: false, filter: true },
  { headerName: 'Reason',          field: 'joiningPlan',  flex: 1, minWidth: 140, editable: false, sortable: true, filter: true },
  STATUS_COL,
  commentsCol('Remarks'),
  { headerName: 'Transfer Branch', field: 'address',      width: 160, editable: false, sortable: true, filter: true },
];

// ── AG Grid CSS ───────────────────────────────────────────────────────────────
const GRID_STYLES = `
  .ag-theme-alpine {
    --ag-font-size: 13px;
    --ag-font-family: ui-sans-serif, system-ui, sans-serif;
    --ag-header-background-color: #F8FAFC;
    --ag-header-foreground-color: #64748B;
    --ag-border-color: #E2E8F0;
    --ag-row-border-color: #F1F5F9;
    --ag-row-hover-color: #F0F9FF;
    --ag-selected-row-background-color: #EFF6FF;
    --ag-odd-row-background-color: #FFFFFF;
    --ag-background-color: #FFFFFF;
    --ag-secondary-foreground-color: #64748B;
    --ag-input-focus-border-color: #0A6BA8;
    --ag-range-selection-border-color: #0A6BA8;
    --ag-checkbox-checked-color: #0A6BA8;
  }
  .ag-theme-alpine .ag-header-cell-text {
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #64748B;
  }
  .ag-theme-alpine .ag-header-cell {
    border-right: 1px solid #F1F5F9;
  }
  .ag-theme-alpine .editable-col-header .ag-header-cell-text::after {
    content: " ✎";
    font-size: 9px;
    color: #0A6BA8;
  }
  .ag-theme-alpine .ag-cell-inline-editing {
    border-color: #0A6BA8 !important;
    box-shadow: 0 0 0 3px rgba(10,107,168,0.12);
  }
  .ag-theme-alpine .ag-row {
    border-bottom: 1px solid #F8FAFC;
  }
  .ag-theme-alpine .ag-paging-panel {
    border-top: 1px solid #E2E8F0;
    font-size: 12px;
    color: #64748B;
    background: #F8FAFC;
    padding: 8px 16px;
  }
  .ag-theme-alpine .ag-paging-button button {
    border-radius: 6px;
  }
`;

// ── component ─────────────────────────────────────────────────────────────────
export default function LeadsTable({ leads, loading, search, dashboardId, onUpdate }: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const [savingRow, setSavingRow] = useState<number | null>(null);

  const isWebsite = dashboardId === 'website-leads';

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.fullName.toLowerCase().includes(q) ||
      l.phoneNumber.toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      l.campaignName.toLowerCase().includes(q) ||
      l.Status.toLowerCase().includes(q) ||
      l.Comments.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const columnDefs = useMemo(() => isWebsite ? WEBSITE_COLUMNS : META_COLUMNS, [isWebsite]);

  const defaultColDef: ColDef = useMemo(() => ({
    resizable: true,
    suppressMovable: false,
    cellStyle: { fontSize: '13px', color: '#0F172A' },
  }), []);

  const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<Lead>) => {
    const { data, colDef, newValue } = event;
    if (!data || !colDef.field) return;
    if (colDef.field !== 'Status' && colDef.field !== 'Comments') return;
    if (newValue === event.oldValue) return;

    setSavingRow(data.rowIndex);
    try {
      await onUpdate({ rowIndex: data.rowIndex, field: colDef.field as 'Status' | 'Comments', value: newValue ?? '' });
    } finally {
      setSavingRow(null);
    }
  }, [onUpdate]);

  const onGridReady = useCallback((_: GridReadyEvent) => {}, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#94A3B8]">
        <svg className="w-6 h-6 animate-spin text-[#0A6BA8]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Loading leads…</span>
      </div>
    );
  }

  return (
    <div
      className="ag-theme-alpine w-full h-full"
      style={{ minHeight: 400, minWidth: 640 }}
    >
      <style>{GRID_STYLES}</style>

      {savingRow !== null && (
        <div className="absolute right-4 top-2 z-10 flex items-center gap-1.5 text-xs font-medium text-[#0A6BA8] bg-white border border-[#BFDBFE] px-3 py-1.5 rounded-full shadow-sm">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Saving…
        </div>
      )}

      <AgGridReact<Lead>
        ref={gridRef}
        rowData={filtered}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        pagination
        paginationPageSize={25}
        paginationPageSizeSelector={[25, 50, 100]}
        rowHeight={48}
        headerHeight={44}
        animateRows={false}
        suppressCellFocus={false}
        enableCellTextSelection
        getRowId={(params) => String(params.data.rowIndex)}
      />
    </div>
  );
}
