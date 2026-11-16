import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { MANGALORE_ZONES } from '../data/hardwareSampleData';
import { formatInrExact } from '../data/projectData';
import { HardwareSampleOrder, StoreCustomer } from '../types/analytics';
import { AddOrderPrefill } from './AddOrderModal';

interface DataProfilingSectionProps {
  orders: HardwareSampleOrder[];
  customers: StoreCustomer[];
  uploadedFileName: string | null;
  isModifiedFromSample: boolean;
  onUploadCsvOrders: (orders: HardwareSampleOrder[], fileName: string) => void;
  onResetSampleData: () => void;
  onOpenAddModal: (prefill?: AddOrderPrefill) => void;
  onDeleteOrder: (orderId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  onNotify: (msg: string) => void;
  isDark: boolean;
}

interface CategorySummary {
  category: string;
  orders: number;
  revenue: number;
  sharePct: number;
}

const REGION_ACTIVE_STYLES: Record<string, string> = {
  All: 'bg-gray-900 dark:bg-blue-600 text-white',
  'Kavoor & Bondel': 'bg-blue-600 text-white',
  'Bejai & City Center': 'bg-emerald-600 text-white',
  'Surathkal & Panambur': 'bg-purple-600 text-white',
  'Bajpe & Moodbidri': 'bg-orange-500 text-white',
  'Ullal & BC Road': 'bg-rose-600 text-white',
};

const REGION_TEXT_COLORS: Record<string, string> = {
  'Kavoor & Bondel': 'text-blue-700 dark:text-blue-400 font-semibold',
  'Bejai & City Center': 'text-emerald-700 dark:text-emerald-400 font-semibold',
  'Surathkal & Panambur': 'text-purple-700 dark:text-purple-400 font-semibold',
  'Bajpe & Moodbidri': 'text-orange-700 dark:text-orange-400 font-semibold',
  'Ullal & BC Road': 'text-rose-700 dark:text-rose-400 font-semibold',
};

const CATEGORY_COLORS = [
  '#2563EB',
  '#16A34A',
  '#9333EA',
  '#EA580C',
  '#0284C7',
  '#059669',
  '#E11D48',
  '#4F46E5',
  '#0891B2',
  '#CA8A04',
];

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseNumericCell(raw: string | undefined): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[₹,\s]/g, '');
  const val = Number(cleaned);
  return Number.isFinite(val) ? val : NaN;
}

