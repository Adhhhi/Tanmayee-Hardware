import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import { AddOrderModal, AddOrderPrefill } from './components/AddOrderModal';
import { DataProfilingSection } from './components/DataProfilingSection';
import { ExecutiveBriefSection } from './components/ExecutiveBriefSection';
import { HomePage } from './components/HomePage';
import { PowerBiSection } from './components/PowerBiSection';
import { INITIAL_CUSTOMERS, INITIAL_ORDERS } from './data/hardwareSampleData';
import { computeLiveStoreSummary, STORE_INFO } from './data/projectData';
import {
  CreditInquiry,
  HardwareSampleOrder,
  NewOrderInput,
  PageId,
  StoreCustomer,
} from './types/analytics';

interface NavLinkItem {
  id: PageId;
  label: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'explorer', label: 'Data Explorer' },
  { id: 'dashboard', label: 'Sales Dashboard' },
  { id: 'summary', label: 'Business Growth Plan' },
];

const LS_ORDERS_KEY = 'th_orders_v2';
const LS_CUSTOMERS_KEY = 'th_customers_v2';
const LS_INQUIRIES_KEY = 'th_inquiries_v2';
const LS_UPLOAD_NAME_KEY = 'th_upload_name_v2';

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<HardwareSampleOrder[]>(() =>
    loadStoredJson<HardwareSampleOrder[]>(LS_ORDERS_KEY, INITIAL_ORDERS)
  );
  const [customers, setCustomers] = useState<StoreCustomer[]>(() =>
    loadStoredJson<StoreCustomer[]>(LS_CUSTOMERS_KEY, INITIAL_CUSTOMERS)
  );
  const [inquiries, setInquiries] = useState<CreditInquiry[]>(() =>
    loadStoredJson<CreditInquiry[]>(LS_INQUIRIES_KEY, [])
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LS_UPLOAD_NAME_KEY);
    } catch {
      return null;
    }
  });
  const [isModifiedFromSample, setIsModifiedFromSample] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(LS_ORDERS_KEY) || localStorage.getItem(LS_UPLOAD_NAME_KEY));
    } catch {
      return false;
    }
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPrefill, setAddModalPrefill] = useState<AddOrderPrefill | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('th_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('th_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      if (isModifiedFromSample) {
        localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
        localStorage.setItem(LS_CUSTOMERS_KEY, JSON.stringify(customers));
        if (uploadedFileName) {
          localStorage.setItem(LS_UPLOAD_NAME_KEY, uploadedFileName);
        } else {
          localStorage.removeItem(LS_UPLOAD_NAME_KEY);
        }
      }
      localStorage.setItem(LS_INQUIRIES_KEY, JSON.stringify(inquiries));
    } catch {
      // ignore storage quota errors
    }
  }, [orders, customers, inquiries, uploadedFileName, isModifiedFromSample]);

  const liveSummary = useMemo(
    () => computeLiveStoreSummary(orders, customers),
    [orders, customers]
  );

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const navigateToPage = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddModal = (prefill?: AddOrderPrefill) => {
    setAddModalPrefill(prefill ?? null);
    setAddModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleAddOrder = (input: NewOrderInput) => {
    let targetCustomerId = input.existingCustomerId ?? '';
    const orderStatus = input.customerMode === 'old' ? 'Old' : 'New';

    if (input.customerMode === 'new') {
      targetCustomerId = `CUST-${Date.now()}`;
      const newCustomer: StoreCustomer = {
        id: targetCustomerId,
        name: input.customerName,
        phone: input.customerPhone,
        segment: input.customerSegment,
        zone: input.zone,
        status: 'New',
        createdAt: input.orderDate,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    } else if (targetCustomerId) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === targetCustomerId ? { ...c, status: 'Old' } : c))
      );
    }

    const creditDays =
      input.paymentMethod === 'net_30_credit'
        ? input.itemPrice + input.freightValue > 4500
          ? 45
          : 30
        : 0;

    const newOrder: HardwareSampleOrder = {
      orderId: `TH-KVR-${String(Math.floor(30000 + (Date.now() % 69000)))}`,
      customerId: targetCustomerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerStatus: orderStatus,
      itemName: input.itemName,
      category: input.category,
      customerSegment: input.customerSegment,
      paymentMethod: input.paymentMethod,
      creditDays,
      region: input.zone,
      itemPrice: input.itemPrice,
      freightValue: input.freightValue,
      orderValue: input.itemPrice + input.freightValue,
      orderDate: input.orderDate,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setIsModifiedFromSample(true);
    notify(`Added ${input.itemName} for ${input.customerName} (${orderStatus} customer)`);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    setIsModifiedFromSample(true);
    notify(`Deleted order ${orderId} across all dashboards`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const target = customers.find((c) => c.id === customerId);
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setOrders((prev) => prev.filter((o) => o.customerId !== customerId));
    setIsModifiedFromSample(true);
    notify(`Deleted customer ${target?.name ?? customerId} and their orders`);
  };

  const handleUploadCsvOrders = (csvOrders: HardwareSampleOrder[], fileName: string) => {
    const builtCustomers = new Map<string, StoreCustomer>();
    for (const o of csvOrders) {
      const existing = builtCustomers.get(o.customerId);
      if (existing) {
        existing.status = 'Old';
      } else {
        builtCustomers.set(o.customerId, {
          id: o.customerId,
          name: o.customerName,
          phone: o.customerPhone,
          segment: o.customerSegment,
          zone: o.region,
          status: o.customerStatus,
          createdAt: o.orderDate,
        });
      }
    }
    setOrders(csvOrders);
    setCustomers(Array.from(builtCustomers.values()));
    setUploadedFileName(fileName);
    setIsModifiedFromSample(true);
    notify(`Loaded ${csvOrders.length} rows from ${fileName}`);
  };

  const handleResetSampleData = () => {
    setOrders(INITIAL_ORDERS);
    setCustomers(INITIAL_CUSTOMERS);
    setUploadedFileName(null);
    setIsModifiedFromSample(false);
    try {
      localStorage.removeItem(LS_ORDERS_KEY);
      localStorage.removeItem(LS_CUSTOMERS_KEY);
      localStorage.removeItem(LS_UPLOAD_NAME_KEY);
    } catch {
      // ignore
    }
    notify('Restored Tanmayee Hardware sample dataset');
  };

  const handleAddInquiry = (inq: Omit<CreditInquiry, 'id' | 'createdAt'>) => {
    const item: CreditInquiry = {
      ...inq,
      id: `INQ-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setInquiries((prev) => [item, ...prev]);
    notify(`Saved inquiry for ${inq.business}`);
  };

  const handleDeleteInquiry = (id: string) => {
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    notify('Removed inquiry from office log');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-100 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Full-Window Business Top Header */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b-2 border-blue-600 dark:border-blue-500 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateToPage('home')}
            className="text-lg font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tanmayee Hardware
          </button>

          <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
            {NAV_LINKS.map((item) => {
              const isActive = item.id === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToPage(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-semibold'
                      : 'text-gray-600 dark:text-slate-300 border-transparent hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>

            {/* Bright / Dark Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsDark(false)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  !isDark
                    ? 'bg-white text-amber-600 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Bright</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDark(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'bg-slate-950 text-blue-400 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>

            <a
              href={STORE_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact / WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-gray-700 dark:text-slate-200 hover:text-gray-900 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-4 py-3 space-y-2">
            {NAV_LINKS.map((item) => {
              const isActive = item.id === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToPage(item.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item (New / Old Customer)</span>
            </button>

            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsDark(false)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded cursor-pointer ${
                  !isDark
                    ? 'bg-white text-amber-600 shadow-sm font-semibold'
                    : 'text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Bright Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDark(true)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded cursor-pointer ${
                  isDark
                    ? 'bg-slate-950 text-blue-400 shadow-sm font-semibold'
                    : 'text-gray-600'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </button>
            </div>

            <a
              href={STORE_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact / WhatsApp</span>
            </a>
          </div>
        )}
      </header>

      {/* Full-Window Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activePage === 'home' && (
          <HomePage
            orders={orders}
            customers={customers}
            inquiries={inquiries}
            summary={liveSummary}
            onNavigatePage={navigateToPage}
            onOpenAddModal={handleOpenAddModal}
            onDeleteOrder={handleDeleteOrder}
            onAddInquiry={handleAddInquiry}
            onDeleteInquiry={handleDeleteInquiry}
          />
        )}
        {activePage === 'explorer' && (
          <DataProfilingSection
            orders={orders}
            customers={customers}
            uploadedFileName={uploadedFileName}
            isModifiedFromSample={isModifiedFromSample}
            onUploadCsvOrders={handleUploadCsvOrders}
            onResetSampleData={handleResetSampleData}
            onOpenAddModal={handleOpenAddModal}
            onDeleteOrder={handleDeleteOrder}
            onDeleteCustomer={handleDeleteCustomer}
            onNotify={notify}
            isDark={isDark}
          />
        )}
        {activePage === 'dashboard' && (
          <PowerBiSection
            orders={orders}
            customers={customers}
            onOpenAddModal={handleOpenAddModal}
            onDeleteOrder={handleDeleteOrder}
          />
        )}
        {activePage === 'summary' && (
          <ExecutiveBriefSection summary={liveSummary} onNotify={notify} />
        )}

        {/* Simple Previous / Next Page Buttons */}
        {activePage !== 'home' && (() => {
          const currentIdx = NAV_LINKS.findIndex((item) => item.id === activePage);
          const prevItem = currentIdx > 0 ? NAV_LINKS[currentIdx - 1] : null;
          const nextItem =
            currentIdx >= 0 && currentIdx < NAV_LINKS.length - 1 ? NAV_LINKS[currentIdx + 1] : null;
          return (
            <div className="no-print mt-8 pt-5 border-t border-gray-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              {prevItem ? (
                <button
                  type="button"
                  onClick={() => navigateToPage(prevItem.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back: {prevItem.label}</span>
                </button>
              ) : (
                <div />
              )}

              {nextItem ? (
                <button
                  type="button"
                  onClick={() => navigateToPage(nextItem.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                >
                  <span>Next: {nextItem.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateToPage('home')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  <span>Back to Home</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })()}
      </main>

      {/* Full-Window Business Footer (Address kept only on Home page) */}
      <footer className="no-print w-full bg-white dark:bg-slate-900 border-t border-gray-300 dark:border-slate-700 mt-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {STORE_INFO.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Office Store &amp; Sales Portal</span>
              <span>·</span>
              <a
                href={STORE_INFO.phoneHref}
                className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
              >
                <Phone className="w-3 h-3" />
                <span>{STORE_INFO.phone}</span>
              </a>
              <span>·</span>
              <span>{STORE_INFO.hours}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-slate-300">
              {NAV_LINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToPage(item.id)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <a
              href={STORE_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact / WhatsApp</span>
            </a>
          </div>
        </div>
      </footer>

      <AddOrderModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        customers={customers}
        prefill={addModalPrefill}
        onSubmitOrder={handleAddOrder}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-gray-900 dark:bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded shadow-lg border border-gray-700 dark:border-slate-600"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
