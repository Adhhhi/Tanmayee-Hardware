import { HardwareSampleOrder, StoreCustomer, ZoneCode } from '../types/analytics';

interface HardwareCategorySpec {
  name: string;
  weight: number;
  basePrice: number;
  spread: number;
  sampleItems: string[];
}

export const MANGALORE_ZONES: ZoneCode[] = [
  'Kavoor & Bondel',
  'Bejai & City Center',
  'Surathkal & Panambur',
  'Bajpe & Moodbidri',
  'Ullal & BC Road',
];

export const HARDWARE_CATEGORY_LIST = [
  'Cement & Steel',
  'Fasteners & Hinges',
  'Plumbing & Sanitary',
  'Electricals & Cables',
  'Paints & Waterproofing',
  'Pipes & Tanks',
  'Power Tools',
] as const;

export const BUYER_SEGMENTS = ['Contractor', 'Hardware Dealer', 'Walk-In Retail'] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'net_30_credit', label: 'Net-30 Credit' },
  { value: 'neft_rtgs', label: 'NEFT / RTGS' },
  { value: 'upi', label: 'UPI Instant' },
  { value: 'corporate_card', label: 'Corporate Card' },
] as const;

export const ZONE_PINCODES: Record<string, string> = {
  'Kavoor & Bondel': '575015 · Kunjathbail, Bondel, Derebail',
  'Bejai & City Center': '575001–04 · Kadri, Hampankatta, Lalbagh',
  'Surathkal & Panambur': '575014 · Baikampady, NITK, Kulai',
  'Bajpe & Moodbidri': '574142 · Kaikamba, Airport Rd, Moodbidri',
  'Ullal & BC Road': '574219 · Thokkottu, Ullal, Bantwal',
};

const HARDWARE_CATEGORIES: HardwareCategorySpec[] = [
  {
    name: 'Cement & Steel',
    weight: 22,
    basePrice: 3450,
    spread: 1700,
    sampleItems: ['UltraTech Cement 50kg (10 Bags)', 'TMT Steel Bar 12mm Bundle', 'ACC Concrete Plus Cement'],
  },
  {
    name: 'Fasteners & Hinges',
    weight: 19,
    basePrice: 780,
    spread: 380,
    sampleItems: ['SS Door Hinges & Screws Pack', 'Anchor Fasteners Box (100 pcs)', 'GI Hex Bolts & Washers'],
  },
  {
    name: 'Plumbing & Sanitary',
    weight: 15,
    basePrice: 1520,
    spread: 720,
    sampleItems: ['Jaquar Brass Angle Valve Set', 'CPVC Elbow & Tee Assortment', 'Wash Basin Mixer Tap'],
  },
  {
    name: 'Electricals & Cables',
    weight: 14,
    basePrice: 1860,
    spread: 890,
    sampleItems: ['Finolex 2.5 sqmm Wire Coil', 'Havells MCB Distribution Box', 'Modular Switchboard Kit'],
  },
  {
    name: 'Paints & Waterproofing',
    weight: 12,
    basePrice: 1640,
    spread: 780,
    sampleItems: ['Asian Paints Apex Ultima 10L', 'Dr. Fixit Roofseal 4L', 'Interior Primer & Putty Pack'],
  },
  {
    name: 'Pipes & Tanks',
    weight: 10,
    basePrice: 2240,
    spread: 1050,
    sampleItems: ['Ashirvad UPVC 4-Inch Pipe (4 pcs)', 'Sintex 500L Water Tank', 'Supreme SWR Drainage Pipe Set'],
  },
  {
    name: 'Power Tools',
    weight: 8,
    basePrice: 3280,
    spread: 1480,
    sampleItems: ['Bosch Angle Grinder GWS 600', 'Makita Hammer Drill Kit', 'Diamond Marble Cutter Blades'],
  },
];

const ZONE_WEIGHTS: { region: ZoneCode; weight: number; freightMult: number }[] = [
  { region: 'Kavoor & Bondel', weight: 38, freightMult: 0.028 },
  { region: 'Bejai & City Center', weight: 26, freightMult: 0.036 },
  { region: 'Surathkal & Panambur', weight: 16, freightMult: 0.052 },
  { region: 'Bajpe & Moodbidri', weight: 11, freightMult: 0.074 },
  { region: 'Ullal & BC Road', weight: 9, freightMult: 0.086 },
];