function parseBillingCsv(text: string): { orders: HardwareSampleOrder[]; error?: string } {
  const rawLines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length < 2) {
    return {
      orders: [],
      error: 'CSV file must contain a header row and at least 1 sales row.',
    };
  }

  const headers = splitCsvLine(rawLines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  );

  const findCol = (...candidates: string[]) =>
    headers.findIndex((h) => candidates.includes(h));

  const idxOrderId = findCol('order_id', 'invoice_id', 'bill_no', 'id');
  const idxCustomer = findCol('customer_name', 'customer', 'client', 'party_name');
  const idxPhone = findCol('phone', 'customer_phone', 'mobile');
  const idxStatus = findCol('customer_status', 'status', 'buyer_status');
  const idxItem = findCol('item_name', 'item', 'product', 'description');
  const idxCategory = findCol('category', 'product_line', 'product_category', 'item_category');
  const idxBuyer = findCol('customer_type', 'customer_segment', 'buyer_type', 'buyer');
  const idxZone = findCol('zone', 'sales_zone', 'region', 'delivery_zone');
  const idxPayment = findCol('payment_method', 'payment_terms', 'payment', 'terms');
  const idxItemPrice = findCol('item_price', 'item_amount_inr', 'price', 'amount');
  const idxFreight = findCol('freight_value', 'freight_amount_inr', 'freight', 'delivery_charge');
  const idxDate = findCol('order_date', 'date', 'bill_date');

  if (idxCategory === -1 || idxItemPrice === -1) {
    return {
      orders: [],
      error: 'Could not find category and price columns in the selected CSV file.',
    };
  }

  const seenCustomers = new Set<string>();
  const parsed: HardwareSampleOrder[] = [];

  for (let r = 1; r < rawLines.length; r++) {
    const cells = splitCsvLine(rawLines[r]);
    if (cells.length === 1 && cells[0] === '') continue;

    const itemPrice = parseNumericCell(cells[idxItemPrice]);
    if (Number.isNaN(itemPrice) || itemPrice < 0) continue;

    const freightRaw = idxFreight >= 0 ? parseNumericCell(cells[idxFreight]) : 0;
    const freightValue = Number.isNaN(freightRaw) || freightRaw < 0 ? 0 : Math.round(freightRaw);
    const roundedItem = Math.round(itemPrice);

    const paymentRaw = (idxPayment >= 0 ? cells[idxPayment] : 'upi') || 'upi';
    const paymentNorm = paymentRaw.toLowerCase().trim();
    const creditDays =
      paymentNorm.includes('45') ? 45 : paymentNorm.includes('30') || paymentNorm.includes('credit') ? 30 : 0;

    const customerName =
      (idxCustomer >= 0 ? cells[idxCustomer] : '') || `Mangalore Buyer #${r}`;
    const rawStatus = idxStatus >= 0 ? cells[idxStatus]?.toLowerCase() : '';
    const isOld =
      rawStatus === 'old' || rawStatus === 'existing' || seenCustomers.has(customerName.toLowerCase());
    seenCustomers.add(customerName.toLowerCase());

    const category = cells[idxCategory] || 'General Hardware';

    parsed.push({
      orderId:
        (idxOrderId >= 0 ? cells[idxOrderId] : '') || `CSV-${String(r).padStart(4, '0')}`,
      customerId: `CSV-CUST-${customerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      customerName,
      customerPhone: (idxPhone >= 0 ? cells[idxPhone] : '') || '9845000000',
      customerStatus: isOld ? 'Old' : 'New',
      itemName: (idxItem >= 0 ? cells[idxItem] : '') || `${category} Supply`,
      category,
      customerSegment: (idxBuyer >= 0 ? cells[idxBuyer] : '') || 'Contractor',
      region: (idxZone >= 0 ? cells[idxZone] : '') || 'Kavoor & Bondel',
      paymentMethod: paymentRaw,
      creditDays,
      itemPrice: roundedItem,
      freightValue,
      orderValue: roundedItem + freightValue,
      orderDate: (idxDate >= 0 && cells[idxDate]) || '2026-08-15',
    });
  }

  if (parsed.length === 0) {
    return {
      orders: [],
      error: 'No valid sales rows found in the uploaded CSV.',
    };
  }

  return { orders: parsed };
}

export const DataProfilingSection: React.FC<DataProfilingSectionProps> = ({
  orders,
  customers,
  uploadedFileName,
  isModifiedFromSample,
  onUploadCsvOrders,
  onResetSampleData,
  onOpenAddModal,
  onDeleteOrder,
  onDeleteCustomer,
  onNotify,
  isDark,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [segmentFilter, setSegmentFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'All' | 'Old' | 'New'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rangeMode, setRangeMode] = useState<'core' | 'full'>('full');
  const [binCount, setBinCount] = useState<number>(12);
  const [categoryMetric, setCategoryMetric] = useState<'orders' | 'revenue'>('orders');
  const [showMedianMarker, setShowMedianMarker] = useState(true);
  const [showMeanMarker, setShowMeanMarker] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [activeTableTab, setActiveTableTab] = useState<'orders' | 'customers'>('orders');

  const [hoveredBin, setHoveredBin] = useState<{
    x0: number;
    x1: number;
    count: number;
    pct: number;
    leftPct: number;
    topPct: number;
  } | null>(null);

  const [hoveredCat, setHoveredCat] = useState<CategorySummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const histogramSvgRef = useRef<SVGSVGElement | null>(null);
  const categorySvgRef = useRef<SVGSVGElement | null>(null);

  const zoneOptions = useMemo(() => {
    const unique = Array.from(new Set(orders.map((o) => o.region))).filter(Boolean);
    const merged = Array.from(new Set([...MANGALORE_ZONES, ...unique]));
    return ['All', ...merged];
  }, [orders]);

  const buyerTypeOptions = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.customerSegment))).filter(Boolean);
  }, [orders]);

  const paymentOptions = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.paymentMethod))).filter(Boolean);
  }, [orders]);

  const formatPaymentLabel = (method: string, creditDays?: number) => {
    if (method === 'net_30_credit') return creditDays ? `Net-${creditDays} Credit` : 'Net-30 Credit';
    if (method === 'neft_rtgs') return 'NEFT / RTGS';
    if (method === 'corporate_card') return 'Corporate Card';
    if (method === 'upi') return 'UPI Instant';
    return method;
  };

  const baseFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchRegion = regionFilter === 'All' || o.region === regionFilter;
      const matchSegment = segmentFilter === 'All' || o.customerSegment === segmentFilter;
      const matchPayment = paymentFilter === 'All' || o.paymentMethod === paymentFilter;
      const matchStatus = customerTypeFilter === 'All' || o.customerStatus === customerTypeFilter;
      return matchRegion && matchSegment && matchPayment && matchStatus;
    });
  }, [orders, regionFilter, segmentFilter, paymentFilter, customerTypeFilter]);

  const activeOrders = useMemo(() => {
    if (!selectedCategory) return baseFilteredOrders;
    return baseFilteredOrders.filter((o) => o.category === selectedCategory);
  }, [baseFilteredOrders, selectedCategory]);

  const summaryStats = useMemo(() => {
    if (activeOrders.length === 0) {
      return {
        count: 0,
        totalRevenue: 0,
        median: 0,
        mean: 0,
        p25: 0,
        p75: 0,
        p90: 0,
        max: 0,
        excludedOutliers: 0,
      };
    }
    const values = activeOrders.map((o) => o.orderValue).sort(d3.ascending);
    const totalRevenue = d3.sum(values);
    const median = d3.quantile(values, 0.5) ?? 0;
    const mean = d3.mean(values) ?? 0;
    const p25 = d3.quantile(values, 0.25) ?? 0;
    const p75 = d3.quantile(values, 0.75) ?? 0;
    const p90 = d3.quantile(values, 0.9) ?? 0;
    const max = d3.max(values) ?? 0;
    const excludedOutliers = values.filter((v) => v > 5000).length;
    return {
      count: values.length,
      totalRevenue,
      median,
      mean,
      p25,
      p75,
      p90,
      max,
      excludedOutliers,
    };
  }, [activeOrders]);

  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const totalOrders = baseFilteredOrders.length || 1;
    const grouped = d3.rollup(
      baseFilteredOrders,
      (rows) => ({
        orders: rows.length,
        revenue: d3.sum(rows, (r) => r.orderValue),
      }),
      (r) => r.category
    );

    const list: CategorySummary[] = Array.from(grouped, ([category, stats]) => ({
      category,
      orders: stats.orders,
      revenue: Math.round(stats.revenue),
      sharePct: (stats.orders / totalOrders) * 100,
    }));

    return list.sort((a, b) =>
      categoryMetric === 'orders' ? b.orders - a.orders : b.revenue - a.revenue
    );
  }, [baseFilteredOrders, categoryMetric]);

  // D3 Chart 1: Theme-Aware Histogram
  useEffect(() => {
    const svgEl = histogramSvgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = 640;
    const height = 310;
    const margin = { top: 34, right: 20, bottom: 40, left: 46 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const gridColor = isDark ? '#334155' : '#E5E7EB';
    const axisStroke = isDark ? '#475569' : '#D1D5DB';
    const textMuted = isDark ? '#CBD5E1' : '#4B5563';

    if (activeOrders.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', textMuted)
        .attr('font-size', '13px')
        .text('No matching orders.');
      return;
    }

    const rawValues = activeOrders.map((o) => o.orderValue);
    const maxRaw = d3.max(rawValues) ?? 5000;
    const effectiveRangeMode =
      rangeMode === 'core' && rawValues.every((v) => v > 5000) ? 'full' : rangeMode;
    const domainMax =
      effectiveRangeMode === 'core'
        ? 5000
        : Math.max(1000, Math.ceil(maxRaw / 500) * 500);
    const displayValues =
      effectiveRangeMode === 'core' ? rawValues.filter((v) => v <= 5000) : rawValues;

    const x = d3.scaleLinear().domain([0, domainMax]).range([0, innerW]).nice();

    const binner = d3
      .bin<number, number>()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(binCount));

    const bins = binner(displayValues);
    const yMax = d3.max(bins, (b) => b.length) ?? 1;

    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, yMax * 0.5, yMax])
      .range(['#60A5FA', '#2563EB', '#16A34A']);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => '')
      )
      .call((gridG) => gridG.select('.domain').remove())
      .call((gridG) =>
        gridG.selectAll('line').attr('stroke', gridColor).attr('stroke-dasharray', '3 3')
      );

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => `₹${Number(d).toLocaleString('en-IN')}`)
      )
      .call((ax) => ax.select('.domain').attr('stroke', axisStroke))
      .call((ax) => ax.selectAll('line').attr('stroke', axisStroke))
      .call((ax) =>
        ax
          .selectAll('text')
          .attr('fill', textMuted)
          .attr('font-size', '10.5px')
          .attr('font-family', 'JetBrains Mono, monospace')
      );

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((ax) => ax.select('.domain').remove())
      .call((ax) => ax.selectAll('line').remove())
      .call((ax) =>
        ax
          .selectAll('text')
          .attr('fill', textMuted)
          .attr('font-size', '11px')
          .attr('font-family', 'JetBrains Mono, monospace')
      );

    const totalDisplayed = displayValues.length || 1;
    g.selectAll('rect.hist-bar')
      .data(bins)
      .join('rect')
      .attr('class', 'hist-bar')
      .attr('x', (d) => x(d.x0 ?? 0) + 2)
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(2, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 4))
      .attr('height', (d) => Math.max(0, innerH - y(d.length)))
      .attr('rx', 2)
      .attr('fill', (d) => colorScale(d.length))
      .attr('fill-opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('fill', '#F59E0B').attr('fill-opacity', 1);
        const barCenterX = (x(d.x0 ?? 0) + x(d.x1 ?? 0)) / 2 + margin.left;
        const barTopY = y(d.length) + margin.top;
        setHoveredBin({
          x0: Math.round(d.x0 ?? 0),
          x1: Math.round(d.x1 ?? 0),
          count: d.length,
          pct: (d.length / totalDisplayed) * 100,
          leftPct: Math.min(82, Math.max(18, (barCenterX / width) * 100)),
          topPct: Math.max(12, (barTopY / height) * 100 - 12),
        });
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this).attr('fill', colorScale(d.length)).attr('fill-opacity', 0.9);
        setHoveredBin(null);
      });

    const drawMarker = (val: number, label: string, color: string, yOffset: number) => {
      if (val <= 0 || val > x.domain()[1]) return;
      const xPos = x(val);
      g.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', -6)
        .attr('y2', innerH)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3')
        .style('pointer-events', 'none');

      const anchor = xPos > innerW * 0.72 ? 'end' : 'start';
      const dx = anchor === 'end' ? -5 : 5;
      g.append('text')
        .attr('x', xPos + dx)
        .attr('y', yOffset)
        .attr('text-anchor', anchor)
        .attr('fill', color)
        .attr('font-size', '10.5px')
        .attr('font-weight', '600')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(`${label}: ₹${Math.round(val).toLocaleString('en-IN')}`);
    };

    if (showMedianMarker) {
      drawMarker(summaryStats.median, 'Typical', isDark ? '#34D399' : '#059669', -10);
    }
    if (showMeanMarker) {
      const meanLabelY =
        showMedianMarker && Math.abs(x(summaryStats.mean) - x(summaryStats.median)) < 95
          ? -24
          : -10;
      drawMarker(summaryStats.mean, 'Average', isDark ? '#FBBF24' : '#D97706', meanLabelY);
    }
  }, [
    activeOrders,
    rangeMode,
    binCount,
    summaryStats.median,
    summaryStats.mean,
    showMedianMarker,
    showMeanMarker,
    isDark,
  ]);

  // D3 Chart 2: Theme-Aware Product Line Horizontal Bar Chart
  useEffect(() => {
    const svgEl = categorySvgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = 460;
    const height = 310;
    const margin = { top: 10, right: 82, bottom: 28, left: 156 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const gridColor = isDark ? '#334155' : '#E5E7EB';
    const axisStroke = isDark ? '#475569' : '#D1D5DB';
    const textPrimary = isDark ? '#F1F5F9' : '#111827';
    const textMuted = isDark ? '#94A3B8' : '#6B7280';

    if (categorySummaries.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', textMuted)
        .attr('font-size', '13px')
        .text('No matching product categories.');
      return;
    }

    const visibleCategories = categorySummaries.slice(0, 10);
    const getVal = (d: CategorySummary) => (categoryMetric === 'orders' ? d.orders : d.revenue);
    const maxVal = d3.max(visibleCategories, getVal) ?? 1;

    const y = d3
      .scaleBand<string>()
      .domain(visibleCategories.map((c) => c.category))
      .range([0, innerH])
      .padding(0.28);

    const x = d3.scaleLinear().domain([0, maxVal]).nice().range([0, innerW]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .call(
        d3
          .axisBottom(x)
          .ticks(4)
          .tickSize(innerH)
          .tickFormat(() => '')
      )
      .call((gridG) => gridG.select('.domain').remove())
      .call((gridG) =>
        gridG.selectAll('line').attr('stroke', gridColor).attr('stroke-dasharray', '3 3')
      );

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(4)
          .tickFormat((d) =>
            categoryMetric === 'orders' ? `${d}` : `₹${Math.round(Number(d) / 1000)}K`
          )
      )
      .call((ax) => ax.select('.domain').attr('stroke', axisStroke))
      .call((ax) => ax.selectAll('line').attr('stroke', axisStroke))
      .call((ax) =>
        ax
          .selectAll('text')
          .attr('fill', textMuted)
          .attr('font-size', '10px')
          .attr('font-family', 'JetBrains Mono, monospace')
      );

    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .call((ax) => ax.select('.domain').remove())
      .call((ax) =>
        ax
          .selectAll('text')
          .attr('fill', (name) =>
            selectedCategory && selectedCategory !== name ? textMuted : textPrimary
          )
          .attr('font-size', '10.5px')
          .attr('font-weight', (name) => (selectedCategory === name ? '700' : '500'))
          .attr('dx', '-6')
      );

    g.selectAll('rect.cat-bar')
      .data(visibleCategories)
      .join('rect')
      .attr('class', 'cat-bar')
      .attr('x', 0)
      .attr('y', (d) => y(d.category) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => Math.max(2, x(getVal(d))))
      .attr('rx', 2)
      .attr('fill', (d, idx) => {
        if (selectedCategory && d.category !== selectedCategory) {
          return isDark ? '#334155' : '#D1D5DB';
        }
        return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
      })
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedCategory((prev) => (prev === d.category ? null : d.category));
      })
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('opacity', 0.8);
        setHoveredCat(d);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        setHoveredCat(null);
      });

    g.selectAll('text.cat-val')
      .data(visibleCategories)
      .join('text')
      .attr('class', 'cat-val')
      .attr('x', (d) => x(getVal(d)) + 6)
      .attr('y', (d) => (y(d.category) ?? 0) + y.bandwidth() / 2 + 3.5)
      .attr('fill', (d) =>
        selectedCategory && selectedCategory !== d.category ? textMuted : textPrimary
      )
      .attr('font-size', '10.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .text((d) =>
        categoryMetric === 'orders'
          ? `${d.orders} (${d.sharePct.toFixed(0)}%)`
          : `₹${(d.revenue / 1000).toFixed(0)}K`
      );
  }, [categorySummaries, categoryMetric, selectedCategory, isDark]);

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const result = parseBillingCsv(content);
      if (result.error) {
        setUploadError(result.error);
        onNotify('CSV upload could not be parsed');
        return;
      }

      setUploadError(null);
      onUploadCsvOrders(result.orders, file.name);
      resetAllFilters();
      setRangeMode('full');
    } catch {
      setUploadError('Unable to read the selected CSV file.');
    }
  };

  const handleExportCsv = () => {
    const header =
      'order_id,customer_name,customer_status,item_name,category,customer_type,zone,payment_method,item_price,freight_value,order_value,order_date';
    const csvRows = activeOrders.map(
      (o: HardwareSampleOrder) =>
        `"${o.orderId.replace(/"/g, '""')}","${o.customerName.replace(/"/g, '""')}","${o.customerStatus}","${o.itemName.replace(/"/g, '""')}","${o.category.replace(/"/g, '""')}","${o.customerSegment.replace(/"/g, '""')}","${o.region.replace(/"/g, '""')}","${o.paymentMethod.replace(/"/g, '""')}",${o.itemPrice},${o.freightValue},${o.orderValue},"${o.orderDate}"`
    );
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = uploadedFileName ? `filtered_${uploadedFileName}` : 'tanmayee_hardware_orders.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify(`Exported ${activeOrders.length} orders`);
  };

  const resetAllFilters = () => {
    setRegionFilter('All');
    setSegmentFilter('All');
    setPaymentFilter('All');
    setCustomerTypeFilter('All');
    setSelectedCategory(null);
    setTableSearch('');
  };

  const hasActiveFilters =
    regionFilter !== 'All' ||
    segmentFilter !== 'All' ||
    paymentFilter !== 'All' ||
    customerTypeFilter !== 'All' ||
    selectedCategory !== null ||
    tableSearch.trim() !== '';

  const searchedTableOrders = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return activeOrders;
    return activeOrders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.itemName.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.customerSegment.toLowerCase().includes(q) ||
        o.region.toLowerCase().includes(q)
    );
  }, [activeOrders, tableSearch]);

  const customerSummaries = useMemo(() => {
    const orderStats = new Map<string, { count: number; spend: number }>();
    for (const o of orders) {
      const prev = orderStats.get(o.customerId) ?? { count: 0, spend: 0 };
      orderStats.set(o.customerId, {
        count: prev.count + 1,
        spend: prev.spend + o.orderValue,
      });
    }
    const q = tableSearch.trim().toLowerCase();
    return customers
      .filter((c) => {
        const matchZone = regionFilter === 'All' || c.zone === regionFilter;
        const matchSeg = segmentFilter === 'All' || c.segment === segmentFilter;
        const matchStatus = customerTypeFilter === 'All' || c.status === customerTypeFilter;
        const matchQuery =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.zone.toLowerCase().includes(q);
        return matchZone && matchSeg && matchStatus && matchQuery;
      })
      .map((c) => {
        const st = orderStats.get(c.id) ?? { count: 0, spend: 0 };
        return { ...c, orderCount: st.count, totalSpend: st.spend };
      });
  }, [customers, orders, regionFilter, segmentFilter, customerTypeFilter, tableSearch]);

  const displayedTableRows = showAllRows
    ? searchedTableOrders.slice(0, 25)
    : searchedTableOrders.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Data Explorer</h1>
            <div className="text-xs text-gray-600 dark:text-slate-400">
              {uploadedFileName
                ? `Uploaded billing CSV: ${uploadedFileName} (${orders.length} orders)`
                : `Manage New & Old customer orders (${orders.length} total bills · ${customers.length} customers)`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item (New / Old)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              className="hidden"
              aria-label="Upload Sales CSV file"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Sales CSV</span>
            </button>

            {isModifiedFromSample && (
              <button
                type="button"
                onClick={onResetSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sample Data</span>
              </button>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadedFileName && !uploadError && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Showing <strong>{orders.length}</strong> orders from{' '}
              <strong>{uploadedFileName}</strong>.
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 self-start">
            {zoneOptions.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setRegionFilter(reg)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  regionFilter === reg
                    ? REGION_ACTIVE_STYLES[reg] ?? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {reg === 'All' ? 'All Mangalore Zones' : reg}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <select
              aria-label="Customer Status"
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value as 'All' | 'Old' | 'New')}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="All">All Customers (New &amp; Old)</option>
              <option value="Old">Old Customers Only</option>
              <option value="New">New Customers Only</option>
            </select>

            <select
              aria-label="Customer Type"
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="All">All Buyer Segments</option>
              {buyerTypeOptions.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>

            <select
              aria-label="Payment Terms"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="All">All Payments</option>
              {paymentOptions.map((pm) => (
                <option key={pm} value={pm}>
                  {formatPaymentLabel(pm)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Colored Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold">Orders Found</div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {summaryStats.count}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
              {selectedCategory || `Total: ${formatInrExact(summaryStats.totalRevenue)}`}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold">
            Typical Bill
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatInrExact(summaryStats.median)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
              Middle 50%: {formatInrExact(summaryStats.p25)}–{formatInrExact(summaryStats.p75)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold">
            Average Bill
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatInrExact(summaryStats.mean)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">Including bulk orders</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold">
            Top 10% Orders
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatInrExact(summaryStats.p90)}+
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
              Max: {formatInrExact(summaryStats.max)}
            </div>
          </div>
        </div>
      </div>

      {/* Main D3 Visualization Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Order Value Chart
            </h2>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRangeMode('core')}
                  className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                    rangeMode === 'core'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  ≤ ₹5,000
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('full')}
                  className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                    rangeMode === 'full'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  All Orders
                </button>
              </div>

              <select
                aria-label="Bar detail level"
                value={binCount}
                onChange={(e) => setBinCount(Number(e.target.value))}
                className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-700 dark:text-slate-200 cursor-pointer"
              >
                <option value={8}>8 Bins</option>
                <option value={12}>12 Bins</option>
                <option value={18}>18 Bins</option>
              </select>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              ref={histogramSvgRef}
              viewBox="0 0 640 310"
              className="w-full min-w-[460px] h-auto select-none"
              role="img"
              aria-label="D3 histogram of Tanmayee Hardware order values"
            />
            {hoveredBin && (
              <div
                className="pointer-events-none hidden sm:block absolute -translate-x-1/2 bg-gray-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded text-[11px] font-mono shadow-md border border-gray-700 whitespace-nowrap tabular-nums"
                style={{ left: `${hoveredBin.leftPct}%`, top: `${hoveredBin.topPct}%` }}
              >
                ₹{hoveredBin.x0.toLocaleString('en-IN')}–₹{hoveredBin.x1.toLocaleString('en-IN')}:{' '}
                <strong>{hoveredBin.count}</strong> ({hoveredBin.pct.toFixed(1)}%)
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMedianMarker((v) => !v)}
                className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                  showMedianMarker
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700'
                }`}
              >
                Typical Line
              </button>
              <button
                type="button"
                onClick={() => setShowMeanMarker((v) => !v)}
                className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                  showMeanMarker
                    ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700'
                }`}
              >
                Average Line
              </button>
            </div>
            {rangeMode === 'core' && summaryStats.excludedOutliers > 0 && (
              <button
                type="button"
                onClick={() => setRangeMode('full')}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                +{summaryStats.excludedOutliers} bulk orders
              </button>
            )}
          </div>
        </div>

        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Hardware Categories
              </h2>
              <div className="text-xs text-gray-500 dark:text-slate-400 h-4 truncate">
                {hoveredCat
                  ? `${hoveredCat.category}: ${hoveredCat.orders} orders`
                  : 'Click a bar to filter'}
              </div>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 shrink-0 self-start">
              <button
                type="button"
                onClick={() => setCategoryMetric('orders')}
                className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                  categoryMetric === 'orders'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-slate-300'
                }`}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => setCategoryMetric('revenue')}
                className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                  categoryMetric === 'revenue'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-slate-300'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              ref={categorySvgRef}
              viewBox="0 0 460 310"
              className="w-full min-w-[360px] h-auto select-none"
              role="img"
              aria-label="D3 horizontal bar chart of Tanmayee Hardware categories"
            />
          </div>

          <div className="pt-2.5 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400 min-h-[28px]">
            <span>
              {selectedCategory
                ? `Selected: ${selectedCategory}`
                : `All ${categorySummaries.length} categories`}
            </span>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders & Customers Directory with Add/Delete */}
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
        <div className="px-5 py-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTableTab('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                activeTableTab === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600'
              }`}
            >
              Orders &amp; Items ({searchedTableOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('customers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                activeTableTab === 'customers'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>New &amp; Old Customers ({customerSummaries.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search customer, item, zone..."
                aria-label="Search orders or customers"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-slate-100 placeholder:text-gray-400"
              />
            </div>
            {activeTableTab === 'orders' && searchedTableOrders.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllRows((prev) => !prev)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded cursor-pointer"
              >
                {showAllRows ? 'Top 10' : 'Top 25'}
              </button>
            )}
          </div>
        </div>

        {activeTableTab === 'orders' ? (
          displayedTableRows.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-600 dark:text-slate-400 space-y-2">
              <div>No matching orders.</div>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 font-semibold">
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Item &amp; Category</th>
                    <th className="py-2.5 px-4">Mangalore Zone</th>
                    <th className="py-2.5 px-4">Payment</th>
                    <th className="py-2.5 px-4 text-right">Material</th>
                    <th className="py-2.5 px-4 text-right">Freight</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 tabular-nums">
                  {displayedTableRows.map((row) => (
                    <tr
                      key={row.orderId}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-2.5 px-4 font-mono text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        <div>{row.orderId}</div>
                        <div className="text-[10px]">{row.orderDate}</div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {row.customerName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400">
                          {row.customerSegment}
                        </div>
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
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.itemName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400">
                          {row.category}
                        </div>
                      </td>
                      <td
                        className={`py-2.5 px-4 whitespace-nowrap ${
                          REGION_TEXT_COLORS[row.region] ?? 'text-blue-700 dark:text-blue-400 font-semibold'
                        }`}
                      >
                        {row.region}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {formatPaymentLabel(row.paymentMethod, row.creditDays)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-700 dark:text-slate-200">
                        {formatInrExact(row.itemPrice)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-500 dark:text-slate-400">
                        {formatInrExact(row.freightValue)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
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
          )
        ) : customerSummaries.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-600 dark:text-slate-400">
            No customers match the current search or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Segment</th>
                  <th className="py-2.5 px-4">Mangalore Zone</th>
                  <th className="py-2.5 px-4 text-right">Orders</th>
                  <th className="py-2.5 px-4 text-right">Total Spend</th>
                  <th className="py-2.5 px-4 text-right">Office Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 tabular-nums">
                {customerSummaries.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-600 dark:text-slate-300 whitespace-nowrap">
                      {c.phone}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.status === 'Old'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {c.status} Customer
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                      {c.segment}
                    </td>
                    <td className="py-2.5 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                      {c.zone}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-800 dark:text-slate-200">
                      {c.orderCount}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                      {formatInrExact(c.totalSpend)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => onOpenAddModal({ mode: 'old', customerId: c.id })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomer(c.id)}
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
      </div>
    </div>
  );
};
