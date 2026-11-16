import React, { useMemo, useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { MANGALORE_ZONES } from '../data/hardwareSampleData';
import {
  COHORT_MATRIX,
  computeLiveStoreSummary,
  formatInrCompact,
  formatInrExact,
  SLA_VS_REVIEW,
} from '../data/projectData';
import { HardwareSampleOrder, StoreCustomer, ZoneCode } from '../types/analytics';
import { AddOrderPrefill } from './AddOrderModal';

interface PowerBiSectionProps {
  orders: HardwareSampleOrder[];
  customers: StoreCustomer[];
  onOpenAddModal: (prefill?: AddOrderPrefill) => void;
  onDeleteOrder: (orderId: string) => void;
}

const REPORT_TAB_STYLES = {
  revenue: 'bg-blue-600 text-white',
  retention: 'bg-emerald-600 text-white',
  regional: 'bg-orange-500 text-white',
};

const ZONE_BUTTON_STYLES: Record<'All' | ZoneCode, string> = {
  All: 'bg-gray-900 dark:bg-blue-600 text-white',
  'Kavoor & Bondel': 'bg-blue-600 text-white',
  'Bejai & City Center': 'bg-emerald-600 text-white',
  'Surathkal & Panambur': 'bg-purple-600 text-white',
  'Bajpe & Moodbidri': 'bg-orange-500 text-white',
  'Ullal & BC Road': 'bg-rose-600 text-white',
};

const CATEGORY_BAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-orange-500',
  'bg-cyan-600',
  'bg-rose-500',
  'bg-amber-500',
];

