
import { useState, useEffect } from 'react';
import { StockSelector } from '@/components/StockSelector';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { StockChart } from '@/components/StockChart';
import { MetricsPanel } from '@/components/MetricsPanel';
import { AnomalyList } from '@/components/AnomalyList';
import { StockData, AnomalyData, TimeRange, DateRangeValue } from '@/types';
import { fetchStockData, fetchStockMetrics } from '@/utils/stockData';
import { detectAnomalies } from '@/utils/anomalyDetection';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    to: new Date()
  });
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data when stock or date range changes
  useEffect(() => {
    const loadData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      
      setLoading(true);
      try {
        // Fetch stock data
        const data = await fetchStockData(selectedStock, dateRange.from, dateRange.to);
        setStockData(data);
        
        // Calculate metrics
        const stockMetrics = await fetchStockMetrics(selectedStock, data);
        setMetrics(stockMetrics);
        
        // Detect anomalies
        const detectedAnomalies = detectAnomalies(data);
        setAnomalies(detectedAnomalies);
        
        // Reset selected anomaly
        setSelectedAnomaly(null);
        
        if (detectedAnomalies.length > 0) {
          toast({
            title: "Anomalies Detected",
            description: `${detectedAnomalies.length} anomalies found in ${selectedStock} data.`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error loading stock data:", error);
        toast({
          title: "Error",
          description: "Failed to load stock data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedStock, dateRange, toast]);

  // Handle time range preset selection
  const handleTimeRangePreset = (preset: TimeRange) => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch(preset) {
      case '1D':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'YTD':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'MAX':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
    }
    
    setDateRange({ from: startDate, to: endDate });
  };

  // Handle anomaly selection
  const handleAnomalyClick = (anomaly: AnomalyData) => {
    setSelectedAnomaly(anomaly);
    
    // Scroll to the anomaly date in the chart
    // This would require integration with the chart component
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card p-4 border-b shadow-sm">
        <div className="container">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <AlertTriangle className="mr-2 text-primary" />
              Stock Market Anomaly Detector
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <StockSelector value={selectedStock} onChange={setSelectedStock} />
          <DateRangeSelector 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
            onPresetSelected={handleTimeRangePreset}
          />
        </div>
        
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading {selectedStock} data...</p>
            </div>
          </div>
        ) : (
          <>
            {metrics && (
              <MetricsPanel metrics={metrics} />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StockChart 
                  stockData={stockData} 
                  anomalies={anomalies}
                  onAnomalyClick={handleAnomalyClick}
                />
              </div>
              <div>
                <AnomalyList 
                  anomalies={anomalies} 
                  onAnomalyClick={handleAnomalyClick}
                  selectedAnomalyId={selectedAnomaly?.id}
                />
              </div>
            </div>

            {selectedAnomaly && (
              <Card className="border border-primary animate-fade-in">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Anomaly Details</h3>
                    </div>
                    <Badge 
                      variant={
                        selectedAnomaly.severity === 'high'
                          ? 'destructive'
                          : (selectedAnomaly.severity === 'medium' ? 'default' : 'outline')
                      }
                    >
                      {selectedAnomaly.severity.toUpperCase()} SEVERITY
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(selectedAnomaly.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedAnomaly.type} Anomaly</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Anomaly Score</p>
                      <p className="font-medium">{selectedAnomaly.score.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p>{selectedAnomaly.description}</p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>
                      Note: This is a simulated environment with mock data and simplified anomaly detection.
                      A production system would use more sophisticated algorithms and real-time data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="border-t py-4 bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Stock Market Anomaly Detector | Demo Application</p>
          <p className="text-xs mt-1">
            This is a demonstration application using simulated data. Not for trading decisions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
