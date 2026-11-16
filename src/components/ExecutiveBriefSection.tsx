import React, { useState } from 'react';
import { Download, MessageCircle, Phone, Printer } from 'lucide-react';
import {
  buildBusinessGrowthPlanMd,
  formatInrExact,
  LiveStoreSummary,
  STORE_INFO,
} from '../data/projectData';

interface ExecutiveBriefSectionProps {
  summary: LiveStoreSummary;
  onNotify: (msg: string) => void;
}

export const ExecutiveBriefSection: React.FC<ExecutiveBriefSectionProps> = ({
  summary,
  onNotify,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  const handleDownloadPlan = () => {
    const markdown = buildBusinessGrowthPlanMd(summary);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tanmayee_hardware_business_growth_plan.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Downloaded business growth plan');
  };

  const highestFreightZone = [...summary.regionalMetrics].sort(
    (a, b) => b.freightRatio - a.freightRatio
  )[0];
  const lowestFreightZone = [...summary.regionalMetrics].sort(
    (a, b) => a.freightRatio - b.freightRatio
  )[0];

  const findings = [
    {
      stat: summary.creditMultiple > 0 ? `${summary.creditMultiple.toFixed(1)}x` : 'N/A',
      label: 'Credit Bill Size Lift',
      summary: `Net-30 credit averages ${formatInrExact(summary.creditAvgBill)} vs ${formatInrExact(summary.upiAvgBill)} on UPI.`,
      header: 'bg-blue-600 text-white',
    },
    {
      stat: `${summary.topCategory.sharePct.toFixed(1)}%`,
      label: `${summary.topCategory.name} Share`,
      summary: `${formatInrExact(summary.topCategory.revenue)} across ${summary.topCategory.orders} billed orders.`,
      header: 'bg-emerald-600 text-white',
    },
    {
      stat: `${summary.repeatOrderRate.toFixed(1)}%`,
      label: 'Old Customer Share',
      summary: `${summary.oldCustomerCount} Old customers (${summary.oldOrderCount} bills) vs ${summary.newCustomerCount} New buyers.`,
      header: 'bg-orange-500 text-white',
    },
    {
      stat: highestFreightZone ? `${highestFreightZone.freightRatio.toFixed(1)}%` : '0%',
      label: highestFreightZone ? `${highestFreightZone.region} Freight` : 'Zone Freight',
      summary: lowestFreightZone
        ? `${lowestFreightZone.region} runs ${lowestFreightZone.freightRatio.toFixed(1)}% vs ${highestFreightZone?.freightRatio.toFixed(1)}% on ${highestFreightZone?.region}.`
        : 'Delivery cost breakdown by Mangalore zone.',
      header: 'bg-rose-600 text-white',
    },
  ];

  const initiatives = [
    {
      priority: 'P1',
      initiative: 'Convert New Buyers to Net-30 Credit',
      target: `${summary.newCustomerCount} New customers (${summary.newOrderCount} bills)`,
      impact: `Grow avg bill from ${formatInrExact(summary.avgOrderValue)} toward ${formatInrExact(Math.max(summary.avgOrderValue * 1.25, summary.creditAvgBill))}`,
      owner: 'Trade Credit',
    },
    {
      priority: 'P2',
      initiative: 'Scheduled Tempo Runs to Outer Routes',
      target: highestFreightZone ? `${highestFreightZone.region} (${highestFreightZone.orders} orders)` : 'Outer Mangalore Zones',
      impact: 'Cut delivery time <2 days & lower tempo %',
      owner: 'Dispatch & Tempo',
    },
    {
      priority: 'P3',
      initiative: '60-Day Paint & Hardware Reorder Follow-Up',
      target: `${summary.oldCustomerCount} Old/returning contractor accounts`,
      impact: `Keep repeat order share above ${Math.max(70, Math.round(summary.repeatOrderRate))}%`,
      owner: 'Counter Sales',
    },
    {
      priority: 'P4',
      initiative: 'Main Yard Multi-Category Bundle Discount',
      target: `${summary.topCategory.name} + Plumbing + Fasteners`,
      impact: `Lift total store sales past ${formatInrExact(summary.totalRevenue * 1.15)}`,
      owner: 'Counter Pricing',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="no-print bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Business Growth Plan
          </h1>
          <div className="text-xs text-gray-600 dark:text-slate-400">
            {STORE_INFO.name} · Synced Live Store Action Plan
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={STORE_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Contact / WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Summary</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPlan}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Plan</span>
          </button>
        </div>
      </div>

      {/* Printable Store Summary */}
      <article className="print-container bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-6 space-y-6">
        <header className="pb-4 border-b border-gray-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {STORE_INFO.name} — Live Store Growth Plan
            </h2>
            <div className="mt-1 text-xs text-gray-600 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
              <a
                href={STORE_INFO.phoneHref}
                className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
              >
                <Phone className="w-3 h-3" />
                <span>{STORE_INFO.phone}</span>
              </a>
              <span>·</span>
              <span>{STORE_INFO.email}</span>
              <span>·</span>
              <span>{STORE_INFO.hours}</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400 tabular-nums">
            {summary.totalOrders.toLocaleString('en-IN')} Orders · {formatInrExact(summary.totalRevenue)} Sales · {summary.totalCustomers} Customers
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {findings.map((f) => (
            <div
              key={f.label}
              className="border border-gray-300 dark:border-slate-700 rounded overflow-hidden bg-gray-50 dark:bg-slate-800"
            >
              <div className={`px-3 py-1.5 text-xs font-semibold ${f.header}`}>{f.label}</div>
              <div className="p-4 space-y-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {f.stat}
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-300">{f.summary}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Store Action Plan (Click Any Row to Highlight)
            </h3>
            {selectedPriority && (
              <button
                type="button"
                onClick={() => setSelectedPriority(null)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Show All
              </button>
            )}
          </div>
          <div className="overflow-x-auto border border-gray-300 dark:border-slate-700 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Store Action</th>
                  <th className="py-2.5 px-4">Target Customers</th>
                  <th className="py-2.5 px-4">Expected Result</th>
                  <th className="py-2.5 px-4">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {initiatives.map((row) => {
                  const isHighlighted = selectedPriority === row.priority;
                  const dimmed = selectedPriority !== null && !isHighlighted;
                  return (
                    <tr
                      key={row.priority}
                      onClick={() =>
                        setSelectedPriority((prev) => (prev === row.priority ? null : row.priority))
                      }
                      className={`cursor-pointer transition-colors ${
                        isHighlighted
                          ? 'bg-blue-50 dark:bg-blue-950/60'
                          : dimmed
                          ? 'opacity-45 hover:opacity-100'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            row.priority === 'P1'
                              ? 'text-rose-700 dark:text-rose-400'
                              : row.priority === 'P2'
                              ? 'text-amber-700 dark:text-amber-400'
                              : row.priority === 'P3'
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {row.initiative}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300">{row.target}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white tabular-nums">
                        {row.impact}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {row.owner}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </div>
  );
};
