import { useState, useEffect, useRef } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import type { UTCTimestamp, MouseEventParams } from 'lightweight-charts';

const CHART_HUE = '#171717';
const CHART_BG = '#ffffff';
const CHART_TEXT = '#374151';
const CHART_GRID = 'rgba(0,0,0,0.06)';
const CHART_BORDER = 'rgba(0,0,0,0.1)';

interface YahooChartResult {
  meta?: { currency?: string; symbol?: string };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: (number | null)[] }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[];
    error?: { code?: string; description?: string };
  };
}

type ChartDataPoint = { time: UTCTimestamp; value: number };

interface StockChartProps {
  symbol: string;
  className?: string;
  height?: number;
  range?: '1mo' | '3mo' | '6mo' | '1y';
}

function formatChartDate(time: UTCTimestamp): string {
  return new Date(time * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(price: number): string {
  return (Math.round(price * 100) / 100).toFixed(2);
}

export function StockChart({ symbol, className = '', height = 380, range = '3mo' }: StockChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pctChange, setPctChange] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);
    setPctChange(null);
    setChartData(null);

    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/api/yahoo-chart?symbol=${encodeURIComponent(symbol)}&interval=1d&range=${encodeURIComponent(range)}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Chart failed: ${r.status}`);
        return r.json();
      })
      .then((json: YahooChartResponse) => {
        if (aborted) return;
        const err = json.chart?.error;
        if (err) {
          setError(err.description || err.code || 'Chart error');
          return;
        }
        const result = json.chart?.result?.[0];
        const timestamps = result?.timestamp ?? [];
        const quote = result?.indicators?.quote?.[0];
        const rawCloses = quote?.close ?? [];
        const closes = rawCloses.map((c) => (c != null ? c : NaN));
        const valid = timestamps
          .map((t, i) => ({ t, c: closes[i] }))
          .filter(({ c }) => Number.isFinite(c));
        if (valid.length === 0) {
          setError('No price data');
          return;
        }
        const firstClose = valid[0].c;
        const lastClose = valid[valid.length - 1].c;
        const pct = firstClose ? (((lastClose - firstClose) / firstClose) * 100) : 0;
        const data = valid.map(({ t, c }) => ({ time: t as UTCTimestamp, value: c }));
        setPctChange(pct);
        setChartData(data);
      })
      .catch((e) => {
        if (!aborted) setError(e?.message || 'Failed to load chart');
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [symbol, range]);

  useEffect(() => {
    if (!chartData || chartData.length === 0 || pctChange == null) return;
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    if (legendRef.current && legendRef.current.parentNode) {
      legendRef.current.remove();
      legendRef.current = null;
    }

    const chartHeight = height - 48;
    container.style.position = 'relative';

    const chart = createChart(container, {
      autoSize: true,
      width: container.offsetWidth || 400,
      height: chartHeight,
      layout: {
        background: { type: 'solid', color: CHART_BG },
        textColor: CHART_TEXT,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: CHART_GRID },
      },
      rightPriceScale: {
        borderColor: CHART_BORDER,
        scaleMargins: { top: 0.4, bottom: 0.15 },
      },
      timeScale: {
        borderColor: CHART_BORDER,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { labelBackgroundColor: CHART_HUE },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
    });
    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(23, 23, 23, 0.2)',
      bottomColor: 'rgba(23, 23, 23, 0.02)',
      lineColor: CHART_HUE,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: true,
      priceLineVisible: true,
    });
    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    const symbolName = symbol;
    const legend = document.createElement('div');
    legend.setAttribute('data-legend', '');
    legend.style.cssText =
      'position: absolute; left: 12px; top: 12px; z-index: 10; font-size: 14px; font-family: inherit; line-height: 1.4; font-weight: 300; color: #374151; pointer-events: none;';
    container.appendChild(legend);
    legendRef.current = legend;

    const setLegendHtml = (name: string, date: string, price: string) => {
      legend.innerHTML = `<div style="font-size: 18px; font-weight: 600; margin-bottom: 4px; color: #111827;">${name}</div><div style="font-size: 20px; font-weight: 600; margin-bottom: 2px; color: ${CHART_HUE};">${price}</div><div style="font-size: 12px; color: #6b7280;">${date}</div>`;
    };

    const updateLegend = (param?: MouseEventParams<UTCTimestamp>) => {
      const valid =
        param != null &&
        param.time != null &&
        param.point != null &&
        param.point.x >= 0 &&
        param.point.y >= 0 &&
        param.seriesData != null;
      let bar: ChartDataPoint | null = null;
      if (valid && param.seriesData) {
        bar = (param.seriesData.get(areaSeries) as ChartDataPoint | undefined) ?? null;
      }
      if (!bar) {
        const all = areaSeries.data();
        bar = all.length > 0 ? (all[all.length - 1] as ChartDataPoint) : null;
      }
      if (bar) {
        const priceStr = formatPrice(bar.value);
        const dateStr = typeof bar.time === 'number' ? formatChartDate(bar.time) : String(bar.time);
        setLegendHtml(symbolName, dateStr, priceStr);
      }
    };

    chart.subscribeCrosshairMove(updateLegend);
    updateLegend(undefined);

    return () => {
      chart.unsubscribeCrosshairMove(updateLegend);
      if (legendRef.current?.parentNode) {
        legendRef.current.remove();
      }
      legendRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [chartData, pctChange, height, symbol]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-muted/30 ${className}`}
        style={{ height }}
      >
        <span className="text-muted-foreground text-sm">Loading chart…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-muted/30 ${className}`}
        style={{ height }}
      >
        <span className="text-destructive text-sm">{error}</span>
      </div>
    );
  }

  const isPositive = pctChange != null && pctChange >= 0;

  return (
    <div className={`rounded-lg overflow-hidden bg-white border border-border/50 ${className}`} style={{ backgroundColor: CHART_BG }}>
      <div className="px-4 pt-3 pb-1 flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-sm">Price ({range})</span>
        {pctChange != null && (
          <span className={`font-medium text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}
            {pctChange.toFixed(2)}%
          </span>
        )}
      </div>
      <div ref={wrapperRef} className="w-full min-w-0 relative">
        <div
          ref={containerRef}
          className="px-2 pb-2 w-full min-w-0"
          style={{ height: height - 48, width: '100%' }}
        />
      </div>
    </div>
  );
}
