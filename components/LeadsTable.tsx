'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridReadyEvent,
  CellValueChangedEvent,
} from 'ag-grid-community';
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

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  New:             { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  Contacted:       { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  Interested:      { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  'Not Interested':{ bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  Converted:       { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  'Follow Up':     { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
};

function StatusBadge({ value }: { value: string }) {
  const style = STATUS_STYLES[value];
  if (!style) {
    return (
      <span style={{ background: '#F1F5F9', color: '#64748B' }}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium">
        {value || '—'}
      </span>
    );
  }
  return (
    <span
      style={{ background: style.bg, color: style.text }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
    >
      <span
        style={{ background: style.dot }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
      />
      {value}
    </span>
  );
}

const STATUS_COL: ColDef<Lead> = {
  headerName: 'Status',
  field: 'Status',
  width: 155,
  editable: true,
  sortable: true,
  filter: true,
  cellEditor: 'agSelectCellEditor',
  cellEditorParams: { values: STATUS_OPTIONS },
  cellRenderer: (params: { value: string }) => <StatusBadge value={params.value} />,
  cellStyle: { display: 'flex', alignItems: 'center' } as Record<string, string>,
  headerClass: 'editable-col-header',
};

const META_COLUMNS: ColDef<Lead>[] = [
  { headerName: 'Created Time',  field: 'createdTime',        width: 150, editable: false, sortable: true, filter: true },
  { headerName: 'Campaign',      field: 'campaignName',       width: 140, editable: false, sortable: true, filter: true },
  { headerName: 'Joining Plan',  field: 'joiningPlan',        width: 120, editable: false, sortable: true, filter: true },
  { headerName: 'Membership',    field: 'membershipInterest', width: 130, editable: false, sortable: true, filter: true },
  { headerName: 'Full Name',     field: 'fullName',           flex: 1, minWidth: 140, editable: false, sortable: true, filter: true },
  { headerName: 'Phone',         field: 'phoneNumber',        width: 130, editable: false, filter: true },
  { headerName: 'Address',       field: 'address',            flex: 1, minWidth: 160, editable: false, filter: true },
  STATUS_COL,
  {
    headerName: 'Comments',
    field: 'Comments',
    flex: 2,
    minWidth: 200,
    editable: true,
    filter: true,
    cellEditor: 'agTextCellEditor',
    cellStyle: { color: '#475569' },
    headerClass: 'editable-col-header',
  },
];

const WEBSITE_COLUMNS: ColDef<Lead>[] = [
  { headerName: 'Date',            field: 'createdTime',  width: 130,             editable: false, sortable: true, filter: true },
  { headerName: 'First Name',      field: 'fullName',     flex: 1, minWidth: 130, editable: false, sortable: true, filter: true },
  { headerName: 'Phone Number',    field: 'phoneNumber',  width: 150,             editable: false, filter: true },
  { headerName: 'Email Address',   field: 'email',        flex: 1, minWidth: 180, editable: false, filter: true },
  { headerName: 'Reason',          field: 'joiningPlan',  flex: 1, minWidth: 140, editable: false, sortable: true, filter: true },
  STATUS_COL,
  {
    headerName: 'Remarks',
    field: 'Comments',
    flex: 2,
    minWidth: 200,
    editable: true,
    filter: true,
    cellEditor: 'agTextCellEditor',
    cellStyle: { color: '#475569' },
    headerClass: 'editable-col-header',
  },
  { headerName: 'Transfer Branch', field: 'address', width: 160, editable: false, sortable: true, filter: true },
];

export default function LeadsTable({ leads, loading, search, dashboardId, onUpdate }: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const [savingRow, setSavingRow] = useState<number | null>(null);

  const isWebsite = dashboardId === 'website-leads';

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.phoneNumber.toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.campaignName.toLowerCase().includes(q) ||
        l.Status.toLowerCase().includes(q) ||
        l.Comments.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const columnDefs = useMemo(
    () => (isWebsite ? WEBSITE_COLUMNS : META_COLUMNS),
    [isWebsite]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      suppressMovable: false,
      cellStyle: { fontSize: '13px', color: '#0F172A' },
    }),
    []
  );

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent<Lead>) => {
      const { data, colDef, newValue } = event;
      if (!data || !colDef.field) return;
      if (colDef.field !== 'Status' && colDef.field !== 'Comments') return;
      if (newValue === event.oldValue) return;

      const editableField = colDef.field as 'Status' | 'Comments';
      setSavingRow(data.rowIndex);
      try {
        await onUpdate({ rowIndex: data.rowIndex, field: editableField, value: newValue ?? '' });
      } finally {
        setSavingRow(null);
      }
    },
    [onUpdate]
  );

  const onGridReady = useCallback((_: GridReadyEvent) => {}, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
        Loading leads…
      </div>
    );
  }

  return (
    <div
      className="ag-theme-alpine w-full"
      style={{ height: 'calc(100vh - 280px)', minHeight: 400, minWidth: 640 }}
    >
      <style>{`
        .ag-theme-alpine {
          --ag-font-size: 13px;
          --ag-font-family: ui-sans-serif, system-ui, sans-serif;
          --ag-header-background-color: #F8FAFC;
          --ag-header-foreground-color: #64748B;
          --ag-border-color: #E2E8F0;
          --ag-row-border-color: #F1F5F9;
          --ag-row-hover-color: #F0F7FF;
          --ag-selected-row-background-color: #EFF6FF;
          --ag-odd-row-background-color: #ffffff;
          --ag-background-color: #ffffff;
          --ag-secondary-foreground-color: #64748B;
          --ag-input-focus-border-color: #0A6BA8;
          --ag-range-selection-border-color: #0A6BA8;
        }
        .ag-theme-alpine .ag-header-cell-text {
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748B;
        }
        .ag-theme-alpine .ag-header-cell {
          border-right: 1px solid #F1F5F9;
        }
        .ag-theme-alpine .editable-col-header .ag-header-cell-text::after {
          content: " ✎";
          font-size: 10px;
          color: #0A6BA8;
          font-style: normal;
        }
        .ag-theme-alpine .ag-cell-inline-editing {
          border-color: #0A6BA8 !important;
          box-shadow: 0 0 0 3px rgba(10,107,168,0.12);
        }
        .ag-theme-alpine .ag-paging-panel {
          border-top: 1px solid #E2E8F0;
          font-size: 12px;
          color: #64748B;
          background: #F8FAFC;
        }
        .ag-theme-alpine .ag-paging-button {
          color: #0A6BA8;
        }
        .ag-theme-alpine .ag-row {
          border-bottom: 1px solid #F1F5F9;
        }
        .ag-theme-alpine .ag-row:hover {
          background-color: #F0F7FF;
        }
      `}</style>
      {savingRow !== null && (
        <div className="absolute right-6 top-2 text-xs text-[#0A6BA8] bg-blue-50 px-3 py-1 rounded-full border border-[#BFDBFE] z-10 font-medium shadow-sm">
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
        paginationPageSize={50}
        paginationPageSizeSelector={[25, 50, 100]}
        rowHeight={46}
        headerHeight={42}
        animateRows={false}
        suppressCellFocus={false}
        enableCellTextSelection
        getRowId={(params) => String(params.data.rowIndex)}
      />
    </div>
  );
}