export const INITIAL_CUSTOMERS: StoreCustomer[] = [
  { id: 'CUST-001', name: 'Karavali Builders', phone: '9845011201', segment: 'Contractor', zone: 'Kavoor & Bondel', status: 'Old', createdAt: '2025-01-12' },
  { id: 'CUST-002', name: 'Bondel Hardware Mart', phone: '9845011202', segment: 'Hardware Dealer', zone: 'Kavoor & Bondel', status: 'Old', createdAt: '2025-01-18' },
  { id: 'CUST-003', name: 'Kudla Civil Contractors', phone: '9845011203', segment: 'Contractor', zone: 'Bejai & City Center', status: 'Old', createdAt: '2025-02-04' },
  { id: 'CUST-004', name: 'Shree Ganesh Plumbing', phone: '9845011204', segment: 'Contractor', zone: 'Kavoor & Bondel', status: 'Old', createdAt: '2025-02-15' },
  { id: 'CUST-005', name: 'Panambur Port Infra', phone: '9845011205', segment: 'Contractor', zone: 'Surathkal & Panambur', status: 'Old', createdAt: '2025-03-02' },
  { id: 'CUST-006', name: 'Bejai Electricals & Lights', phone: '9845011206', segment: 'Hardware Dealer', zone: 'Bejai & City Center', status: 'Old', createdAt: '2025-03-19' },
  { id: 'CUST-007', name: 'Moodbidri Steel Traders', phone: '9845011207', segment: 'Hardware Dealer', zone: 'Bajpe & Moodbidri', status: 'Old', createdAt: '2025-04-06' },
  { id: 'CUST-008', name: 'Ullal Coastal Builders', phone: '9845011208', segment: 'Contractor', zone: 'Ullal & BC Road', status: 'Old', createdAt: '2025-04-22' },
  { id: 'CUST-009', name: 'Derebail Housing Works', phone: '9845011209', segment: 'Contractor', zone: 'Kavoor & Bondel', status: 'Old', createdAt: '2025-05-11' },
  { id: 'CUST-010', name: 'Kadri Paint & Decor', phone: '9845011210', segment: 'Hardware Dealer', zone: 'Bejai & City Center', status: 'Old', createdAt: '2025-06-03' },
  { id: 'CUST-011', name: 'Surathkal Engineering Co', phone: '9845011211', segment: 'Contractor', zone: 'Surathkal & Panambur', status: 'Old', createdAt: '2025-07-08' },
  { id: 'CUST-012', name: 'Bajpe Airport Road Constructions', phone: '9845011212', segment: 'Contractor', zone: 'Bajpe & Moodbidri', status: 'Old', createdAt: '2025-08-14' },
  { id: 'CUST-013', name: 'Thokkottu Sanitary Hub', phone: '9845011213', segment: 'Hardware Dealer', zone: 'Ullal & BC Road', status: 'Old', createdAt: '2025-09-09' },
  { id: 'CUST-014', name: 'Kunjathbail Fabrication', phone: '9845011214', segment: 'Contractor', zone: 'Kavoor & Bondel', status: 'Old', createdAt: '2025-10-01' },
  { id: 'CUST-015', name: 'Hampankatta Mill Stores', phone: '9845011215', segment: 'Hardware Dealer', zone: 'Bejai & City Center', status: 'Old', createdAt: '2025-11-05' },
  { id: 'CUST-016', name: 'Baikampady Industrial Spares', phone: '9845011216', segment: 'Hardware Dealer', zone: 'Surathkal & Panambur', status: 'Old', createdAt: '2025-12-03' },
  { id: 'CUST-017', name: 'Prakash Shetty', phone: '9900123401', segment: 'Walk-In Retail', zone: 'Kavoor & Bondel', status: 'New', createdAt: '2026-03-14' },
  { id: 'CUST-018', name: 'Dinesh Alva', phone: '9900123402', segment: 'Contractor', zone: 'Bejai & City Center', status: 'New', createdAt: '2026-04-18' },
  { id: 'CUST-019', name: 'Nirmala Constructions', phone: '9900123403', segment: 'Contractor', zone: 'Surathkal & Panambur', status: 'New', createdAt: '2026-05-22' },
  { id: 'CUST-020', name: 'Bantwal Tile & Pipe Depot', phone: '9900123404', segment: 'Hardware Dealer', zone: 'Ullal & BC Road', status: 'New', createdAt: '2026-06-11' },
  { id: 'CUST-021', name: 'Rohan Kamath', phone: '9900123405', segment: 'Walk-In Retail', zone: 'Kavoor & Bondel', status: 'New', createdAt: '2026-07-04' },
  { id: 'CUST-022', name: 'Suresh Rai', phone: '9900123406', segment: 'Walk-In Retail', zone: 'Bajpe & Moodbidri', status: 'New', createdAt: '2026-07-25' },
  { id: 'CUST-023', name: 'Ananya Interiors', phone: '9900123407', segment: 'Contractor', zone: 'Bejai & City Center', status: 'New', createdAt: '2026-08-03' },
  { id: 'CUST-024', name: 'Kaikamba Site Works', phone: '9900123408', segment: 'Contractor', zone: 'Bajpe & Moodbidri', status: 'New', createdAt: '2026-08-12' },
];

