
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

  // Format chart data for rendering
  const chartData = stockData.map(item => ({
    date: item.date,
    price: item.close,
    volume: item.volume,
    open: item.open,
    close: item.close,
    high: item.high,
    low: item.low,
    // These values are used for the custom candlestick visualization
    highLow: [item.low, item.high],
    openClose: [Math.min(item.open, item.close), Math.max(item.open, item.close)],
    isIncreasing: item.close >= item.open
  }));

  // This data is specifically formatted for our custom candlestick rendering
  const candleData = chartData.map((item, index) => ({
    index: index,
    date: item.date,
    highLow: item.highLow,
    openClose: item.openClose,
    isIncreasing: item.isIncreasing
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

  // Custom tooltip content - Fixed to handle undefined values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0 && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="font-medium">{formatDate(label)}</p>
          <p>Price: {formatPrice(data.price)}</p>
          <p>Volume: {data.volume ? data.volume.toLocaleString() : 'N/A'}</p>
          {chartType === 'candle' && (
            <>
              <p>Open: {formatPrice(data.open)}</p>
              <p>High: {formatPrice(data.high)}</p>
              <p>Low: {formatPrice(data.low)}</p>
              <p>Close: {formatPrice(data.close)}</p>
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
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--secondary))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                minTickGap={10}
                angle={-45}
                height={50}
                textAnchor="end"
              />
              <YAxis 
                domain={[minPrice, maxPrice]} 
                tickFormatter={(value) => formatPrice(value).replace('$', '')}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Render the candlestick chart using individual components for each candle */}
              {chartData.map((entry, index) => (
                <Line
                  key={`highlow-${index}`}
                  type="monotone"
                  dataKey="high"
                  stroke={entry.isIncreasing ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  // This limits the line to just this data point
                  data={[{high: entry.high, low: entry.low, date: entry.date}]}
                  // Custom props to make a vertical line
                  connectNulls={true}
                  points={[
                    {x: index, y: entry.low},
                    {x: index, y: entry.high}
                  ]}
                />
              ))}
              
              {/* Render the body of each candle */}
              <Bar
                dataKey="openClose"
                barSize={8}
                shape={(props) => {
                  const { x, y, width, height, fill } = props;
                  const index = props.index as number;
                  const entry = chartData[index];
                  const color = entry.isIncreasing ? "hsl(var(--primary))" : "hsl(var(--destructive))";
                  
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={color}
                      stroke={color}
                    />
                  );
                }}
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
            </ComposedChart>
          </ResponsiveContainer>
        );
      default: // line chart
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--secondary))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                minTickGap={10}
                angle={-45}
                height={50}
                textAnchor="end" 
              />
              <YAxis 
                domain={[minPrice, maxPrice]} 
                tickFormatter={(value) => formatPrice(value).replace('$', '')}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                width={50}
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
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center p-4 border-b gap-3">
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
        <div className="flex flex-wrap gap-2 w-full xs:w-auto">
          <div className="flex space-x-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="flex-1 xs:flex-auto"
            >
              Line
            </Button>
            <Button
              variant={chartType === 'candle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candle')}
              className="flex-1 xs:flex-auto"
            >
              Candle
            </Button>
          </div>
          <Button
            variant={showVolumeChart ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowVolumeChart(!showVolumeChart)}
            className="w-full xs:w-auto"
          >
            {showVolumeChart ? 'Hide Volume' : 'Show Volume'}
          </Button>
        </div>
      </div>
      <CardContent className="p-0 h-[500px]">
        <div className="h-full flex flex-col">
          <div className={`${showVolumeChart ? 'h-2/3' : 'h-full'} w-full`}>
            {renderChart()}
          </div>
          
          {showVolumeChart && (
            <div className="h-1/3 border-t border-border w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--secondary))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    minTickGap={10}
                    angle={-45}
                    height={50}
                    textAnchor="end"
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
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
