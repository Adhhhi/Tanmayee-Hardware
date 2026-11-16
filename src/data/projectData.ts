import {
  CohortRow,
  HardwareSampleOrder,
  MonthlyMetric,
  RegionalMetric,
  StoreCustomer,
} from '../types/analytics';
import { HARDWARE_CATEGORY_LIST, MANGALORE_ZONES, ZONE_PINCODES } from './hardwareSampleData';

export const STORE_INFO = {
  name: 'Tanmayee Hardware Company',
  address: 'Kavoor Junction, Kavoor, Mangalore - 575015',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Kavoor+Junction,+Kavoor,+Mangalore+575015',
  phone: '+91 8762362711',
  phoneHref: 'tel:+918762362711',
  email: 'tanmayeehardware@example.com',
  hours: 'Mon–Sat, 8:30 AM – 8:00 PM',
  whatsappUrl:
    'https://wa.me/918762362711?text=Hello%20Tanmayee%20Hardware%20Company%20(Kavoor%20Junction,%20Mangalore)',
};

export const COHORT_MATRIX: CohortRow[] = [
  { cohort: '2025-05', size: 642, months: [100, 18.4, 14.2, 11.8, 10.6, 9.8, 9.5] },
  { cohort: '2025-07', size: 695, months: [100, 17.1, 13.5, 10.9, 9.7, 9.1, 8.8] },
  { cohort: '2025-09', size: 734, months: [100, 21.6, 16.8, 13.4, 11.9, 10.8, 10.4] },
  { cohort: '2025-11', size: 1120, months: [100, 16.2, 11.9, 8.7, 7.6, 7.2, 6.9] },
  { cohort: '2026-01', size: 984, months: [100, 15.8, 12.4, 9.6, 8.4, 7.9, null] },
  { cohort: '2026-03', size: 912, months: [100, 17.9, 13.8, 10.5, 9.1, null, null] },
  { cohort: '2026-05', size: 886, months: [100, 19.2, 14.6, 11.2, null, null, null] },
];

export const SLA_VS_REVIEW = [
  { label: 'On Time / Same Day', share: 91.6, score: 4.34, detractorPct: 7.2 },
  { label: '1–2 Days Late', share: 3.2, score: 3.12, detractorPct: 34.8 },
  { label: '3–5 Days Late', share: 2.5, score: 2.24, detractorPct: 61.4 },
  { label: '6+ Days Late', share: 2.7, score: 1.58, detractorPct: 83.6 },
];

