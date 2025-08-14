import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, Zap } from 'lucide-react';
import { AnomalyData } from '@/types';

interface PortfolioStock {
  symbol: string;
  data: any[];
  anomalies: AnomalyData[];
  metrics: any;
  lastUpdate: Date;
}

interface PortfolioAnalysisProps {
  portfolioStocks: PortfolioStock[];
  stockSectors: Record<string, string>;
}

export const PortfolioAnalysis = ({ portfolioStocks, stockSectors }: PortfolioAnalysisProps) => {
  // Calculate correlation matrix between stocks
  const calculateCorrelations = () => {
    const correlations: { stock1: string; stock2: string; correlation: number; strength: string }[] = [];
    
    for (let i = 0; i < portfolioStocks.length; i++) {
      for (let j = i + 1; j < portfolioStocks.length; j++) {
        const stock1 = portfolioStocks[i];
        const stock2 = portfolioStocks[j];
        
        // Calculate price correlation (simplified)
        const prices1 = stock1.data.map(d => d.close);
        const prices2 = stock2.data.map(d => d.close);
        
        if (prices1.length > 0 && prices2.length > 0) {
          const correlation = calculatePearsonCorrelation(prices1, prices2);
          const strength = Math.abs(correlation) > 0.7 ? 'Strong' : 
                          Math.abs(correlation) > 0.4 ? 'Moderate' : 'Weak';
          
          correlations.push({
            stock1: stock1.symbol,
            stock2: stock2.symbol,
            correlation,
            strength
          });
        }
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  };

  // Sector analysis
  const analyzeSectors = () => {
    const sectorData: Record<string, {
      stocks: string[];
      avgVolatility: number;
      totalAnomalies: number;
      avgRSI: number;
      performance: number;
    }> = {};

    portfolioStocks.forEach(stock => {
      const sector = stockSectors[stock.symbol] || 'Other';
      
      if (!sectorData[sector]) {
        sectorData[sector] = {
          stocks: [],
          avgVolatility: 0,
          totalAnomalies: 0,
          avgRSI: 0,
          performance: 0
        };
      }
      
      sectorData[sector].stocks.push(stock.symbol);
      sectorData[sector].totalAnomalies += stock.anomalies.length;
      sectorData[sector].avgVolatility += stock.metrics?.volatility || 0;
      sectorData[sector].avgRSI += stock.metrics?.rsi || 50;
      sectorData[sector].performance += stock.metrics?.dailyChangePercent || 0;
    });

    // Calculate averages
    Object.keys(sectorData).forEach(sector => {
      const count = sectorData[sector].stocks.length;
      sectorData[sector].avgVolatility /= count;
      sectorData[sector].avgRSI /= count;
      sectorData[sector].performance /= count;
    });

    return Object.entries(sectorData).map(([sector, data]) => ({
      sector,
      ...data
    }));
  };

  // Anomaly timeline analysis
  const getAnomalyTimeline = () => {
    const timeline: Record<string, { date: string; count: number; severity: Record<string, number> }> = {};
    
    portfolioStocks.forEach(stock => {
      stock.anomalies.forEach(anomaly => {
        const date = anomaly.date;
        if (!timeline[date]) {
          timeline[date] = { date, count: 0, severity: { low: 0, medium: 0, high: 0 } };
        }
        timeline[date].count++;
        timeline[date].severity[anomaly.severity]++;
      });
    });

    return Object.values(timeline).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Risk analysis
  const calculatePortfolioRisk = () => {
    const totalStocks = portfolioStocks.length;
    const highRiskStocks = portfolioStocks.filter(s => 
      s.anomalies.filter(a => a.severity === 'high').length > 0
    ).length;
    const mediumRiskStocks = portfolioStocks.filter(s => 
      s.anomalies.filter(a => a.severity === 'medium').length > 2
    ).length;
    
    const riskScore = totalStocks > 0 ? ((highRiskStocks * 3 + mediumRiskStocks * 1.5) / totalStocks) * 100 : 0;
    
    return {
      riskScore,
      highRiskStocks,
      mediumRiskStocks,
      lowRiskStocks: totalStocks - highRiskStocks - mediumRiskStocks
    };
  };

  const correlations = calculateCorrelations();
  const sectorAnalysis = analyzeSectors();
  const anomalyTimeline = getAnomalyTimeline();
  const riskAnalysis = calculatePortfolioRisk();

  const getRiskLevel = (score: number) => {
    if (score > 60) return { level: 'High', color: 'text-destructive', variant: 'destructive' as const };
    if (score > 30) return { level: 'Medium', color: 'text-warning', variant: 'secondary' as const };
    return { level: 'Low', color: 'text-primary', variant: 'default' as const };
  };

  const risk = getRiskLevel(riskAnalysis.riskScore);

  return (
    <div className="space-y-6">
      {/* Portfolio Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Portfolio Risk Assessment
            </CardTitle>
            <CardDescription>
              Overall risk level based on anomaly patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">Risk Score</span>
              <Badge variant={risk.variant} className="text-lg px-3 py-1">
                {risk.level}
              </Badge>
            </div>
            
            <Progress value={riskAnalysis.riskScore} className="h-3" />
            <div className="text-sm text-muted-foreground">
              {riskAnalysis.riskScore.toFixed(1)}% portfolio risk
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{riskAnalysis.highRiskStocks}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{riskAnalysis.mediumRiskStocks}</div>
                <div className="text-xs text-muted-foreground">Medium Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{riskAnalysis.lowRiskStocks}</div>
                <div className="text-xs text-muted-foreground">Low Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Anomaly Timeline
            </CardTitle>
            <CardDescription>
              Anomaly frequency over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={anomalyTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [value, 'Anomalies']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sector Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sector Performance Analysis
          </CardTitle>
          <CardDescription>
            Risk and performance metrics by sector
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectorAnalysis.map((sector) => (
              <div key={sector.sector} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{sector.sector}</h4>
                  <Badge variant="outline">{sector.stocks.length} stocks</Badge>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <div className="text-muted-foreground">Anomalies</div>
                    <div className="font-medium">{sector.totalAnomalies}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Volatility</div>
                    <div className="font-medium">{sector.avgVolatility.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg RSI</div>
                    <div className="font-medium">{sector.avgRSI.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Performance</div>
                    <div className={`font-medium flex items-center gap-1 ${
                      sector.performance >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {sector.performance >= 0 ? 
                        <TrendingUp className="h-3 w-3" /> : 
                        <TrendingDown className="h-3 w-3" />
                      }
                      {Math.abs(sector.performance).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Stocks:</div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1">
                    {sector.stocks.map(stock => (
                      <Badge key={stock} variant="outline" className="text-xs justify-center sm:justify-start">
                        {stock}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Stock Correlation Analysis
          </CardTitle>
          <CardDescription>
            Price correlations between portfolio stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {correlations.slice(0, 10).map((corr, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <Badge variant="outline">{corr.stock1}</Badge>
                    <span className="text-muted-foreground">↔</span>
                    <Badge variant="outline">{corr.stock2}</Badge>
                  </div>
                  <Badge 
                    variant={
                      corr.strength === 'Strong' ? 'default' : 
                      corr.strength === 'Moderate' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {corr.strength}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    Math.abs(corr.correlation) > 0.7 ? 'text-primary' : 
                    Math.abs(corr.correlation) > 0.4 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {(corr.correlation * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">correlation</div>
                </div>
              </div>
            ))}
            
            {correlations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Add more stocks to analyze correlations
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to calculate Pearson correlation
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