export const PowerBiSection: React.FC<PowerBiSectionProps> = ({
  orders,
  customers,
  onOpenAddModal,
  onDeleteOrder,
}) => {
  const [reportPage, setReportPage] = useState<'revenue' | 'retention' | 'regional'>('revenue');
  const [yearFilter, setYearFilter] = useState<'All' | number>('All');
  const [regionFilter, setRegionFilter] = useState<'All' | string>('All');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'All' | 'Old' | 'New'>('All');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [pinnedMonthIdx, setPinnedMonthIdx] = useState<number | null>(null);

  const activeMonthIdx = hoveredMonthIdx ?? pinnedMonthIdx;

  const availableYears = useMemo(() => {
    const yrs = Array.from(
      new Set(orders.map((o) => Number((o.orderDate || '2026-08-01').slice(0, 4)) || 2026))
    ).sort();
    return yrs;
  }, [orders]);

  const zoneOptions = useMemo(() => {
    const fromOrders = Array.from(new Set(orders.map((o) => o.region))).filter(Boolean);
    const merged = Array.from(new Set([...MANGALORE_ZONES, ...fromOrders]));
    return ['All', ...merged];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderYear = Number((o.orderDate || '2026-08-01').slice(0, 4)) || 2026;
      const matchYear = yearFilter === 'All' || orderYear === yearFilter;
      const matchRegion = regionFilter === 'All' || o.region === regionFilter;
      const matchStatus =
        customerStatusFilter === 'All' || o.customerStatus === customerStatusFilter;
      return matchYear && matchRegion && matchStatus;
    });
  }, [orders, yearFilter, regionFilter, customerStatusFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchRegion = regionFilter === 'All' || c.zone === regionFilter;
      const matchStatus = customerStatusFilter === 'All' || c.status === customerStatusFilter;
      return matchRegion && matchStatus;
    });
  }, [customers, regionFilter, customerStatusFilter]);

  const liveSummary = useMemo(
    () => computeLiveStoreSummary(filteredOrders, filteredCustomers),
    [filteredOrders, filteredCustomers]
  );

  const allZoneSummary = useMemo(() => {
    const yearAndStatusFiltered = orders.filter((o) => {
      const orderYear = Number((o.orderDate || '2026-08-01').slice(0, 4)) || 2026;
      const matchYear = yearFilter === 'All' || orderYear === yearFilter;
      const matchStatus =
        customerStatusFilter === 'All' || o.customerStatus === customerStatusFilter;
      return matchYear && matchStatus;
    });
    return computeLiveStoreSummary(yearAndStatusFiltered, customers);
  }, [orders, customers, yearFilter, customerStatusFilter]);

  const maxMonthlyGmv = Math.max(...liveSummary.monthlyMetrics.map((m) => m.gmv), 1);

  const cohortCellBg = (val: number | null, idx: number) => {
    if (val === null) return 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600';
    if (idx === 0) return 'bg-gray-900 dark:bg-blue-700 text-white';
    if (val >= 16) return 'bg-emerald-600 text-white';
    if (val >= 13) return 'bg-teal-600 text-white';
    if (val >= 10) return 'bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100';
    return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200';
  };

  const hasFilters =
    yearFilter !== 'All' || regionFilter !== 'All' || customerStatusFilter !== 'All';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h1>
          <div className="text-xs text-gray-600 dark:text-slate-400">
            Live Monthly Revenue, Hardware Categories, New vs Old Customers &amp; Mangalore Delivery Zones
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenAddModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item (New / Old Customer)</span>
        </button>
      </div>

      {/* Filters & Section Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 self-start">
            {(
              [
                { id: 'revenue', label: 'Monthly Revenue & Categories' },
                { id: 'retention', label: 'New & Old Customers' },
                { id: 'regional', label: 'Mangalore Delivery Zones' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setReportPage(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                  reportPage === p.id
                    ? REPORT_TAB_STYLES[p.id]
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
              {(['All', 'Old', 'New'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCustomerStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                    customerStatusFilter === st
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  {st === 'All' ? 'All Buyers' : `${st} Customers`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
              {(['All', ...availableYears] as const).map((y) => (
                <button
                  key={String(y)}
                  type="button"
                  onClick={() => {
                    setYearFilter(y);
                    setPinnedMonthIdx(null);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                    yearFilter === y
                      ? 'bg-white dark:bg-slate-950 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setYearFilter('All');
                  setRegionFilter('All');
                  setCustomerStatusFilter('All');
                  setPinnedMonthIdx(null);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 self-start">
          {zoneOptions.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setRegionFilter(zone)}
              className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                regionFilter === zone
                  ? ZONE_BUTTON_STYLES[zone as 'All' | ZoneCode] ?? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {zone === 'All' ? 'All Mangalore Zones' : zone}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Live KPI Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold">
            Total Revenue
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatInrCompact(liveSummary.totalRevenue)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
              Exact: {formatInrExact(liveSummary.totalRevenue)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold">
            Avg Order Value
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatInrExact(liveSummary.avgOrderValue)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
              {liveSummary.freightPct.toFixed(1)}% tempo freight
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold">
            Orders Billed
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {liveSummary.totalOrders.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
              {liveSummary.oldOrderCount} Old · {liveSummary.newOrderCount} New customer bills
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold">
            Customers (Old / New)
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {liveSummary.totalCustomers}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
              {liveSummary.oldCustomerCount} Old · {liveSummary.newCustomerCount} New buyers
            </div>
          </div>
        </div>
      </div>

      {reportPage === 'revenue' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Monthly Sales ({yearFilter === 'All' ? 'All Months' : yearFilter})
                </h2>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Updates Live on Add / Delete
                </span>
              </div>
              {activeMonthIdx !== null && liveSummary.monthlyMetrics[activeMonthIdx] && (
                <div className="text-xs font-mono bg-gray-900 dark:bg-slate-800 text-white px-3 py-1 rounded border border-gray-700 tabular-nums">
                  {liveSummary.monthlyMetrics[activeMonthIdx].month}{' '}
                  {liveSummary.monthlyMetrics[activeMonthIdx].year}:{' '}
                  {formatInrExact(liveSummary.monthlyMetrics[activeMonthIdx].gmv)} ·{' '}
                  {liveSummary.monthlyMetrics[activeMonthIdx].orders} orders (
                  {liveSummary.monthlyMetrics[activeMonthIdx].oldOrders} Old /{' '}
                  {liveSummary.monthlyMetrics[activeMonthIdx].newOrders} New)
                </div>
              )}
            </div>

            {liveSummary.monthlyMetrics.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-500 dark:text-slate-400">
                No monthly sales matching current filters.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 760 270"
                  className="w-full min-w-[540px] h-auto select-none"
                  role="img"
                  aria-label="Live monthly revenue bar chart"
                >
                  {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                    const y = 222 - tick * 185;
                    const labelVal = maxMonthlyGmv * tick;
                    return (
                      <g key={i}>
                        <line
                          x1={58}
                          y1={y}
                          x2={745}
                          y2={y}
                          className="stroke-gray-200 dark:stroke-slate-700"
                          strokeWidth={1}
                        />
                        <text
                          x={50}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-gray-500 dark:fill-slate-400 text-[10px] font-mono"
                        >
                          {labelVal >= 100_000
                            ? `${(labelVal / 100_000).toFixed(1)}L`
                            : `${Math.round(labelVal / 1000)}K`}
                        </text>
                      </g>
                    );
                  })}

                  {liveSummary.monthlyMetrics.map((m, idx) => {
                    const plotW = 675;
                    const slotW = plotW / liveSummary.monthlyMetrics.length;
                    const barW = Math.min(34, slotW * 0.65);
                    const x = 65 + idx * slotW + (slotW - barW) / 2;
                    const barH = (m.gmv / maxMonthlyGmv) * 185;
                    const y = 222 - barH;
                    const isPeak = m.gmv === maxMonthlyGmv;
                    const isSelected = activeMonthIdx === idx;
                    const baseFill = isPeak
                      ? '#16A34A'
                      : m.year >= 2026
                      ? '#4F46E5'
                      : '#2563EB';

                    return (
                      <g
                        key={m.key}
                        onMouseEnter={() => setHoveredMonthIdx(idx)}
                        onMouseLeave={() => setHoveredMonthIdx(null)}
                        onClick={() => setPinnedMonthIdx((prev) => (prev === idx ? null : idx))}
                        className="cursor-pointer"
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={Math.max(2, barH)}
                          rx={2}
                          fill={isSelected ? '#F59E0B' : baseFill}
                          opacity={activeMonthIdx !== null && !isSelected ? 0.45 : 0.95}
                        />
                        <text
                          x={x + barW / 2}
                          y={242}
                          textAnchor="middle"
                          className="fill-gray-600 dark:fill-slate-400 text-[9px] font-mono"
                        >
                          {m.month}
                        </text>
                        {(idx === 0 || m.month === 'Jan') && (
                          <text
                            x={x + barW / 2}
                            y={256}
                            textAnchor="middle"
                            className="fill-gray-900 dark:fill-slate-200 text-[9px] font-mono font-semibold"
                          >
                            {m.year}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Top Hardware Categories
              </h2>

              <div className="mt-4 space-y-3">
                {liveSummary.categoryRows.map((cat, idx) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-gray-800 dark:text-slate-200 truncate">
                        {cat.name} ({cat.orders})
                      </span>
                      <span className="font-mono text-gray-600 dark:text-slate-400 tabular-nums shrink-0">
                        {formatInrExact(cat.revenue)}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-800 rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${CATEGORY_BAR_COLORS[idx % CATEGORY_BAR_COLORS.length]}`}
                        style={{ width: `${cat.pctOfTop}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-400 tabular-nums">
              Net-30 credit avg: <strong className="text-blue-600 dark:text-blue-400">{formatInrExact(liveSummary.creditAvgBill)}</strong> vs {formatInrExact(liveSummary.upiAvgBill)} UPI
            </div>
          </div>
        </div>
      )}

      {reportPage === 'retention' && (
        <div className="space-y-6">
          {/* Live New vs Old Customer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Old / Existing Customers
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                  {liveSummary.oldCustomerCount} buyers
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {formatInrExact(liveSummary.oldRevenue)}
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-300 tabular-nums">
                {liveSummary.oldOrderCount} billed orders ({liveSummary.repeatOrderRate.toFixed(1)}% of total orders)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  New Customers
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                  {liveSummary.newCustomerCount} buyers
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {formatInrExact(liveSummary.newRevenue)}
              </div>
              <div className="text-xs text-gray-600 dark:text-slate-300 tabular-nums">
                {liveSummary.newOrderCount} billed orders ({(100 - liveSummary.repeatOrderRate).toFixed(1)}% of total orders)
              </div>
            </div>
          </div>

          {/* Latest Customer Orders with Quick Delete */}
          <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
            <div className="px-5 py-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Recent Orders by New &amp; Old Customers ({filteredOrders.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 font-semibold">
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Item &amp; Category</th>
                    <th className="py-2.5 px-4">Zone</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 tabular-nums">
                  {filteredOrders.slice(0, 8).map((o) => (
                    <tr key={o.orderId}>
                      <td className="py-2.5 px-4 font-mono text-gray-500 dark:text-slate-400">
                        {o.orderId}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white">
                        {o.customerName}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            o.customerStatus === 'Old'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {o.customerStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-700 dark:text-slate-200">
                        {o.itemName} ({o.category})
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 dark:text-slate-300">{o.region}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                        {formatInrExact(o.orderValue)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteOrder(o.orderId)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Repeat Tracking */}
          <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Repeat Customer Monthly Benchmark (Months 1–6)
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Percentage of new Mangalore contractors and dealers returning to reorder
                </p>
              </div>
              <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Current Repeat Order Share: {liveSummary.repeatOrderRate.toFixed(1)}%
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400">
                    <th className="py-2 px-3 text-left">First Order Month</th>
                    <th className="py-2 px-3 text-right">New Buyers</th>
                    {['Month 0', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'].map(
                      (m) => (
                        <th key={m} className="py-2 px-3 text-center">
                          {m}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {COHORT_MATRIX.map((row) => (
                    <tr key={row.cohort}>
                      <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white text-left">
                        {row.cohort}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 dark:text-slate-300">
                        {row.size.toLocaleString('en-IN')}
                      </td>
                      {row.months.map((val, idx) => (
                        <td key={idx} className="p-1">
                          <div
                            className={`py-2 px-2 text-center rounded font-medium ${cohortCellBg(val, idx)}`}
                          >
                            {val === null ? '—' : idx === 0 ? '100%' : `${val.toFixed(1)}%`}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportPage === 'regional' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
            <div className="px-5 py-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Mangalore Delivery Zones (Click Row to Filter)
              </h2>
              {regionFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setRegionFilter('All')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 font-semibold">
                    <th className="py-2.5 px-4">Mangalore Zone</th>
                    <th className="py-2.5 px-4 text-right">Orders (Old/New)</th>
                    <th className="py-2.5 px-4 text-right">Revenue</th>
                    <th className="py-2.5 px-4 text-right">Freight %</th>
                    <th className="py-2.5 px-4 text-right">Avg Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 tabular-nums">
                  {allZoneSummary.regionalMetrics.map((r) => {
                    const isActive = regionFilter === r.region;
                    return (
                      <tr
                        key={r.region}
                        onClick={() => setRegionFilter(isActive ? 'All' : r.region)}
                        className={`cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/60'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {r.region}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">
                            {r.topStates}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-700 dark:text-slate-200">
                          {r.orders} ({r.oldOrders}/{r.newOrders})
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white font-medium">
                          {formatInrExact(r.gmv)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-semibold ${
                            r.freightRatio >= 7
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {r.freightRatio.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                          {formatInrExact(r.avgBill)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Delivery Speed vs Customer Rating
            </h2>

            <div className="mt-4 space-y-4">
              {SLA_VS_REVIEW.map((bucket) => (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {bucket.label}{' '}
                      <span className="text-gray-500 dark:text-slate-400 font-normal">
                        ({bucket.share}%)
                      </span>
                    </span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white tabular-nums">
                      {bucket.score.toFixed(2)} / 5
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-800 rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${
                        bucket.score >= 4
                          ? 'bg-emerald-500'
                          : bucket.score >= 3
                          ? 'bg-orange-500'
                          : 'bg-rose-600'
                      }`}
                      style={{ width: `${(bucket.score / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
                    Low ratings (1–2★): {bucket.detractorPct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
