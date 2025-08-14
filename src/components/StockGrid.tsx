import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { AnomalyData, StockMetrics } from '@/types';

interface PortfolioStock {
  symbol: string;
  data: any[];
  anomalies: AnomalyData[];
  metrics: StockMetrics;
  lastUpdate: Date;
}

interface StockGridProps {
  stocks: PortfolioStock[];
  sectors: string[];
  selectedSector: string;
  onSectorChange: (sector: string) => void;
  onRemoveStock: (symbol: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

const StockCard = ({ stock, onRemove }: { stock: PortfolioStock; onRemove: (symbol: string) => void }) => {
  const { symbol, anomalies, metrics } = stock;
  
  const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
  const mediumAnomalies = anomalies.filter(a => a.severity === 'medium').length;
  const lowAnomalies = anomalies.filter(a => a.severity === 'low').length;
  
  const isPositive = metrics.dailyChangePercent >= 0;
  const riskLevel = highAnomalies > 0 ? 'high' : mediumAnomalies > 2 ? 'medium' : 'low';
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-primary';
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      default: return 'default' as const;
    }
  };

  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <Badge variant={getRiskBadgeVariant(riskLevel)} className="text-xs">
              {riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(symbol)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="flex items-center gap-4">
          <span className="text-xl font-bold">${metrics.currentPrice?.toFixed(2) || '0.00'}</span>
          <span className={`flex items-center gap-1 ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(metrics.dailyChangePercent || 0).toFixed(2)}%
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Anomaly Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Anomalies</span>
            <span className="font-medium">{anomalies.length}</span>
          </div>
          
          {anomalies.length > 0 && (
            <div className="flex gap-2">
              {highAnomalies > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {highAnomalies} High
                </Badge>
              )}
              {mediumAnomalies > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {mediumAnomalies} Medium
                </Badge>
              )}
              {lowAnomalies > 0 && (
                <Badge variant="outline" className="text-xs">
                  {lowAnomalies} Low
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Volatility
            </span>
            <span className="font-medium">{metrics.volatility?.toFixed(1) || '0.0'}%</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>RSI</span>
              <span>{metrics.rsi?.toFixed(0) || '50'}</span>
            </div>
            <Progress 
              value={metrics.rsi || 50} 
              className="h-1"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Volume</span>
            <span className="font-medium text-xs">
              {metrics.averageVolume ? (metrics.averageVolume / 1000000).toFixed(1) + 'M' : '0M'}
            </span>
          </div>
        </div>

        {/* Latest Anomaly Preview */}
        {anomalies.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-1">Latest Anomaly</div>
            <div className="text-xs">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="font-medium capitalize">{anomalies[0].severity}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {anomalies[0].type}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-2">
                {anomalies[0].description}
              </p>
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Updated: {stock.lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

const StockCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

export const StockGrid = ({ 
  stocks, 
  sectors, 
  selectedSector, 
  onSectorChange, 
  onRemoveStock, 
  loading,
  onRefresh 
}: StockGridProps) => {
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Select value={selectedSector} onValueChange={onSectorChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector === 'all' ? 'All Sectors' : sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-xs sm:text-sm text-muted-foreground">
            {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <Button 
          onClick={onRefresh} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <StockCardSkeleton key={i} />
          ))
        ) : stocks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-muted-foreground">
              {selectedSector === 'all' 
                ? 'No stocks in your watchlist. Add some stocks to get started.'
                : `No stocks found in ${selectedSector} sector.`
              }
            </div>
          </div>
        ) : (
          stocks.map((stock) => (
            <StockCard 
              key={stock.symbol} 
              stock={stock} 
              onRemove={onRemoveStock}
            />
          ))
        )}
      </div>
    </div>
  );
};