
import { Card, CardContent } from '@/components/ui/card';
import { StockMetrics } from '@/types';
import { TrendingUp, TrendingDown, BarChart } from 'lucide-react';

interface MetricsPanelProps {
  metrics: StockMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card className="bg-accent">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Current Price</span>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold">{formatPrice(metrics.currentPrice)}</span>
              <div className={`flex items-center text-xs sm:text-sm ${metrics.dailyChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.dailyChangePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatPercent(metrics.dailyChangePercent)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Daily Change</span>
            <div className={`flex items-center text-lg sm:text-2xl font-bold ${metrics.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPrice(metrics.dailyChange)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Volume (Avg)</span>
            <div className="flex items-center text-lg sm:text-2xl font-bold">
              {formatLargeNumber(metrics.averageVolume)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Volatility</span>
            <div className="flex items-center gap-1 text-lg sm:text-2xl font-bold">
              {metrics.volatility.toFixed(2)}%
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent col-span-2 sm:col-span-1">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">RSI</span>
            <div className={`flex flex-col sm:flex-row sm:items-center gap-1 text-lg sm:text-2xl font-bold ${
              metrics.rsi > 70 ? 'text-red-500' : (metrics.rsi < 30 ? 'text-green-500' : '')
            }`}>
              <span>{metrics.rsi.toFixed(1)}</span>
              {metrics.rsi > 70 && <span className="text-xs text-red-500">(Overbought)</span>}
              {metrics.rsi < 30 && <span className="text-xs text-green-500">(Oversold)</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
