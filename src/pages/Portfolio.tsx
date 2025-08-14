import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StockData, AnomalyData, StockMetrics } from '@/types';
import { detectAnomalies } from '@/utils/anomalyDetection';
import { fetchStockData, fetchStockMetrics } from '@/utils/stockData';
import { WatchlistManager } from '@/components/WatchlistManager';
import { StockGrid } from '@/components/StockGrid';
import { PortfolioAnalysis } from '@/components/PortfolioAnalysis';
import { MarketComparison } from '@/components/MarketComparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

interface PortfolioStock {
  symbol: string;
  data: StockData[];
  anomalies: AnomalyData[];
  metrics: StockMetrics;
  lastUpdate: Date;
}

const Portfolio = () => {
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'GOOGL', 'MSFT', 'TSLA']);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const { toast } = useToast();

  // Stock sectors mapping
  const stockSectors: Record<string, string> = {
    'AAPL': 'Technology',
    'GOOGL': 'Technology', 
    'MSFT': 'Technology',
    'TSLA': 'Automotive',
    'NVDA': 'Technology',
    'META': 'Technology',
    'AMZN': 'E-commerce',
    'JPM': 'Finance',
    'JNJ': 'Healthcare',
    'PFE': 'Healthcare',
    'XOM': 'Energy',
    'CVX': 'Energy'
  };

  const sectors = ['all', ...Array.from(new Set(Object.values(stockSectors)))];

  // Fetch data for all watchlist stocks
  const refreshPortfolioData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3); // 3 months of data

      const portfolioPromises = watchlist.map(async (symbol) => {
        try {
          const stockData = await fetchStockData(symbol, startDate, endDate);
          const anomalies = detectAnomalies(stockData);
          const metrics = await fetchStockMetrics(symbol, stockData);
          
          return {
            symbol,
            data: stockData,
            anomalies,
            metrics,
            lastUpdate: new Date()
          };
        } catch (error) {
          console.error(`Failed to fetch data for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(portfolioPromises);
      const validStocks = results.filter((stock): stock is PortfolioStock => stock !== null);
      
      setPortfolioStocks(validStocks);
      toast({
        title: "Portfolio Updated",
        description: `Updated data for ${validStocks.length} stocks`,
      });
    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
      toast({
        title: "Update Failed",
        description: "Failed to refresh portfolio data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh on watchlist changes
  useEffect(() => {
    if (watchlist.length > 0) {
      refreshPortfolioData();
    }
  }, [watchlist]);

  // Add stock to watchlist
  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol.toUpperCase())) {
      setWatchlist(prev => [...prev, symbol.toUpperCase()]);
      toast({
        title: "Stock Added",
        description: `${symbol.toUpperCase()} added to watchlist`,
      });
    }
  };

  // Remove stock from watchlist
  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setPortfolioStocks(prev => prev.filter(s => s.symbol !== symbol));
    toast({
      title: "Stock Removed",
      description: `${symbol} removed from watchlist`,
    });
  };

  // Filter stocks by sector
  const filteredStocks = selectedSector === 'all' 
    ? portfolioStocks 
    : portfolioStocks.filter(stock => stockSectors[stock.symbol] === selectedSector);

  // Calculate portfolio-wide statistics
  const totalAnomalies = portfolioStocks.reduce((sum, stock) => sum + stock.anomalies.length, 0);
  const highSeverityAnomalies = portfolioStocks.reduce((sum, stock) => 
    sum + stock.anomalies.filter(a => a.severity === 'high').length, 0);
  const averageVolatility = portfolioStocks.length > 0 
    ? portfolioStocks.reduce((sum, stock) => sum + (stock.metrics?.volatility || 0), 0) / portfolioStocks.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Portfolio Anomaly Monitor</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor multiple stocks for anomalies and correlations across your portfolio
            </p>
          </div>

          {/* Portfolio Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStocks.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across {sectors.length - 1} sectors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnomalies}</div>
                <p className="text-xs text-muted-foreground">
                  {highSeverityAnomalies} high severity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Volatility</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageVolatility.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Portfolio average
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="grid" className="text-xs sm:text-sm">Grid</TabsTrigger>
            <TabsTrigger value="watchlist" className="text-xs sm:text-sm">Watchlist</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm">Analysis</TabsTrigger>
            <TabsTrigger value="market" className="text-xs sm:text-sm">Market</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <StockGrid 
              stocks={filteredStocks}
              sectors={sectors}
              selectedSector={selectedSector}
              onSectorChange={setSelectedSector}
              onRemoveStock={removeFromWatchlist}
              loading={loading}
              onRefresh={refreshPortfolioData}
            />
          </TabsContent>

          <TabsContent value="watchlist">
            <WatchlistManager 
              watchlist={watchlist}
              onAddStock={addToWatchlist}
              onRemoveStock={removeFromWatchlist}
              stockSectors={stockSectors}
            />
          </TabsContent>

          <TabsContent value="analysis">
            <PortfolioAnalysis 
              portfolioStocks={portfolioStocks}
              stockSectors={stockSectors}
            />
          </TabsContent>

          <TabsContent value="market">
            <MarketComparison 
              portfolioStocks={portfolioStocks}
              stockSectors={stockSectors}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Portfolio;