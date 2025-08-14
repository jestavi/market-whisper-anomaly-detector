import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, Globe, RefreshCw, Target, BarChart3 } from 'lucide-react';
import { fetchStockData } from '@/utils/stockData';
import { detectAnomalies } from '@/utils/anomalyDetection';

interface PortfolioStock {
  symbol: string;
  data: any[];
  anomalies: any[];
  metrics: any;
  lastUpdate: Date;
}

interface MarketComparisonProps {
  portfolioStocks: PortfolioStock[];
  stockSectors: Record<string, string>;
}

// Market indices and sector ETFs for comparison
const marketIndices = {
  'SPY': 'S&P 500',
  'QQQ': 'NASDAQ 100',
  'IWM': 'Russell 2000',
  'VTI': 'Total Stock Market'
};

const sectorETFs = {
  'XLK': 'Technology',
  'XLF': 'Finance', 
  'XLV': 'Healthcare',
  'XLE': 'Energy',
  'XLI': 'Industrial',
  'XLY': 'Consumer Discretionary'
};

export const MarketComparison = ({ portfolioStocks, stockSectors }: MarketComparisonProps) => {
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [selectedIndex, setSelectedIndex] = useState('SPY');
  const [loading, setLoading] = useState(false);
  const [comparisonMetrics, setComparisonMetrics] = useState<any[]>([]);

  // Fetch market index data
  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3);

      const promises = Object.keys({ ...marketIndices, ...sectorETFs }).map(async (symbol) => {
        try {
          const data = await fetchStockData(symbol, startDate, endDate);
          const anomalies = detectAnomalies(data);
          return { symbol, data, anomalies };
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);
      
      const marketDataMap: Record<string, any> = {};
      validResults.forEach(result => {
        if (result) {
          marketDataMap[result.symbol] = result;
        }
      });
      
      setMarketData(marketDataMap);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comparison metrics
  const calculateComparisonMetrics = () => {
    if (!marketData[selectedIndex] || portfolioStocks.length === 0) return [];

    const indexData = marketData[selectedIndex];
    const indexReturn = calculateReturn(indexData.data);
    const indexVolatility = calculateVolatility(indexData.data);

    return portfolioStocks.map(stock => {
      const stockReturn = calculateReturn(stock.data);
      const stockVolatility = calculateVolatility(stock.data);
      const beta = calculateBeta(stock.data, indexData.data);
      const alpha = stockReturn - (indexReturn * beta);
      
      const outperformance = stockReturn - indexReturn;
      const anomalyRatio = stock.anomalies.length / Math.max(stock.data.length, 1);
      const marketAnomalyRatio = indexData.anomalies.length / Math.max(indexData.data.length, 1);
      
      return {
        symbol: stock.symbol,
        sector: stockSectors[stock.symbol] || 'Other',
        return: stockReturn,
        volatility: stockVolatility,
        beta,
        alpha,
        outperformance,
        anomalyRatio,
        relativeAnomalyRisk: anomalyRatio / Math.max(marketAnomalyRatio, 0.001),
        marketCorrelation: calculateCorrelation(stock.data, indexData.data)
      };
    });
  };

  // Performance comparison chart data
  const getPerformanceChartData = () => {
    if (!marketData[selectedIndex] || portfolioStocks.length === 0) return [];

    const indexData = marketData[selectedIndex].data;
    const chartData: any[] = [];

    // Get the shortest dataset length to align all data
    const minLength = Math.min(
      indexData.length,
      ...portfolioStocks.map(s => s.data.length)
    );

    for (let i = 0; i < minLength; i++) {
      const dataPoint: any = {
        date: indexData[i].date,
        [selectedIndex]: normalizeToPercentage(indexData, i)
      };

      portfolioStocks.forEach(stock => {
        if (stock.data[i]) {
          dataPoint[stock.symbol] = normalizeToPercentage(stock.data, i);
        }
      });

      chartData.push(dataPoint);
    }

    return chartData;
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  useEffect(() => {
    setComparisonMetrics(calculateComparisonMetrics());
  }, [portfolioStocks, marketData, selectedIndex]);

  const performanceData = getPerformanceChartData();
  const sectorComparison = analyzeSectorPerformance();

  return (
    <div className="space-y-6">
      {/* Market Comparison Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Market Comparison
              </CardTitle>
              <CardDescription>
                Compare portfolio performance against market indices
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <optgroup label="Market Indices">
                    {Object.entries(marketIndices).map(([symbol, name]) => (
                      <SelectItem key={symbol} value={symbol}>
                        <span className="hidden sm:inline">{symbol} - {name}</span>
                        <span className="sm:hidden">{symbol}</span>
                      </SelectItem>
                    ))}
                  </optgroup>
                  <optgroup label="Sector ETFs">
                    {Object.entries(sectorETFs).map(([symbol, name]) => (
                      <SelectItem key={symbol} value={symbol}>
                        <span className="hidden sm:inline">{symbol} - {name}</span>
                        <span className="sm:hidden">{symbol}</span>
                      </SelectItem>
                    ))}
                  </optgroup>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={fetchMarketData} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Update</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number, name) => [`${value.toFixed(2)}%`, name]}
              />
              
              {/* Market index line */}
              <Line 
                type="monotone" 
                dataKey={selectedIndex}
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name={marketIndices[selectedIndex as keyof typeof marketIndices] || selectedIndex}
              />
              
              {/* Portfolio stocks */}
              {portfolioStocks.slice(0, 5).map((stock, index) => (
                <Line 
                  key={stock.symbol}
                  type="monotone" 
                  dataKey={stock.symbol}
                  stroke={`hsl(${200 + index * 40}, 70%, 50%)`}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Metrics vs {selectedIndex}
          </CardTitle>
          <CardDescription>
            Risk-adjusted performance and correlation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonMetrics.map((metric) => (
              <div key={metric.symbol} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{metric.symbol}</h4>
                    <Badge variant="outline">{metric.sector}</Badge>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    metric.outperformance >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {metric.outperformance >= 0 ? 
                      <TrendingUp className="h-4 w-4" /> : 
                      <TrendingDown className="h-4 w-4" />
                    }
                    <span className="font-medium">
                      {metric.outperformance >= 0 ? '+' : ''}{metric.outperformance.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <div className="text-muted-foreground">Beta</div>
                    <div className="font-medium">{metric.beta.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Alpha</div>
                    <div className={`font-medium ${
                      metric.alpha >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {metric.alpha >= 0 ? '+' : ''}{metric.alpha.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Correlation</div>
                    <div className="font-medium">{(metric.marketCorrelation * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Relative Risk</div>
                    <div className={`font-medium ${
                      metric.relativeAnomalyRisk > 1.5 ? 'text-destructive' : 
                      metric.relativeAnomalyRisk > 1 ? 'text-warning' : 'text-primary'
                    }`}>
                      {metric.relativeAnomalyRisk.toFixed(1)}x
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sector vs Market Performance
          </CardTitle>
          <CardDescription>
            How each sector in your portfolio compares to market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="sector" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar 
                dataKey="outperformance" 
                fill="hsl(var(--primary))"
                name="Outperformance (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  function analyzeSectorPerformance() {
    const sectorData: Record<string, { stocks: string[]; totalReturn: number; count: number }> = {};
    
    comparisonMetrics.forEach(metric => {
      if (!sectorData[metric.sector]) {
        sectorData[metric.sector] = { stocks: [], totalReturn: 0, count: 0 };
      }
      sectorData[metric.sector].stocks.push(metric.symbol);
      sectorData[metric.sector].totalReturn += metric.outperformance;
      sectorData[metric.sector].count++;
    });

    return Object.entries(sectorData).map(([sector, data]) => ({
      sector,
      outperformance: data.totalReturn / data.count,
      stockCount: data.count
    }));
  }
};

// Helper functions
function calculateReturn(data: any[]): number {
  if (data.length < 2) return 0;
  const start = data[0].close;
  const end = data[data.length - 1].close;
  return ((end - start) / start) * 100;
}

function calculateVolatility(data: any[]): number {
  if (data.length < 2) return 0;
  const returns = data.slice(1).map((d, i) => 
    (d.close - data[i].close) / data[i].close
  );
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized
}

function calculateBeta(stockData: any[], marketData: any[]): number {
  if (stockData.length < 2 || marketData.length < 2) return 1;
  
  const minLength = Math.min(stockData.length, marketData.length);
  const stockReturns = stockData.slice(1, minLength).map((d, i) => 
    (d.close - stockData[i].close) / stockData[i].close
  );
  const marketReturns = marketData.slice(1, minLength).map((d, i) => 
    (d.close - marketData[i].close) / marketData[i].close
  );
  
  const covariance = calculateCovariance(stockReturns, marketReturns);
  const marketVariance = calculateVariance(marketReturns);
  
  return marketVariance === 0 ? 1 : covariance / marketVariance;
}

function calculateCorrelation(stockData: any[], marketData: any[]): number {
  if (stockData.length < 2 || marketData.length < 2) return 0;
  
  const minLength = Math.min(stockData.length, marketData.length);
  const stockPrices = stockData.slice(0, minLength).map(d => d.close);
  const marketPrices = marketData.slice(0, minLength).map(d => d.close);
  
  return calculatePearsonCorrelation(stockPrices, marketPrices);
}

function calculateCovariance(x: number[], y: number[]): number {
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / x.length;
}

function calculateVariance(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  
  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function normalizeToPercentage(data: any[], index: number): number {
  if (index === 0 || data.length === 0) return 0;
  const start = data[0].close;
  const current = data[index].close;
  return ((current - start) / start) * 100;
}