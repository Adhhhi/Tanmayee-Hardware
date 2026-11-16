import React, { useEffect, useState } from 'react';
import { Plus, UserCheck, UserPlus, X } from 'lucide-react';
import {
  BUYER_SEGMENTS,
  HARDWARE_CATEGORY_LIST,
  MANGALORE_ZONES,
  PAYMENT_METHOD_OPTIONS,
} from '../data/hardwareSampleData';
import { NewOrderInput, StoreCustomer } from '../types/analytics';

export interface AddOrderPrefill {
  mode: 'new' | 'old';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: StoreCustomer[];
  prefill?: AddOrderPrefill | null;
  onSubmitOrder: (input: NewOrderInput) => void;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  prefill,
  onSubmitOrder,
}) => {
  const [customerMode, setCustomerMode] = useState<'old' | 'new'>('old');
  const [existingCustomerId, setExistingCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSegment, setCustomerSegment] = useState<string>(BUYER_SEGMENTS[0]);
  const [zone, setZone] = useState<string>(MANGALORE_ZONES[0]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<string>(HARDWARE_CATEGORY_LIST[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHOD_OPTIONS[0].value);
  const [itemPrice, setItemPrice] = useState<string>('2500');
  const [freightValue, setFreightValue] = useState<string>('120');
  const [orderDate, setOrderDate] = useState<string>('2026-08-20');

  useEffect(() => {
    if (!isOpen) return;
    if (prefill?.mode === 'old' && prefill.customerId) {
      const match = customers.find((c) => c.id === prefill.customerId);
      setCustomerMode('old');
      setExistingCustomerId(prefill.customerId);
      if (match) {
        setZone(match.zone);
        setCustomerSegment(match.segment);
      }
    } else if (prefill?.mode === 'new') {
      setCustomerMode('new');
      setCustomerName(prefill.customerName ?? '');
      setCustomerPhone(prefill.customerPhone ?? '');
    } else {
      setCustomerMode(customers.length > 0 ? 'old' : 'new');
      const first = customers[0];
      if (first) {
        setExistingCustomerId(first.id);
        setZone(first.zone);
        setCustomerSegment(first.segment);
      }
      setCustomerName('');
      setCustomerPhone('');
    }
    setItemName('');
    setCategory(HARDWARE_CATEGORY_LIST[0]);
    setPaymentMethod(PAYMENT_METHOD_OPTIONS[0].value);
    setItemPrice('2500');
    setFreightValue('120');
  }, [isOpen, prefill, customers]);

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === existingCustomerId) ?? customers[0];
  const parsedPrice = Math.max(0, Number(itemPrice) || 0);
  const parsedFreight = Math.max(0, Number(freightValue) || 0);
  const totalBill = Math.round(parsedPrice + parsedFreight);

  const handleSelectExisting = (id: string) => {
    setExistingCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setZone(found.zone);
      setCustomerSegment(found.segment);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemName.trim() || parsedPrice <= 0) return;

    if (customerMode === 'old') {
      if (!selectedCustomer) return;
      onSubmitOrder({
        customerMode: 'old',
        existingCustomerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerSegment: selectedCustomer.segment,
        zone,
        itemName: itemName.trim(),
        category,
        paymentMethod,
        itemPrice: Math.round(parsedPrice),
        freightValue: Math.round(parsedFreight),
        orderDate,
      });
    } else {
      if (!customerName.trim() || !customerPhone.trim()) return;
      onSubmitOrder({
        customerMode: 'new',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerSegment,
        zone,
        itemName: itemName.trim(),
        category,
        paymentMethod,
        itemPrice: Math.round(parsedPrice),
        freightValue: Math.round(parsedFreight),
        orderDate,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-order-modal-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded shadow-xl overflow-hidden my-auto">
        <div className="px-5 py-3.5 bg-blue-600 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <h2 id="add-order-modal-title" className="text-base font-bold">
              Office Entry: Add Sales Item / Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-blue-100 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Customer Type Selector: Old vs New Customer */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCustomerMode('old')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded font-semibold cursor-pointer ${
                customerMode === 'old'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Old / Existing Customer ({customers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode('new')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded font-semibold cursor-pointer ${
                customerMode === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Customer</span>
            </button>
          </div>

          {/* Customer Details */}
          {customerMode === 'old' ? (
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded space-y-2">
              <label
                htmlFor="existing-customer-select"
                className="block font-semibold text-gray-800 dark:text-slate-200"
              >
                Select Existing Customer *
              </label>
              <select
                id="existing-customer-select"
                value={selectedCustomer?.id ?? ''}
                onChange={(e) => handleSelectExisting(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status} · {c.segment} · {c.zone} · {c.phone})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="new-customer-name"
                  className="block font-semibold text-gray-800 dark:text-slate-200"
                >
                  Customer / Contractor Name *
                </label>
                <input
                  id="new-customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Mangala Builders"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="new-customer-phone"
                  className="block font-semibold text-gray-800 dark:text-slate-200"
                >
                  Phone Number *
                </label>
                <input
                  id="new-customer-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g., 9845098765"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="new-customer-segment"
                  className="block font-semibold text-gray-800 dark:text-slate-200"
                >
                  Buyer Type
                </label>
                <select
                  id="new-customer-segment"
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white cursor-pointer"
                >
                  {BUYER_SEGMENTS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Item & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="order-item-name"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Item Name / Material Details *
              </label>
              <input
                id="order-item-name"
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., UltraTech Cement 50kg (15 Bags)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-category"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Hardware Category
              </label>
              <select
                id="order-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white cursor-pointer"
              >
                {HARDWARE_CATEGORY_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-zone"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Mangalore Delivery Zone
              </label>
              <select
                id="order-zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white cursor-pointer"
              >
                {MANGALORE_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-price"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Material Price (₹) *
              </label>
              <input
                id="order-price"
                type="number"
                min={1}
                required
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-freight"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Tempo Delivery Charge (₹)
              </label>
              <input
                id="order-freight"
                type="number"
                min={0}
                value={freightValue}
                onChange={(e) => setFreightValue(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-payment"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Payment Method
              </label>
              <select
                id="order-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white cursor-pointer"
              >
                {PAYMENT_METHOD_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-date"
                className="block font-semibold text-gray-700 dark:text-slate-300"
              >
                Billing Date
              </label>
              <input
                id="order-date"
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              Total Bill: ₹{totalBill.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Item &amp; Update All Dashboards</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
