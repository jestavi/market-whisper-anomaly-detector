
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StockData, AnomalyData, ChartType } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceDot, Legend, Bar, BarChart, ComposedChart,
  ScatterChart, Scatter
} from 'recharts';
import { Info } from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StockChartProps {
  stockData: StockData[];
  anomalies: AnomalyData[];
  onAnomalyClick: (anomaly: AnomalyData) => void;
}

export function StockChart({ stockData, anomalies, onAnomalyClick }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showVolumeChart, setShowVolumeChart] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const chartData = stockData.map(item => ({
    date: item.date,
    price: item.close,
    volume: item.volume,
    open: item.open,
    close: item.close,
    high: item.high,
    low: item.low,
    // Add coordinates for candle chart replacement
    highToLow: [item.low, item.high],
    openToClose: [Math.min(item.open, item.close), Math.max(item.open, item.close)],
    isIncreasing: item.close >= item.open
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
  
  // Max volume for volume chart
  const maxVolume = Math.max(...chartData.map(d => d.volume));
  
  // Filter price anomalies for chart display
  const priceAnomalies = anomalies.filter(a => a.type === 'price');
  const volumeAnomalies = anomalies.filter(a => a.type === 'volume');

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

  // Function to render different chart types
  const renderChart = () => {
    switch(chartType) {
      case 'candle':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
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
              <Legend />
              
              {/* High-Low line (represents the full candle range) */}
              {chartData.map((entry, index) => (
                <Line
                  key={`highlow-${index}`}
                  data={[entry]}
                  dataKey="highToLow"
                  stroke={entry.isIncreasing ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              ))}
              
              {/* Open-Close bar (represents the body of the candle) */}
              {chartData.map((entry, index) => (
                <Bar
                  key={`openclose-${index}`}
                  dataKey="openToClose"
                  fill={entry.isIncreasing ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  stroke={entry.isIncreasing ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  barSize={8}
                  data={[entry]}
                  isAnimationActive={false}
                />
              ))}
              
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
            </ComposedChart>
          </ResponsiveContainer>
        );
      default: // line chart
        return (
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
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false} 
                activeDot={{ r: 6 }} 
                name="Price"
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
        );
    }
  };

  return (
    <Card className="w-full h-full">
      <div className="flex flex-wrap justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <h3 className="font-semibold text-lg mr-2">Price History</h3>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>This chart displays historical price data with detected anomalies highlighted. Click on an anomaly point for more details.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
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
          <Button
            variant={showVolumeChart ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowVolumeChart(!showVolumeChart)}
          >
            {showVolumeChart ? 'Hide Volume' : 'Show Volume'}
          </Button>
        </div>
      </div>
      <CardContent className="p-0 h-[500px]">
        <div className="h-full flex flex-col">
          <div className={`${showVolumeChart ? 'h-2/3' : 'h-full'}`}>
            {renderChart()}
          </div>
          
          {showVolumeChart && (
            <div className="h-1/3 border-t border-border">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--secondary))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="hsl(var(--muted-foreground))" 
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} 
                    stroke="hsl(var(--muted-foreground))" 
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="volume" 
                    fill="hsl(var(--accent))" 
                    name="Volume" 
                  />
                  
                  {/* Render volume anomaly points */}
                  {volumeAnomalies.map(anomaly => (
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
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