export function formatInrExact(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatInrCompact(num: number): string {
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(2)} L`;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export interface LiveStoreSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  freightTotal: number;
  freightPct: number;
  totalCustomers: number;
  oldCustomerCount: number;
  newCustomerCount: number;
  oldOrderCount: number;
  newOrderCount: number;
  oldRevenue: number;
  newRevenue: number;
  repeatOrderRate: number;
  creditAvgBill: number;
  upiAvgBill: number;
  creditMultiple: number;
  topCategory: { name: string; revenue: number; orders: number; sharePct: number };
  categoryRows: { name: string; revenue: number; orders: number; pctOfTop: number; sharePct: number }[];
  monthlyMetrics: MonthlyMetric[];
  regionalMetrics: RegionalMetric[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeLiveStoreSummary(
  orders: HardwareSampleOrder[],
  customers: StoreCustomer[]
): LiveStoreSummary {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.orderValue, 0);
  const freightTotal = orders.reduce((s, o) => s + o.freightValue, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const freightPct = totalRevenue > 0 ? (freightTotal / totalRevenue) * 100 : 0;

  const oldCustomerCount = customers.filter((c) => c.status === 'Old').length;
  const newCustomerCount = customers.filter((c) => c.status === 'New').length;
  const totalCustomers = customers.length;

  let oldOrderCount = 0;
  let newOrderCount = 0;
  let oldRevenue = 0;
  let newRevenue = 0;
  let creditSum = 0;
  let creditCnt = 0;
  let upiSum = 0;
  let upiCnt = 0;

  const catMap = new Map<string, { revenue: number; orders: number }>();
  for (const catName of HARDWARE_CATEGORY_LIST) {
    catMap.set(catName, { revenue: 0, orders: 0 });
  }

  const monthMap = new Map<string, MonthlyMetric>();
  const zoneMap = new Map<
    string,
    { gmv: number; freight: number; orders: number; oldOrders: number; newOrders: number }
  >();
  for (const z of MANGALORE_ZONES) {
    zoneMap.set(z, { gmv: 0, freight: 0, orders: 0, oldOrders: 0, newOrders: 0 });
  }

  for (const o of orders) {
    if (o.customerStatus === 'Old') {
      oldOrderCount++;
      oldRevenue += o.orderValue;
    } else {
      newOrderCount++;
      newRevenue += o.orderValue;
    }

    if (o.paymentMethod === 'net_30_credit') {
      creditSum += o.orderValue;
      creditCnt++;
    } else if (o.paymentMethod === 'upi') {
      upiSum += o.orderValue;
      upiCnt++;
    }

    const prevCat = catMap.get(o.category) ?? { revenue: 0, orders: 0 };
    catMap.set(o.category, {
      revenue: prevCat.revenue + o.orderValue,
      orders: prevCat.orders + 1,
    });

    const ym = (o.orderDate || '2026-08-01').slice(0, 7);
    const [yrStr, moStr] = ym.split('-');
    const yr = Number(yrStr) || 2026;
    const moIdx = Math.max(0, Math.min(11, (Number(moStr) || 1) - 1));
    const existingMonth = monthMap.get(ym) ?? {
      key: ym,
      month: MONTH_NAMES[moIdx],
      year: yr,
      gmv: 0,
      orders: 0,
      newOrders: 0,
      oldOrders: 0,
    };
    existingMonth.gmv += o.orderValue;
    existingMonth.orders += 1;
    if (o.customerStatus === 'Old') existingMonth.oldOrders += 1;
    else existingMonth.newOrders += 1;
    monthMap.set(ym, existingMonth);

    const prevZone = zoneMap.get(o.region) ?? {
      gmv: 0,
      freight: 0,
      orders: 0,
      oldOrders: 0,
      newOrders: 0,
    };
    prevZone.gmv += o.orderValue;
    prevZone.freight += o.freightValue;
    prevZone.orders += 1;
    if (o.customerStatus === 'Old') prevZone.oldOrders += 1;
    else prevZone.newOrders += 1;
    zoneMap.set(o.region, prevZone);
  }

  const repeatOrderRate = totalOrders > 0 ? (oldOrderCount / totalOrders) * 100 : 0;
  const creditAvgBill = creditCnt > 0 ? creditSum / creditCnt : 0;
  const upiAvgBill = upiCnt > 0 ? upiSum / upiCnt : 0;
  const creditMultiple = upiAvgBill > 0 ? creditAvgBill / upiAvgBill : 0;

  const sortedCats = Array.from(catMap.entries())
    .map(([name, st]) => ({
      name,
      revenue: st.revenue,
      orders: st.orders,
      sharePct: totalRevenue > 0 ? (st.revenue / totalRevenue) * 100 : 0,
    }))
    .filter((c) => c.orders > 0 || (HARDWARE_CATEGORY_LIST as readonly string[]).includes(c.name))
    .sort((a, b) => b.revenue - a.revenue);

  const topRev = Math.max(sortedCats[0]?.revenue ?? 1, 1);
  const categoryRows = sortedCats.map((c) => ({
    ...c,
    pctOfTop: Math.round((c.revenue / topRev) * 100),
  }));

  const topCategory = categoryRows[0] ?? {
    name: 'Cement & Steel',
    revenue: 0,
    orders: 0,
    sharePct: 0,
  };

  const monthlyMetrics = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  const regionalMetrics: RegionalMetric[] = Array.from(zoneMap.entries())
    .map(([region, z]) => {
      const avgDeliveryDays =
        region === 'Kavoor & Bondel'
          ? 1.1
          : region === 'Bejai & City Center'
          ? 1.5
          : region === 'Surathkal & Panambur'
          ? 2.2
          : region === 'Bajpe & Moodbidri'
          ? 3.4
          : 3.8;
      const avgReview =
        region === 'Kavoor & Bondel'
          ? 4.48
          : region === 'Bejai & City Center'
          ? 4.32
          : region === 'Surathkal & Panambur'
          ? 4.18
          : region === 'Bajpe & Moodbidri'
          ? 3.95
          : 3.82;
      return {
        region,
        topStates: ZONE_PINCODES[region] ?? 'Mangalore & Dakshina Kannada',
        gmv: z.gmv,
        orders: z.orders,
        freightRatio: z.gmv > 0 ? (z.freight / z.gmv) * 100 : 0,
        avgBill: z.orders > 0 ? z.gmv / z.orders : 0,
        oldOrders: z.oldOrders,
        newOrders: z.newOrders,
        avgDeliveryDays,
        avgReview,
      };
    })
    .sort((a, b) => b.gmv - a.gmv);

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    freightTotal,
    freightPct,
    totalCustomers,
    oldCustomerCount,
    newCustomerCount,
    oldOrderCount,
    newOrderCount,
    oldRevenue,
    newRevenue,
    repeatOrderRate,
    creditAvgBill,
    upiAvgBill,
    creditMultiple,
    topCategory,
    categoryRows,
    monthlyMetrics,
    regionalMetrics,
  };
}

export function buildBusinessGrowthPlanMd(summary: LiveStoreSummary): string {
  const highestFreightZone = [...summary.regionalMetrics].sort(
    (a, b) => b.freightRatio - a.freightRatio
  )[0];
  return `# Business Growth Plan — ${STORE_INFO.name}

**Contact:** ${STORE_INFO.phone} · ${STORE_INFO.email} · ${STORE_INFO.hours}
**Live Store Volume:** ${summary.totalOrders.toLocaleString('en-IN')} Orders · ${formatInrExact(summary.totalRevenue)} Sales · ${summary.totalCustomers} Customers (${summary.oldCustomerCount} Old / ${summary.newCustomerCount} New)

---

## 1. Key Store Insights
1. **Trade Credit Increases Bill Size:** Net-30/45 contractor accounts average **${formatInrExact(summary.creditAvgBill)}** per bill vs **${formatInrExact(summary.upiAvgBill)}** on counter UPI checkouts.
2. **${summary.topCategory.name} Leads Revenue:** ${summary.topCategory.name} accounts for **${summary.topCategory.sharePct.toFixed(1)}%** of current sales (${summary.topCategory.orders} orders).
3. **Old vs New Customer Mix:** Old/returning buyers contribute **${summary.oldOrderCount} orders** (${formatInrExact(summary.oldRevenue)}), while new buyers account for **${summary.newOrderCount} orders** (${formatInrExact(summary.newRevenue)}).
4. **Local Delivery Cost Focus:** ${highestFreightZone ? `${highestFreightZone.region} currently carries **${highestFreightZone.freightRatio.toFixed(1)}%** tempo freight ratio.` : 'Monitor outer-zone tempo freight.'}

---

## 2. 12-Month Store Action Plan
| Priority | Store Action | Target Group | Expected Result |
| :--- | :--- | :--- | :--- |
| **P1** | Fast-Track Net-30 Contractor Credit | Convert New Contractors (${summary.newCustomerCount}) to Repeat Accounts | Higher average bill size |
| **P2** | Scheduled Tempo Runs to Outer Zones | ${highestFreightZone ? highestFreightZone.region : 'Ullal & Moodbidri'} bulk deliveries | Cut delivery time to <2 days |
| **P3** | 60-Day Paint & Waterproofing Reminders | Old/Returning customers (${summary.oldCustomerCount} accounts) | Boost repeat order frequency |
| **P4** | Main Yard Multi-Category Bundle Discount | Combine Cement + Plumbing + Fasteners ₹2,500+ | Lift avg bill above ${formatInrExact(summary.avgOrderValue * 1.15)} |
`;
}
