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
  onUpdate: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
}

const STATUS_CELL_STYLE = (status: string) => {
  const map: Record<string, string> = {
    New: 'bg-gray-100 text-gray-700',
    Contacted: 'bg-blue-100 text-blue-700',
    Interested: 'bg-green-100 text-green-700',
    'Not Interested': 'bg-red-100 text-red-700',
    Converted: 'bg-emerald-100 text-emerald-700',
    'Follow Up': 'bg-yellow-100 text-yellow-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_CELL_STYLE(value)}`}>
      {value || '—'}
    </span>
  );
}

export default function LeadsTable({ leads, loading, search, onUpdate }: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const [savingRow, setSavingRow] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.phoneNumber.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.campaignName.toLowerCase().includes(q) ||
        l.Status.toLowerCase().includes(q) ||
        l.Comments.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const columnDefs: ColDef<Lead>[] = useMemo(
    () => [
      {
        headerName: 'Created Time',
        field: 'createdTime',
        width: 150,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Campaign',
        field: 'campaignName',
        width: 140,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Joining Plan',
        field: 'joiningPlan',
        width: 120,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Membership',
        field: 'membershipInterest',
        width: 130,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Full Name',
        field: 'fullName',
        flex: 1,
        minWidth: 140,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Phone',
        field: 'phoneNumber',
        width: 130,
        editable: false,
        filter: true,
      },
      {
        headerName: 'Address',
        field: 'address',
        flex: 1,
        minWidth: 160,
        editable: false,
        filter: true,
      },
      {
        headerName: 'Status',
        field: 'Status',
        width: 145,
        editable: true,
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: STATUS_OPTIONS },
        cellRenderer: (params: { value: string }) => <StatusBadge value={params.value} />,
        cellStyle: { display: 'flex', alignItems: 'center' } as Record<string, string>,
        headerClass: 'editable-col-header',
      },
      {
        headerName: 'Comments',
        field: 'Comments',
        flex: 2,
        minWidth: 200,
        editable: true,
        filter: true,
        cellEditor: 'agTextCellEditor',
        cellStyle: { color: '#374151' },
        headerClass: 'editable-col-header',
      },
    ],
    []
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      suppressMovable: false,
      cellStyle: { fontSize: '13px', color: '#374151' },
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
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading leads…
      </div>
    );
  }

  return (
    <div className="ag-theme-alpine w-full" style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
      <style>{`
        .ag-theme-alpine {
          --ag-font-size: 13px;
          --ag-header-background-color: #f9fafb;
          --ag-header-foreground-color: #6b7280;
          --ag-border-color: #e5e7eb;
          --ag-row-hover-color: #f0f7ff;
          --ag-selected-row-background-color: #eff6ff;
          --ag-odd-row-background-color: #ffffff;
          --ag-background-color: #ffffff;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
        .ag-theme-alpine .ag-header-cell-text {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .ag-theme-alpine .editable-col-header .ag-header-cell-text::after {
          content: " ✎";
          font-size: 10px;
          color: #3b82f6;
          font-style: normal;
        }
        .ag-theme-alpine .ag-cell-inline-editing {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
        }
        .ag-theme-alpine .ag-paging-panel {
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
      {savingRow !== null && (
        <div className="absolute right-6 top-2 text-xs text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 z-10">
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
        rowHeight={44}
        headerHeight={40}
        animateRows={false}
        suppressCellFocus={false}
        enableCellTextSelection
        getRowId={(params) => String(params.data.rowIndex)}
      />
    </div>
  );
}
