
import { StockData, AnomalyData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In a real application, you'd implement a proper machine learning algorithm
// like Isolation Forest. This is a simplified version for demonstration purposes.

export const detectAnomalies = (stockData: StockData[]): AnomalyData[] => {
  if (!stockData || stockData.length === 0) {
    return [];
  }
  
  const anomalies: AnomalyData[] = [];
  
  // For very small datasets (less than 5 points), use intraday volatility comparison
  if (stockData.length < 5) {
    // For intraday or very short periods, use high-low range as anomaly indicator
    for (let i = 0; i < stockData.length; i++) {
      const day = stockData[i];
      
      // Calculate high-low range as percentage of opening price
      const priceRange = (day.high - day.low) / day.open;
      
      // Flag unusual intraday ranges (more than 3% from high to low)
      if (priceRange > 0.03) {
        const severity = priceRange > 0.05 ? 'high' : 
                      (priceRange > 0.04 ? 'medium' : 'low');
        
        anomalies.push({
          id: uuidv4(),
          date: day.date,
          value: day.close,
          score: priceRange * 100,
          type: 'price',
          severity,
          description: `Unusual intraday volatility of ${(priceRange * 100).toFixed(2)}% detected`
        });
      }
      
      // For volume anomalies, compare against median daily volume from historical data
      // This will help even for single days
      const averageVolumePerPrice = 5000; // Simplified model: 5000 shares per $ of price
      const expectedVolume = day.close * averageVolumePerPrice;
      const volumeRatio = day.volume / expectedVolume;
      
      if (volumeRatio > 1.5 || volumeRatio < 0.5) {
        const severity = volumeRatio > 3 || volumeRatio < 0.3 ? 'high' : 
                       (volumeRatio > 2 || volumeRatio < 0.4 ? 'medium' : 'low');
        
        const description = volumeRatio > 1 
          ? `Higher than expected volume: ${(volumeRatio * 100).toFixed(0)}% of normal`
          : `Lower than expected volume: ${(volumeRatio * 100).toFixed(0)}% of normal`;
        
        anomalies.push({
          id: uuidv4(),
          date: day.date,
          value: day.volume,
          score: Math.abs(1 - volumeRatio) * 50,
          type: 'volume',
          severity,
          description
        });
      }
    }
    
    return anomalies;
  }
  
  // For datasets with 5-20 points, use a simpler approach focused on day-to-day changes
  if (stockData.length < 20) {
    // Detect large day-to-day changes as potential anomalies
    for (let i = 1; i < stockData.length; i++) {
      const prevDay = stockData[i-1];
      const currentDay = stockData[i];
      
      // Calculate percentage change
      const priceChange = (currentDay.close - prevDay.close) / prevDay.close;
      const volumeChange = prevDay.volume > 0 ? (currentDay.volume / prevDay.volume) - 1 : 0;
      
      // Flag large price movements (more than 2%)
      if (Math.abs(priceChange) > 0.02) {
        const severity = Math.abs(priceChange) > 0.05 ? 'high' : 
                        (Math.abs(priceChange) > 0.03 ? 'medium' : 'low');
        
        anomalies.push({
          id: uuidv4(),
          date: currentDay.date,
          value: currentDay.close,
          score: Math.abs(priceChange) * 100,
          type: 'price',
          severity,
          description: `Price change of ${(priceChange * 100).toFixed(2)}% detected`
        });
      }
      
      // Flag large volume changes (more than 50%)
      if (Math.abs(volumeChange) > 0.5) {
        const severity = Math.abs(volumeChange) > 1.5 ? 'high' : 
                        (Math.abs(volumeChange) > 1 ? 'medium' : 'low');
        
        anomalies.push({
          id: uuidv4(),
          date: currentDay.date,
          value: currentDay.volume,
          score: Math.abs(volumeChange) * 50,
          type: 'volume',
          severity,
          description: `Volume change of ${(volumeChange * 100).toFixed(2)}% detected`
        });
      }
    }
    
    return anomalies;
  }
  
  // For larger datasets, use the more sophisticated algorithm with moving averages
  
  // Calculate moving averages for detection
  const priceMA20 = calculateMovingAverage(stockData.map(d => d.close), 20);
  const volumeMA20 = calculateMovingAverage(stockData.map(d => d.volume), 20);
  
  // Calculate standard deviations
  const priceStdDev = calculateStandardDeviation(stockData.map(d => d.close), priceMA20);
  const volumeStdDev = calculateStandardDeviation(stockData.map(d => d.volume), volumeMA20);
  
  // Detect price anomalies
  for (let i = 20; i < stockData.length; i++) {
    const date = stockData[i].date;
    const close = stockData[i].close;
    const volume = stockData[i].volume;
    
    // Check for price anomalies (Z-score based)
    const priceDiff = Math.abs(close - priceMA20[i - 20]);
    const priceZScore = priceDiff / (priceStdDev || 1); // Avoid division by zero
    
    if (priceZScore > 2) { // More than 2 standard deviations (reduced threshold)
      const severity = priceZScore > 3 ? 'high' : (priceZScore > 2.5 ? 'medium' : 'low');
      
      anomalies.push({
        id: uuidv4(),
        date,
        value: close,
        score: priceZScore,
        type: 'price',
        severity,
        description: `Price anomaly detected: ${close.toFixed(2)} (${(priceDiff / priceMA20[i - 20] * 100).toFixed(2)}% deviation from 20-day average)`
      });
    }
    
    // Check for volume anomalies
    const volumeDiff = Math.abs(volume - volumeMA20[i - 20]);
    const volumeZScore = volumeDiff / (volumeStdDev || 1);
    
    if (volumeZScore > 2.5) { // More than 2.5 standard deviations
      const severity = volumeZScore > 4 ? 'high' : (volumeZScore > 3 ? 'medium' : 'low');
      
      anomalies.push({
        id: uuidv4(),
        date,
        value: volume,
        score: volumeZScore,
        type: 'volume',
        severity,
        description: `Volume anomaly detected: ${volume.toLocaleString()} (${(volumeDiff / volumeMA20[i - 20] * 100).toFixed(2)}% deviation from 20-day average)`
      });
    }
  }
  
  return anomalies;
};

// Helper function to calculate moving average
const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result = [];
  
  for (let i = 0; i <= data.length - window; i++) {
    const windowSlice = data.slice(i, i + window);
    const average = windowSlice.reduce((sum, val) => sum + val, 0) / window;
    result.push(average);
  }
  
  return result;
};

// Helper function to calculate standard deviation
const calculateStandardDeviation = (data: number[], mean: number[]): number => {
  let sumSquaredDiff = 0;
  let count = 0;
  
  for (let i = 0; i < data.length && i < mean.length; i++) {
    const diff = data[i] - mean[i];
    sumSquaredDiff += diff * diff;
    count++;
  }
  
  return Math.sqrt(sumSquaredDiff / (count || 1)); // Avoid division by zero
};

