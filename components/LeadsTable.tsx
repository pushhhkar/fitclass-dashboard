'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridReadyEvent,
  CellValueChangedEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { Lead, UpdatePayload } from '@/types';
import type { DynamicBranch } from '@/hooks/useBranches';
import { STATUS_OPTIONS } from '@/lib/config';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  leads: Lead[];
  loading: boolean;
  search: string;
  dashboardId: string;
  allBranches: DynamicBranch[];
  activeBranchName: string;
  onUpdate: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
  onTransfer: (lead: Lead, targetSheetName: string) => Promise<void>;
  newLeadRowKeys: Set<string>;
  websiteHeaders: string[];
}

// ── Breakpoint hook ───────────────────────────────────────────────────────────
function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; activeBg: string; activeBorder: string }> = {
  New:              { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', activeBg: '#DBEAFE', activeBorder: '#93C5FD' },
  Contacted:        { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', activeBg: '#FEF3C7', activeBorder: '#FCD34D' },
  Interested:       { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', activeBg: '#DCFCE7', activeBorder: '#86EFAC' },
  'Not Interested': { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', activeBg: '#FFEDD5', activeBorder: '#FDBA74' },
  Converted:        { bg: '#FAF5FF', color: '#7E22CE', dot: '#A855F7', activeBg: '#F3E8FF', activeBorder: '#D8B4FE' },
  'Follow Up':      { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', activeBg: '#D1FAE5', activeBorder: '#6EE7B7' },
};

function StatusBadge({ value }: { value: string }) {
  const cfg   = STATUS_CONFIG[value];
  const bg    = cfg?.bg    ?? '#F1F5F9';
  const color = cfg?.color ?? '#475569';
  const dot   = cfg?.dot   ?? '#94A3B8';
  return (
    <span style={{ background: bg, color }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold">
      <span style={{ background: dot }} className="w-1.5 h-1.5 rounded-full shrink-0" />
      {value || '—'}
    </span>
  );
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#CBD5E1]" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-[#F1F5F9] shrink-0">
          <span className="text-base font-semibold text-[#0F172A]">{title}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-3 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Mobile Status Picker ──────────────────────────────────────────────────────
interface StatusPickerProps {
  lead: Lead;
  onUpdate: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
}

function MobileStatusPicker({ lead, onUpdate }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(lead.Status);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (status: string) => {
    if (status === current) { setOpen(false); return; }
    setSaving(true);
    const prev = current;
    setCurrent(status);
    setOpen(false);
    try {
      await onUpdate({ rowIndex: lead.rowIndex, field: 'Status', value: status });
    } catch {
      setCurrent(prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={saving}
        className="flex items-center gap-1.5 disabled:opacity-60"
        style={{ minHeight: 44 }}
      >
        <StatusBadge value={current} />
        {saving ? (
          <svg className="w-3 h-3 animate-spin text-[#0A6BA8]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Update Status">
        <div className="flex flex-col gap-2">
          {STATUS_OPTIONS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = s === current;
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                style={{
                  minHeight: 52,
                  background: isActive ? (cfg?.activeBg ?? '#F8FAFC') : '#F8FAFC',
                  borderColor: isActive ? (cfg?.activeBorder ?? '#E2E8F0') : '#E2E8F0',
                  color: isActive ? (cfg?.color ?? '#0F172A') : '#0F172A',
                }}
                className="flex items-center gap-3 w-full px-4 rounded-xl border text-sm font-medium text-left transition-all active:scale-[0.98]"
              >
                <span style={{ background: cfg?.dot ?? '#94A3B8' }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                {s}
                {isActive && (
                  <svg className="ml-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

// ── Mobile Transfer Picker ────────────────────────────────────────────────────
interface TransferPickerProps {
  lead: Lead;
  allBranches: DynamicBranch[];
  activeBranchName: string;
  onTransfer: (lead: Lead, targetSheetName: string) => Promise<void>;
}

function MobileTransferPicker({ lead, allBranches, activeBranchName, onTransfer }: TransferPickerProps) {
  const [open, setOpen] = useState(false);
  const [dest, setDest] = useState(lead.transferTo ?? '');
  const [busy, setBusy] = useState(false);

  const otherBranches = allBranches.filter((b) => b.sheetName !== activeBranchName);

  if (dest) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1D4ED8]">
        {dest}
      </span>
    );
  }

  if (otherBranches.length === 0) {
    return <span className="text-xs text-[#94A3B8]">—</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] hover:border-[#0A6BA8] hover:text-[#0A6BA8] transition-colors disabled:opacity-50 active:scale-[0.97]"
        style={{ minHeight: 36 }}
      >
        <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Transfer
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Transfer Lead To">
        <div className="flex flex-col gap-2">
          {otherBranches.map((b) => (
            <button
              key={b.id}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onTransfer(lead, b.sheetName);
                  setDest(b.sheetName);
                  setOpen(false);
                } catch {
                  setBusy(false);
                }
              }}
              className="flex items-center gap-3 w-full px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-medium text-[#0F172A] text-left transition-all hover:border-[#0A6BA8] hover:bg-[#EFF6FF] hover:text-[#0A6BA8] active:scale-[0.98] disabled:opacity-50"
              style={{ minHeight: 52 }}
            >
              <svg className="w-4 h-4 text-[#64748B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {b.name}
              {busy && (
                <svg className="ml-auto w-4 h-4 animate-spin text-[#0A6BA8]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

// ── Mobile Comments Editor ────────────────────────────────────────────────────
interface CommentsEditorProps {
  lead: Lead;
  onUpdate: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
}

function MobileCommentsEditor({ lead, onUpdate }: CommentsEditorProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(lead.Comments ?? '');
  const [saved, setSaved] = useState(lead.Comments ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (value === saved) { setOpen(false); return; }
    setSaving(true);
    try {
      await onUpdate({ rowIndex: lead.rowIndex, field: 'Comments', value });
      setSaved(value);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-left text-sm text-[#475569] leading-relaxed w-full"
        style={{ minHeight: 24 }}
      >
        {saved || <span className="text-[#CBD5E1] italic text-xs">Tap to add remarks…</span>}
      </button>

      <BottomSheet open={open} onClose={() => { setValue(saved); setOpen(false); }} title="Remarks">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add remarks about this lead…"
          className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0A6BA8]/20 focus:border-[#0A6BA8] resize-none"
          rows={5}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full bg-[#0A6BA8] text-white text-sm font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </>
          ) : 'Save Remarks'}
        </button>
      </BottomSheet>
    </>
  );
}

// ── Mobile Lead Card ──────────────────────────────────────────────────────────
interface CardProps {
  lead: Lead;
  isNew: boolean;
  dashboardId: string;
  allBranches: DynamicBranch[];
  activeBranchName: string;
  websiteHeaders: string[];
  onUpdate: (payload: Omit<UpdatePayload, 'dashboardId' | 'sheetName'>) => Promise<void>;
  onTransfer: (lead: Lead, targetSheetName: string) => Promise<void>;
}

function MobileLeadCard({ lead, isNew, dashboardId, allBranches, activeBranchName, websiteHeaders, onUpdate, onTransfer }: CardProps) {
  const isWebsite = dashboardId === 'website-leads';
  const branchLabel = isWebsite
    ? (websiteHeaders[5] || 'Selected Branch')
    : 'Address';

  return (
    <div className={[
      'bg-white rounded-2xl border shadow-sm mx-4 flex flex-col gap-0 overflow-hidden transition-shadow',
      isNew ? 'border-[#93C5FD] shadow-blue-100' : 'border-[#E2E8F0]',
    ].join(' ')}>
      {isNew && (
        <div className="bg-[#DBEAFE] px-4 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
          <span className="text-xs font-semibold text-[#1D4ED8]">New Lead</span>
        </div>
      )}

      {/* Primary info */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-base font-bold text-[#0F172A] truncate">
            {lead.fullName || '—'}
          </span>
          <a
            href={`tel:${lead.phoneNumber}`}
            className="text-sm font-medium text-[#0A6BA8] flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 17.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {lead.phoneNumber || '—'}
          </a>
        </div>
        <div className="shrink-0 pt-0.5">
          <MobileStatusPicker lead={lead} onUpdate={onUpdate} />
        </div>
      </div>

      <div className="h-px bg-[#F1F5F9] mx-4" />

      {/* Meta fields */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {lead.address && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide w-20 shrink-0 pt-0.5">{branchLabel}</span>
            <span className="text-sm text-[#0F172A]">{lead.address}</span>
          </div>
        )}
        {/* Email hidden on mobile — too long, causes overflow */}
        {isWebsite && lead.reason && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide w-20 shrink-0 pt-0.5">{websiteHeaders[4] || 'Reason'}</span>
            <span className="text-sm text-[#475569]">{lead.reason}</span>
          </div>
        )}
        {!isWebsite && lead.campaignName && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide w-20 shrink-0 pt-0.5">Campaign</span>
            <span className="text-sm text-[#475569]">{lead.campaignName}</span>
          </div>
        )}
        {!isWebsite && lead.joiningPlan && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide w-20 shrink-0 pt-0.5">Plan</span>
            <span className="text-sm text-[#475569]">{lead.joiningPlan}</span>
          </div>
        )}
        {lead.createdTime && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide w-20 shrink-0 pt-0.5">Date</span>
            <span className="text-sm text-[#64748B]">{lead.createdTime}</span>
          </div>
        )}
      </div>

      <div className="h-px bg-[#F1F5F9] mx-4" />

      {/* Remarks */}
      <div className="px-4 py-3">
        <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
          {isWebsite ? (websiteHeaders[7] || 'Remarks') : 'Remarks'}
        </div>
        <MobileCommentsEditor lead={lead} onUpdate={onUpdate} />
      </div>

      {/* Transfer footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <span className="text-xs text-[#94A3B8]">Transfer</span>
        <MobileTransferPicker
          lead={lead}
          allBranches={allBranches}
          activeBranchName={activeBranchName}
          onTransfer={onTransfer}
        />
      </div>
    </div>
  );
}

// ── Desktop: Transfer To cell renderer ───────────────────────────────────────
interface TransferRendererProps extends ICellRendererParams<Lead> {
  allBranches: DynamicBranch[];
  activeBranchName: string;
  onTransfer: (lead: Lead, targetSheetName: string) => Promise<void>;
}

function TransferCellRenderer({ value, data, allBranches, activeBranchName, onTransfer }: TransferRendererProps) {
  const [localDest, setLocalDest] = useState<string>(value ?? '');
  const [busy, setBusy] = useState(false);

  if (!data) return null;

  const transferred = localDest || value;

  if (transferred) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1D4ED8]">
        {transferred}
      </span>
    );
  }

  const otherBranches = allBranches.filter((b) => b.sheetName !== activeBranchName);
  if (otherBranches.length === 0) return <span className="text-xs text-[#94A3B8]">—</span>;

  return (
    <select
      value=""
      disabled={busy}
      onChange={async (e) => {
        const target = e.target.value;
        if (!target) return;
        setBusy(true);
        try {
          await onTransfer(data, target);
          setLocalDest(target);
        } catch {
          setBusy(false);
        }
      }}
      className="text-xs text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0A6BA8] cursor-pointer max-w-[140px] disabled:opacity-50"
    >
      <option value="">Transfer to…</option>
      {otherBranches.map((b) => (
        <option key={b.id} value={b.sheetName}>{b.name}</option>
      ))}
    </select>
  );
}

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
`;

// ── Desktop column definitions ────────────────────────────────────────────────
function makeStatusCol(): ColDef<Lead> {
  return {
    headerName: 'Status',
    field: 'Status',
    width: 160,
    editable: true,
    sortable: true,
    filter: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: STATUS_OPTIONS },
    cellRenderer: (p: { value: string }) => <StatusBadge value={p.value} />,
    cellStyle: { display: 'flex', alignItems: 'center' } as Record<string, string>,
    headerClass: 'editable-col-header',
  };
}

function makeCommentsCol(headerName: string): ColDef<Lead> {
  return {
    headerName,
    field: 'Comments',
    flex: 2,
    minWidth: 180,
    editable: true,
    filter: true,
    cellEditor: 'agTextCellEditor',
    cellStyle: { color: '#475569' },
    headerClass: 'editable-col-header',
  };
}

function makeTransferCol(
  allBranches: DynamicBranch[],
  activeBranchName: string,
  onTransfer: (lead: Lead, target: string) => Promise<void>
): ColDef<Lead> {
  return {
    headerName: 'Transfer To',
    field: 'transferTo',
    width: 170,
    editable: false,
    sortable: false,
    filter: false,
    cellStyle: { display: 'flex', alignItems: 'center' } as Record<string, string>,
    cellRenderer: (p: ICellRendererParams<Lead>) => (
      <TransferCellRenderer
        {...p}
        allBranches={allBranches}
        activeBranchName={activeBranchName}
        onTransfer={onTransfer}
      />
    ),
  };
}

function buildMetaColumns(
  allBranches: DynamicBranch[],
  activeBranchName: string,
  onTransfer: (lead: Lead, target: string) => Promise<void>
): ColDef<Lead>[] {
  return [
    { headerName: 'Date',                field: 'createdTime',        width: 120, editable: false, sortable: true, filter: true },
    { headerName: 'Campaign',            field: 'campaignName',       width: 130, editable: false, sortable: true, filter: true },
    { headerName: 'Name',                field: 'fullName',           flex: 1, minWidth: 130, editable: false, sortable: true, filter: true },
    { headerName: 'Phone Number',        field: 'phoneNumber',        width: 130, editable: false, filter: true },
    { headerName: 'Address',             field: 'address',            flex: 1, minWidth: 140, editable: false, filter: true },
    { headerName: 'Plan Selected',       field: 'joiningPlan',        width: 130, editable: false, sortable: true, filter: true },
    { headerName: 'Membership Selected', field: 'membershipInterest', width: 155, editable: false, sortable: true, filter: true },
    { headerName: 'Primary Fitness Goal',field: 'fitnessGoal',        width: 170, editable: false, sortable: true, filter: true },
    makeStatusCol(),
    makeCommentsCol('Remarks'),
    makeTransferCol(allBranches, activeBranchName, onTransfer),
  ];
}

function buildWebsiteColumns(
  allBranches: DynamicBranch[],
  activeBranchName: string,
  onTransfer: (lead: Lead, target: string) => Promise<void>,
  headers: string[]
): ColDef<Lead>[] {
  const h = (i: number, fallback: string) => headers[i] || fallback;
  const statusCol = makeStatusCol();
  return [
    { headerName: h(0, 'Date'),            field: 'createdTime', width: 120,            editable: false, sortable: true, filter: true },
    { headerName: h(1, 'Name'),            field: 'fullName',    flex: 1, minWidth: 130, editable: false, sortable: true, filter: true },
    { headerName: h(2, 'Phone Number'),    field: 'phoneNumber', width: 140,            editable: false, filter: true },
    { headerName: h(3, 'Email Address'),   field: 'email',       flex: 1, minWidth: 180, editable: false, filter: true },
    { headerName: h(4, 'Reason'),          field: 'reason',      flex: 1, minWidth: 130, editable: false, sortable: true, filter: true },
    { headerName: h(5, 'Selected Branch'), field: 'address',     width: 150,            editable: false, sortable: true, filter: true },
    { ...statusCol, headerName: h(6, statusCol.headerName as string) },
    makeCommentsCol(h(7, 'Remarks')),
    makeTransferCol(allBranches, activeBranchName, onTransfer),
  ];
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeadsTable({
  leads, loading, search, dashboardId,
  allBranches, activeBranchName,
  newLeadRowKeys, websiteHeaders,
  onUpdate, onTransfer,
}: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const isWebsite = dashboardId === 'website-leads';

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) =>
      l.fullName.toLowerCase().includes(q) ||
      l.phoneNumber.toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      (l.reason ?? '').toLowerCase().includes(q) ||
      l.campaignName.toLowerCase().includes(q) ||
      l.Status.toLowerCase().includes(q) ||
      l.Comments.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const columnDefs = useMemo(
    () => isWebsite
      ? buildWebsiteColumns(allBranches, activeBranchName, onTransfer, websiteHeaders)
      : buildMetaColumns(allBranches, activeBranchName, onTransfer),
    [isWebsite, allBranches, activeBranchName, onTransfer, websiteHeaders]
  );

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
      await onUpdate({
        rowIndex: data.rowIndex,
        field: colDef.field as 'Status' | 'Comments',
        value: newValue ?? '',
      });
    } finally {
      setSavingRow(null);
    }
  }, [onUpdate]);

  const onGridReady = useCallback((_: GridReadyEvent) => {}, []);

  const getRowClass = useCallback((params: { data?: Lead }) => {
    if (!params.data) return '';
    const key = `${params.data.rowIndex}::${params.data.phoneNumber}::${params.data.fullName}`;
    return newLeadRowKeys.has(key) ? 'new-lead-row' : '';
  }, [newLeadRowKeys]);

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

  // ── Mobile card list ──────────────────────────────────────────────────────
  if (isMobile) {
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#94A3B8]">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">No leads found</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 py-4 pb-8">
        <div className="px-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        {filtered.map((lead) => {
          const key = `${lead.rowIndex}::${lead.phoneNumber}::${lead.fullName}`;
          return (
            <MobileLeadCard
              key={lead.rowIndex}
              lead={lead}
              isNew={newLeadRowKeys.has(key)}
              dashboardId={dashboardId}
              allBranches={allBranches}
              activeBranchName={activeBranchName}
              websiteHeaders={websiteHeaders}
              onUpdate={onUpdate}
              onTransfer={onTransfer}
            />
          );
        })}
      </div>
    );
  }

  // ── Desktop AG Grid ───────────────────────────────────────────────────────
  return (
    <div className="ag-theme-alpine w-full h-full" style={{ minHeight: 400, minWidth: 700 }}>
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
        getRowClass={getRowClass}
      />
    </div>
  );
}
