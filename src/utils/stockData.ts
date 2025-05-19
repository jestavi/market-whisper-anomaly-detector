
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
  
  // Ensure we generate at least one data point, even for very short time ranges
  const minDays = Math.max(1, days);
  
  let currentDate = new Date(from);
  let price = startPrice;
  
  // For very short ranges (1 day), generate intraday data points
  if (minDays === 1) {
    // Create a single day with higher volatility to ensure anomalies
    const dayVolatility = 0.03 + Math.random() * 0.04; // 3-7% intraday volatility
    const dailyTrend = (Math.random() - 0.5) * 0.02; // Daily trend -1% to +1%
    
    const open = price;
    const close = price * (1 + dailyTrend);
    const high = Math.max(open, close) * (1 + dayVolatility/2);
    const low = Math.min(open, close) * (1 - dayVolatility/2);
    
    // Generate volume - for 1D, create an anomaly about 30% of the time
    let volume = Math.floor(100000 + Math.random() * 900000);
    if (Math.random() < 0.3) { // 30% chance of volume anomaly
      volume *= 2 + Math.random() * 3; // 2-5x normal volume
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
    
    return result;
  }
  
  for (let i = 0; i < minDays; i++) {
    // Skip weekends (but ensure at least one data point for very short ranges)
    if ((currentDate.getDay() === 0 || currentDate.getDay() === 6) && minDays > 2) {
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
  if (!data || data.length === 0) {
    // Return default metrics if no data available
    return {
      symbol,
      currentPrice: 0,
      dailyChange: 0,
      dailyChangePercent: 0,
      averageVolume: 0,
      anomalyCount: 0,
      volatility: 0,
      rsi: 50
    };
  }
  
  // Get latest price
  const latest = data[data.length - 1];
  
  // For calculating daily change - handle case with only one data point
  let dailyChange = 0;
  let dailyChangePercent = 0;
  
  if (data.length > 1) {
    const previousDay = data[data.length - 2];
    dailyChange = latest.close - previousDay.close;
    dailyChangePercent = (dailyChange / previousDay.close) * 100;
  } else {
    // If only one data point, use high-low range for the day
    dailyChange = latest.close - latest.open;
    dailyChangePercent = (dailyChange / latest.open) * 100;
  }
  
  // Calculate average volume (20-day or as many days as available)
  const recentData = data.slice(-Math.min(20, data.length));
  const averageVolume = recentData.reduce((sum, day) => sum + day.volume, 0) / recentData.length;
  
  // Calculate volatility (standard deviation of returns, using as many days as available)
  const returns = [];
  
  // For datasets with at least 2 points, calculate returns normally
  if (recentData.length > 1) {
    for (let i = 1; i < recentData.length; i++) {
      const dailyReturn = (recentData[i].close - recentData[i-1].close) / recentData[i-1].close;
      returns.push(dailyReturn);
    }
  } else if (recentData.length === 1) {
    // For single data point, use intraday volatility
    const day = recentData[0];
    const intraday = (day.high - day.low) / day.open;
    returns.push(intraday);
  }
  
  let volatility = 0;
  if (returns.length > 0) {
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - meanReturn, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length || 0;
    volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in percentage
  }
  
  // Calculate RSI (14-day or as many days as available)
  const rsi = calculateRSI(data.slice(-Math.min(15, data.length)));
  
  // For single-day timeframes, use a higher anomaly count to demonstrate detection capability
  let anomalyCount = 0;
  
  if (data.length === 1) {
    // For single data point, random value but weighted toward at least 1 anomaly
    anomalyCount = Math.random() < 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
  } else {
    // For multiple data points, estimate based on data length
    anomalyCount = Math.max(0, Math.floor(Math.random() * (data.length > 5 ? 5 : data.length)));
  }
  
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
  if (data.length < 2) {
    // For single data point, use intraday data to estimate RSI
    if (data.length === 1) {
      const day = data[0];
      // If close > open, RSI will be higher
      if (day.close > day.open) {
        return 60 + Math.random() * 20; // 60-80 range for up day
      } else {
        return 20 + Math.random() * 20; // 20-40 range for down day
      }
    }
    return 50; // Default
  }
  
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

