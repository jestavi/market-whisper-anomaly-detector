
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StockSelector } from '@/components/StockSelector';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { StockChart } from '@/components/StockChart';
import { MetricsPanel } from '@/components/MetricsPanel';
import { AnomalyList } from '@/components/AnomalyList';
import { ModelExplanation } from '@/components/ModelExplanation';
import { OnboardingTooltips } from '@/components/OnboardingTooltips';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';
import { StockData, AnomalyData, TimeRange, DateRangeValue } from '@/types';
import { fetchStockData, fetchStockMetrics } from '@/utils/stockData';
import { detectAnomalies } from '@/utils/anomalyDetection';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<string>("chart");
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
    
    // On mobile, switch to the anomaly tab when selecting an anomaly
    if (window.innerWidth < 768) {
      setActiveTab("anomalies");
    }
    
    // Scroll to the anomaly details on desktop
    if (window.innerWidth >= 768) {
      const anomalyElement = document.getElementById('anomaly-details');
      if (anomalyElement) {
        anomalyElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Stock Anomaly Detector
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/">Single Stock</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/portfolio" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Portfolio Monitor
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Analyze Individual Stock Anomalies
          </h2>
          <p className="text-muted-foreground">
            Deep dive into a single stock's anomaly patterns and technical indicators
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              
              {/* Mobile Tabs View */}
              <div className="md:hidden">
                <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="anomalies">
                      Anomalies 
                      {anomalies.length > 0 && (
                        <Badge variant="outline" className="ml-2">{anomalies.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chart" className="mt-0">
                    <StockChart 
                      stockData={stockData} 
                      anomalies={anomalies}
                      onAnomalyClick={handleAnomalyClick}
                    />
                  </TabsContent>
                  
                  <TabsContent value="anomalies" className="mt-0">
                    <div className="space-y-4">
                      <AnomalyList 
                        anomalies={anomalies} 
                        onAnomalyClick={handleAnomalyClick}
                        selectedAnomalyId={selectedAnomaly?.id}
                      />
                      
                      {selectedAnomaly && (
                        <Card className="border border-primary animate-fade-in" id="anomaly-details">
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
                          </CardContent>
                        </Card>
                      )}
                      
                      <ModelExplanation />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <StockChart 
                    stockData={stockData} 
                    anomalies={anomalies}
                    onAnomalyClick={handleAnomalyClick}
                  />
                </div>
                <div className="space-y-6">
                  <AnomalyList 
                    anomalies={anomalies} 
                    onAnomalyClick={handleAnomalyClick}
                    selectedAnomalyId={selectedAnomaly?.id}
                  />
                  
                  <ModelExplanation />
                </div>
              </div>

              {selectedAnomaly && (
                <Card className="border border-primary animate-fade-in md:block" id="anomaly-details">
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
        </div>

        <OnboardingTooltips />
      </div>
    </div>
  );
};

export default Index;
