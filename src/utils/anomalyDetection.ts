
import { StockData, AnomalyData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In a real application, you'd implement a proper machine learning algorithm
// like Isolation Forest. This is a simplified version for demonstration purposes.

export const detectAnomalies = (stockData: StockData[]): AnomalyData[] => {
  if (!stockData || stockData.length < 2) {
    return [];
  }
  
  const anomalies: AnomalyData[] = [];
  
  // For small datasets (less than 20 points), use a simpler approach
  if (stockData.length < 20) {
    // Just detect large day-to-day changes as potential anomalies
    for (let i = 1; i < stockData.length; i++) {
      const prevDay = stockData[i-1];
      const currentDay = stockData[i];
      
      // Calculate percentage change
      const priceChange = (currentDay.close - prevDay.close) / prevDay.close;
      const volumeChange = currentDay.volume / (prevDay.volume || 1) - 1;
      
      // Flag large price movements (more than 5%)
      if (Math.abs(priceChange) > 0.05) {
        const severity = Math.abs(priceChange) > 0.1 ? 'high' : 
                        (Math.abs(priceChange) > 0.075 ? 'medium' : 'low');
        
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
      
      // Flag large volume changes (more than 100%)
      if (Math.abs(volumeChange) > 1) {
        const severity = Math.abs(volumeChange) > 2 ? 'high' : 
                        (Math.abs(volumeChange) > 1.5 ? 'medium' : 'low');
        
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
  
  // For larger datasets, use the original algorithm
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
    
    if (priceZScore > 2.5) { // More than 2.5 standard deviations
      const severity = priceZScore > 4 ? 'high' : (priceZScore > 3 ? 'medium' : 'low');
      
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
    
    if (volumeZScore > 3) { // More than 3 standard deviations
      const severity = volumeZScore > 5 ? 'high' : (volumeZScore > 4 ? 'medium' : 'low');
      
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
  
  return Math.sqrt(sumSquaredDiff / count);
};
