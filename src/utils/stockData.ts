
import { StockData, StockMetrics } from '@/types';

// This is mock data for demonstration purposes
// In a real app, you would fetch this from an API
const mockStockSymbols = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT'
];

// Generate fake historical stock data
export const fetchStockData = async (symbol: string, from: Date, to: Date): Promise<StockData[]> => {
  // In a real app, this would be an API call
  // For demo purposes, we'll generate mock data
  console.log(`Fetching data for ${symbol} from ${from.toDateString()} to ${to.toDateString()}`);
  
  const result: StockData[] = [];
  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24));
  const startPrice = 100 + Math.random() * 900; // Random start price between 100 and 1000
  
  let currentDate = new Date(from);
  let price = startPrice;
  
  for (let i = 0; i < days; i++) {
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      continue;
    }
    
    // Generate daily price movement (normal distribution around 0)
    const dailyChange = (Math.random() - 0.5) * 0.05 * price; // Daily change up to ±2.5%
    price += dailyChange;
    
    // Add some volatility
    const volatilityFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% volatility
    
    // Create artificial anomalies occasionally (about 5% of days)
    const isAnomaly = Math.random() < 0.05;
    if (isAnomaly) {
      if (Math.random() < 0.5) {
        // Price spike
        price *= 1 + (Math.random() * 0.2); // Spike up to 20%
      } else {
        // Price drop
        price *= 1 - (Math.random() * 0.2); // Drop up to 20%
      }
    }
    
    const open = price;
    const close = price + dailyChange;
    const high = Math.max(open, close) * volatilityFactor;
    const low = Math.min(open, close) / volatilityFactor;
    
    // Generate volume with occasional anomalies
    let volume = Math.floor(100000 + Math.random() * 900000); // Base volume between 100K and 1M
    if (Math.random() < 0.05) { // Volume anomaly
      volume *= 3 + Math.random() * 7; // 3-10x normal volume
    }
    
    result.push({
      symbol,
      date: currentDate.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
      adjClose: close
    });
    
    // Move to next day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return result;
};

export const fetchStockMetrics = async (symbol: string, data: StockData[]): Promise<StockMetrics> => {
  if (data.length === 0) {
    throw new Error('No stock data available to calculate metrics');
  }
  
  // Get latest price
  const latest = data[data.length - 1];
  const previousDay = data[data.length - 2] || data[0];
  
  // Calculate daily change
  const dailyChange = latest.close - previousDay.close;
  const dailyChangePercent = (dailyChange / previousDay.close) * 100;
  
  // Calculate average volume (20-day)
  const recentData = data.slice(-20);
  const averageVolume = recentData.reduce((sum, day) => sum + day.volume, 0) / recentData.length;
  
  // Calculate volatility (20-day standard deviation of returns)
  const returns = [];
  for (let i = 1; i < recentData.length; i++) {
    const dailyReturn = (recentData[i].close - recentData[i-1].close) / recentData[i-1].close;
    returns.push(dailyReturn);
  }
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDiffs = returns.map(ret => Math.pow(ret - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in percentage
  
  // Calculate RSI (14-day)
  const rsi = calculateRSI(data.slice(-15));
  
  // Dummy anomaly count for demonstration
  const anomalyCount = Math.floor(Math.random() * 5);
  
  return {
    symbol,
    currentPrice: latest.close,
    dailyChange,
    dailyChangePercent,
    averageVolume,
    anomalyCount,
    volatility,
    rsi
  };
};

// Calculate Relative Strength Index
function calculateRSI(data: StockData[]): number {
  if (data.length < 14) return 50; // Not enough data
  
  let gains = 0;
  let losses = 0;
  
  // Calculate average gains and losses
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i-1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change; // Make losses positive
    }
  }
  
  const avgGain = gains / (data.length - 1);
  const avgLoss = losses / (data.length - 1);
  
  if (avgLoss === 0) return 100; // Prevent division by zero
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 100) / 100;
}

export const getAvailableStockSymbols = (): string[] => {
  return mockStockSymbols;
};
