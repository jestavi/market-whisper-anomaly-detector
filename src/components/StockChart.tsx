
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StockData, AnomalyData, ChartType } from '@/types';
import { Button } from '@/components/ui/button';
import { LineChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

interface StockChartProps {
  stockData: StockData[];
  anomalies: AnomalyData[];
  onAnomalyClick: (anomaly: AnomalyData) => void;
}

export function StockChart({ stockData, anomalies, onAnomalyClick }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const chartData = stockData.map(item => ({
    date: item.date,
    price: item.close,
    volume: item.volume,
    open: item.open,
    close: item.close,
    high: item.high,
    low: item.low,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  // Find max and min values for y-axis
  const maxPrice = Math.max(...chartData.map(d => d.high)) * 1.02;
  const minPrice = Math.min(...chartData.map(d => d.low)) * 0.98;
  
  // Filter price anomalies for chart display
  const priceAnomalies = anomalies.filter(a => a.type === 'price');

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="font-medium">{formatDate(label)}</p>
          <p>Price: {formatPrice(payload[0].value)}</p>
          <p>Volume: {payload[0].payload.volume.toLocaleString()}</p>
          {chartType === 'candle' && (
            <>
              <p>Open: {formatPrice(payload[0].payload.open)}</p>
              <p>High: {formatPrice(payload[0].payload.high)}</p>
              <p>Low: {formatPrice(payload[0].payload.low)}</p>
              <p>Close: {formatPrice(payload[0].payload.close)}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold text-lg">Price History</h3>
        <div className="flex space-x-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'candle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('candle')}
          >
            Candle
          </Button>
        </div>
      </div>
      <CardContent className="p-0 h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--secondary))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))" 
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              tickFormatter={(value) => formatPrice(value).replace('$', '')}
              stroke="hsl(var(--muted-foreground))" 
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false} 
              activeDot={{ r: 6 }} 
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="hsl(var(--accent))" 
              fill="hsl(var(--accent))" 
              opacity={0.1}
              yAxisId={1} 
              hide={true} // We'll show volume in a separate chart
            />
            
            {/* Render anomaly points */}
            {priceAnomalies.map(anomaly => (
              <ReferenceDot
                key={anomaly.id}
                x={anomaly.date}
                y={anomaly.value}
                r={6}
                stroke="white"
                strokeWidth={1}
                fill={`hsl(var(--${anomaly.severity === 'high' 
                  ? 'destructive' 
                  : (anomaly.severity === 'medium' ? 'warning' : 'primary')}))`}
                className={`anomaly-point anomaly-point-${anomaly.severity}`}
                onClick={() => onAnomalyClick(anomaly)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
