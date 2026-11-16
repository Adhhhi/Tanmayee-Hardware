import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { formatInrCompact, formatInrExact, LiveStoreSummary, STORE_INFO } from '../data/projectData';
import {
  CreditInquiry,
  HardwareSampleOrder,
  PageId,
  StoreCustomer,
} from '../types/analytics';
import { AddOrderPrefill } from './AddOrderModal';

interface HomePageProps {
  orders: HardwareSampleOrder[];
  customers: StoreCustomer[];
  inquiries: CreditInquiry[];
  summary: LiveStoreSummary;
  onNavigatePage: (page: PageId) => void;
  onOpenAddModal: (prefill?: AddOrderPrefill) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddInquiry: (inq: Omit<CreditInquiry, 'id' | 'createdAt'>) => void;
  onDeleteInquiry: (id: string) => void;
}

const ORDER_VOLUME_OPTIONS = [
  '₹25,000 – ₹1,00,000',
  '₹1,00,000 – ₹3,00,000',
  '₹3,00,000 – ₹10,00,000',
  '₹10,00,000+',
];

export const HomePage: React.FC<HomePageProps> = ({
  orders,
  inquiries,
  summary,
  onNavigatePage,
  onOpenAddModal,
  onDeleteOrder,
  onAddInquiry,
  onDeleteInquiry,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [activeSpotlightId, setActiveSpotlightId] = useState<string>('credit');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [monthlyOrder, setMonthlyOrder] = useState(ORDER_VOLUME_OPTIONS[1]);
  const [lastSubmittedBusiness, setLastSubmittedBusiness] = useState<string | null>(null);

  const highestFreightZone = [...summary.regionalMetrics].sort(
    (a, b) => b.freightRatio - a.freightRatio
  )[0];
  const topZone = summary.regionalMetrics[0];

  const spotlightTopics = [
    {
      id: 'credit',
      shortLabel: 'Trade Credit',
      stat: summary.creditMultiple > 0 ? `${summary.creditMultiple.toFixed(1)}x` : 'N/A',
      statLabel: 'Credit vs UPI Bill Ratio',
      question: 'Net-30 Credit vs Counter UPI',
      highlights: [
        `${formatInrExact(summary.creditAvgBill)} avg on Net-30 credit vs ${formatInrExact(summary.upiAvgBill)} on UPI`,
        `Total store average bill across ${summary.totalOrders} orders is ${formatInrExact(summary.avgOrderValue)}`,
      ],
      targetPage: 'explorer' as PageId,
      actionLabel: 'Open Data Explorer',
      boxClass:
        'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'retention',
      shortLabel: 'Old vs New Buyers',
      stat: `${summary.repeatOrderRate.toFixed(1)}%`,
      statLabel: 'Old Customer Order Share',
      question: 'Old & New Customer Activity',
      highlights: [
        `${summary.oldCustomerCount} Old customers placed ${summary.oldOrderCount} orders (${formatInrExact(summary.oldRevenue)})`,
        `${summary.newCustomerCount} New customers placed ${summary.newOrderCount} orders (${formatInrExact(summary.newRevenue)})`,
      ],
      targetPage: 'dashboard' as PageId,
      actionLabel: 'View Sales Dashboard',
      boxClass:
        'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    },
    {
      id: 'regional',
      shortLabel: 'Local Delivery',
      stat: topZone ? `${topZone.orders}` : '0',
      statLabel: topZone ? `Orders in ${topZone.region}` : 'Mangalore Orders',
      question: 'Mangalore Zone Delivery Costs',
      highlights: [
        topZone
          ? `${topZone.region} leads sales with ${formatInrExact(topZone.gmv)} (${topZone.freightRatio.toFixed(1)}% freight)`
          : 'No zone orders recorded yet',
        highestFreightZone
          ? `${highestFreightZone.region} has the highest freight at ${highestFreightZone.freightRatio.toFixed(1)}%`
          : 'Add orders to see freight breakdown',
      ],
      targetPage: 'dashboard' as PageId,
      actionLabel: 'Check Zone Metrics',
      boxClass:
        'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'category',
      shortLabel: 'Top Category',
      stat: `${summary.topCategory.sharePct.toFixed(1)}%`,
      statLabel: summary.topCategory.name,
      question: `${summary.topCategory.name} Leads Revenue`,
      highlights: [
        `${formatInrExact(summary.topCategory.revenue)} across ${summary.topCategory.orders} billed orders`,
        'Updates automatically whenever staff add or delete items',
      ],
      targetPage: 'summary' as PageId,
      actionLabel: 'View Growth Plan',
      boxClass:
        'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    },
  ];

  const activeSpotlight =
    spotlightTopics.find((q) => q.id === activeSpotlightId) || spotlightTopics[0];

  const handleQuoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !businessName.trim()) return;
    onAddInquiry({
      name: contactName.trim(),
      phone: contactPhone.trim(),
      business: businessName.trim(),
      monthlyOrder,
    });
    setLastSubmittedBusiness(businessName.trim());
    setContactName('');
    setContactPhone('');
    setBusinessName('');
    setMonthlyOrder(ORDER_VOLUME_OPTIONS[1]);
  };

  const kpiCards = [
    {
      label: 'Total Store Sales',
      value: formatInrCompact(summary.totalRevenue),
      sub: `Exact: ${formatInrExact(summary.totalRevenue)}`,
      headerBg: 'bg-blue-600 text-white',
      onClick: () => onNavigatePage('dashboard'),
    },
    {
      label: 'Total Orders',
      value: summary.totalOrders.toLocaleString('en-IN'),
      sub: `${summary.oldOrderCount} Old · ${summary.newOrderCount} New bills`,
      headerBg: 'bg-emerald-600 text-white',
      onClick: () => onNavigatePage('explorer'),
    },
    {
      label: 'Registered Customers',
      value: summary.totalCustomers.toLocaleString('en-IN'),
      sub: `${summary.oldCustomerCount} Old · ${summary.newCustomerCount} New buyers`,
      headerBg: 'bg-purple-600 text-white',
      onClick: () => onNavigatePage('explorer'),
    },
    {
      label: 'Average Bill Value',
      value: formatInrExact(summary.avgOrderValue),
      sub: `${summary.repeatOrderRate.toFixed(1)}% repeat order share`,
      headerBg: 'bg-orange-500 text-white',
      onClick: () => onNavigatePage('summary'),
    },
  ];

  const menuBoxes = [
    {
      title: '1. Data Explorer',
      desc: 'Add or delete items, manage New & Old customers, upload CSVs, and filter Mangalore zones.',
      icon: Compass,
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      action: () => onNavigatePage('explorer'),
      cta: 'Open Data Explorer',
    },
    {
      title: '2. Sales Dashboard',
      desc: 'Live monthly revenue, 7 hardware categories, New vs Old customer metrics, and delivery zones.',
      icon: BarChart3,
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      action: () => onNavigatePage('dashboard'),
      cta: 'Open Sales Dashboard',
    },
    {
      title: '3. Business Growth Plan',
      desc: 'Practical office action items synced to live sales totals with printable summary.',
      icon: FileSpreadsheet,
      btnColor: 'bg-orange-500 hover:bg-orange-600 text-white',
      action: () => onNavigatePage('summary'),
      cta: 'View Growth Plan',
    },
  ];

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-8 pb-6">
      {/* Store Overview & Single Address Card */}
      <section className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to {STORE_INFO.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Office Counter &amp; Store Operations Portal · Serving 5 Mangalore &amp; Dakshina Kannada Zones
            </p>

            {/* Store Address & Contact Card (Displayed Only Once Here) */}
            <div className="p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded space-y-2 text-xs">
              <div>
                <a
                  href={STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{STORE_INFO.address} (Open in Google Maps)</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-gray-700 dark:text-slate-300">
                <a
                  href={STORE_INFO.phoneHref}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{STORE_INFO.phone}</span>
                </a>
                <a
                  href={`mailto:${STORE_INFO.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{STORE_INFO.email}</span>
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>{STORE_INFO.hours}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenAddModal()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item (New / Old Customer)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigatePage('explorer')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
              >
                <span>Open Data Explorer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={STORE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Contact / WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="h-56 sm:h-64 rounded overflow-hidden border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/tanmayee_hardware_hero_1794820280634.jpg"
                  alt="Hardware supplies and tools at Tanmayee Hardware Company"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-gray-600 dark:text-slate-300 text-center">
                  <Wrench className="w-9 h-9 text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {STORE_INFO.name}
                  </div>
                  <div className="text-xs mt-1">Mangalore Hardware &amp; Building Supplies</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Live Store Numbers */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. Live Store Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.onClick}
              className="text-left bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden hover:border-blue-500 cursor-pointer"
            >
              <div className={`px-4 py-1.5 text-xs font-semibold ${kpi.headerBg}`}>
                {kpi.label}
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {kpi.value}
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-slate-400 tabular-nums">
                  {kpi.sub}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 2: Recent Items & Office Quick Delete */}
      <section className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
        <div className="px-5 py-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              2. Recent Counter Entries (Add or Delete Items)
            </h2>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Any added or deleted entry updates Home, Data Explorer, Sales Dashboard, and Business Growth Plan immediately.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAddModal({ mode: 'old' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add for Old Customer</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal({ mode: 'new' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add for New Customer</span>
            </button>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-600 dark:text-slate-400">
            No items recorded yet. Click Add Item above to create a bill.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Item &amp; Category</th>
                  <th className="py-2.5 px-4">Zone</th>
                  <th className="py-2.5 px-4 text-right">Total Bill</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 tabular-nums">
                {recentOrders.map((row) => (
                  <tr key={row.orderId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {row.orderId}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {row.customerName}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          row.customerStatus === 'Old'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {row.customerStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700 dark:text-slate-200">
                      <div className="font-medium">{row.itemName}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">{row.category}</div>
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                      {row.region}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {formatInrExact(row.orderValue)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteOrder(row.orderId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
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
        )}
      </section>

      {/* Section 3: Business Pages (3 Cards) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. Store Tools &amp; Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {menuBoxes.map((box) => {
            const Icon = box.icon;
            return (
              <div
                key={box.title}
                className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{box.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-slate-300">{box.desc}</p>
                  </div>
                  <Icon className="w-5 h-5 text-gray-500 dark:text-slate-400 shrink-0" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={box.action}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded cursor-pointer ${box.btnColor}`}
                  >
                    <span>{box.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Key Store Highlights */}
      <section className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
        <div className="px-5 py-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">4. Key Store Highlights</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {spotlightTopics.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSpotlightId(item.id)}
                className={`px-3 py-1 text-xs font-medium rounded border cursor-pointer ${
                  activeSpotlightId === item.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {item.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className={`md:col-span-4 rounded border p-4 ${activeSpotlight.boxClass}`}>
            <div className="text-xs font-medium">{activeSpotlight.statLabel}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{activeSpotlight.stat}</div>
          </div>

          <div className="md:col-span-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {activeSpotlight.question}
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600 dark:text-slate-300">
                {activeSpotlight.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage(activeSpotlight.targetPage)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
            >
              <span>{activeSpotlight.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 5: Contractor Credit Inquiry / Bulk Quote Log */}
      <section className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
        <div className="px-5 py-3 bg-blue-600 text-white flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold">5. Trade Credit / Bulk Quote Request (Office Log)</h2>
          <span className="text-xs text-blue-100">
            Save inquiries or convert them into customer orders
          </span>
        </div>

        <div className="p-5 space-y-5">
          {lastSubmittedBusiness && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Saved inquiry for <strong>{lastSubmittedBusiness}</strong> in the Office Quote Log below.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLastSubmittedBusiness(null)}
                className="font-semibold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="quote-name"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Name *
                </label>
                <input
                  id="quote-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g., Rajesh Shetty"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="quote-phone"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Phone *
                </label>
                <input
                  id="quote-phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g., +91 8762362711"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="quote-business"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Business / Contractor Name *
                </label>
                <input
                  id="quote-business"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Karavali Builders, Bondel"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="quote-order"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Estimated Monthly Order
                </label>
                <select
                  id="quote-order"
                  value={monthlyOrder}
                  onChange={(e) => setMonthlyOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white cursor-pointer"
                >
                  {ORDER_VOLUME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                Direct Counter Desk: {STORE_INFO.phone} · {STORE_INFO.hours}
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
              >
                <span>Save Inquiry to Office Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {inquiries.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-gray-800 dark:text-slate-200">
                Saved Inquiries ({inquiries.length})
              </div>
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                      <th className="py-2 px-3">Business / Contractor</th>
                      <th className="py-2 px-3">Contact Person</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Monthly Est.</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {inquiries.map((inq) => (
                      <tr key={inq.id}>
                        <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">
                          {inq.business}
                        </td>
                        <td className="py-2 px-3 text-gray-700 dark:text-slate-300">{inq.name}</td>
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-slate-400">
                          {inq.phone}
                        </td>
                        <td className="py-2 px-3 text-gray-700 dark:text-slate-300">
                          {inq.monthlyOrder}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenAddModal({
                                mode: 'new',
                                customerName: inq.business,
                                customerPhone: inq.phone,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Create Order</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteInquiry(inq.id)}
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
          )}
        </div>
      </section>
    </div>
  );
};