const SAMPLE_MONTHS = [
  '2025-09',
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends { weight: number }>(items: T[], r: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let target = r * total;
  for (const item of items) {
    target -= item.weight;
    if (target <= 0) return item;
  }
  return items[items.length - 1];
}

function generateHardwareSample(count = 240): HardwareSampleOrder[] {
  const rand = createRng(2026575015);
  const rows: HardwareSampleOrder[] = [];
  const oldCustomers = INITIAL_CUSTOMERS.filter((c) => c.status === 'Old');
  const newCustomers = INITIAL_CUSTOMERS.filter((c) => c.status === 'New');

  for (let i = 0; i < count; i++) {
    const cat = pickWeighted(HARDWARE_CATEGORIES, rand());
    const reg = pickWeighted(ZONE_WEIGHTS, rand());

    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const skewFactor = Math.exp(z * 0.42);

    const bulkBoost = rand() > 0.9 ? 1.9 + rand() * 1.3 : 1;
    const rawPrice = Math.max(
      260,
      (cat.basePrice * skewFactor + (rand() - 0.5) * cat.spread * 0.35) * bulkBoost
    );
    const itemPrice = Math.round(rawPrice);
    const freightValue = Math.round(Math.max(40, itemPrice * reg.freightMult * (0.8 + rand() * 0.45)));
    const orderValue = itemPrice + freightValue;

    // ~72% orders from Old/repeat customers, ~28% from New customers
    const isOld = rand() < 0.72;
    const pool = isOld ? oldCustomers : newCustomers;
    const sameZonePool = pool.filter((c) => c.zone === reg.region);
    const chosenPool = sameZonePool.length > 0 ? sameZonePool : pool;
    const customer = chosenPool[Math.floor(rand() * chosenPool.length)];

    const payRoll = rand();
    let paymentMethod = 'net_30_credit';
    if (customer.segment === 'Walk-In Retail') {
      paymentMethod = payRoll > 0.35 ? 'upi' : 'corporate_card';
    } else if (payRoll > 0.82) {
      paymentMethod = 'corporate_card';
    } else if (payRoll > 0.54) {
      paymentMethod = 'neft_rtgs';
    } else if (payRoll > 0.42) {
      paymentMethod = 'upi';
    }

    const creditDays = paymentMethod === 'net_30_credit' ? (orderValue > 4500 ? 45 : 30) : 0;
    const monthPrefix = SAMPLE_MONTHS[Math.floor(rand() * SAMPLE_MONTHS.length)];
    const day = String(1 + Math.floor(rand() * 27)).padStart(2, '0');
    const itemName = cat.sampleItems[Math.floor(rand() * cat.sampleItems.length)];

    rows.push({
      orderId: `TH-KVR-${String(26001 + i)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerStatus: customer.status,
      itemName,
      category: cat.name,
      customerSegment: customer.segment,
      paymentMethod,
      creditDays,
      region: reg.region,
      itemPrice,
      freightValue,
      orderValue,
      orderDate: `${monthPrefix}-${day}`,
    });
  }

  // Sort most recent first so newly added items appear at the top cleanly
  return rows.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
}

export const INITIAL_ORDERS: HardwareSampleOrder[] = generateHardwareSample(240);
