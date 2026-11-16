export type PageId = 'home' | 'explorer' | 'dashboard' | 'summary';

export type ZoneCode =
  | 'Kavoor & Bondel'
  | 'Surathkal & Panambur'
  | 'Bejai & City Center'
  | 'Bajpe & Moodbidri'
  | 'Ullal & BC Road';

export type CustomerStatus = 'New' | 'Old';

export interface StoreCustomer {
  id: string;
  name: string;
  phone: string;
  segment: string;
  zone: string;
  status: CustomerStatus;
  createdAt: string;
}

export interface HardwareSampleOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerStatus: CustomerStatus;
  itemName: string;
  category: string;
  customerSegment: string;
  paymentMethod: string;
  creditDays: number;
  region: string;
  itemPrice: number;
  freightValue: number;
  orderValue: number;
  orderDate: string;
}

export interface NewOrderInput {
  customerMode: 'new' | 'old';
  existingCustomerId?: string;
  customerName: string;
  customerPhone: string;
  customerSegment: string;
  zone: string;
  itemName: string;
  category: string;
  paymentMethod: string;
  itemPrice: number;
  freightValue: number;
  orderDate: string;
}

export interface CreditInquiry {
  id: string;
  name: string;
  phone: string;
  business: string;
  monthlyOrder: string;
  createdAt: string;
}

export interface MonthlyMetric {
  key: string;
  month: string;
  year: number;
  gmv: number;
  orders: number;
  newOrders: number;
  oldOrders: number;
}

export interface RegionalMetric {
  region: string;
  topStates: string;
  gmv: number;
  orders: number;
  freightRatio: number;
  avgBill: number;
  oldOrders: number;
  newOrders: number;
  avgDeliveryDays: number;
  avgReview: number;
}

export interface CohortRow {
  cohort: string;
  size: number;
  months: (number | null)[];
}
