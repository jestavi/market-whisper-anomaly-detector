
export interface StockData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface AnomalyData {
  id: string;
  date: string;
  value: number;
  score: number;
  type: 'price' | 'volume';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface StockMetrics {
  symbol: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  averageVolume: number;
  anomalyCount: number;
  volatility: number;
  rsi: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'MAX';
export type ChartType = 'line' | 'candle';

export interface DateRangeValue {
  from: Date;
  to: Date;
}
