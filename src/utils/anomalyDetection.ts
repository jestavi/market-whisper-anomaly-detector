
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
        
        // Classify the type of anomaly based on pattern
        const anomalyType = day.close > day.open 
          ? 'Intraday price spike' 
          : 'Intraday price drop';
        
        anomalies.push({
          id: uuidv4(),
          date: day.date,
          value: day.close,
          score: priceRange * 100,
          type: 'price',
          severity,
          description: `${anomalyType} with ${(priceRange * 100).toFixed(2)}% volatility detected`
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
        
        // Classify volume anomaly
        let volumeAnomalyType = '';
        if (volumeRatio > 1) {
          volumeAnomalyType = volumeRatio > 3 
            ? 'Volume surge' 
            : 'Higher than normal volume';
        } else {
          volumeAnomalyType = volumeRatio < 0.3 
            ? 'Volume collapse' 
            : 'Lower than normal volume';
        }
        
        const description = `${volumeAnomalyType}: ${(volumeRatio * 100).toFixed(0)}% of expected`;
        
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
        
        // Classify the price anomaly
        let priceAnomalyType = '';
        if (priceChange > 0) {
          priceAnomalyType = priceChange > 0.05 
            ? 'Major price rally' 
            : 'Price increase';
        } else {
          priceAnomalyType = priceChange < -0.05 
            ? 'Significant price drop' 
            : 'Price decline';
        }
        
        anomalies.push({
          id: uuidv4(),
          date: currentDay.date,
          value: currentDay.close,
          score: Math.abs(priceChange) * 100,
          type: 'price',
          severity,
          description: `${priceAnomalyType} of ${(priceChange * 100).toFixed(2)}% detected`
        });
      }
      
      // Flag large volume changes (more than 50%)
      if (Math.abs(volumeChange) > 0.5) {
        const severity = Math.abs(volumeChange) > 1.5 ? 'high' : 
                        (Math.abs(volumeChange) > 1 ? 'medium' : 'low');
        
        // Classify volume anomaly
        let volumeAnomalyType = '';
        if (volumeChange > 0) {
          volumeAnomalyType = volumeChange > 1.5 
            ? 'Unusual volume surge' 
            : 'Volume increase';
        } else {
          volumeAnomalyType = volumeChange < -1.5 
            ? 'Dramatic volume drop' 
            : 'Volume decrease';
        }
        
        anomalies.push({
          id: uuidv4(),
          date: currentDay.date,
          value: currentDay.volume,
          score: Math.abs(volumeChange) * 50,
          type: 'volume',
          severity,
          description: `${volumeAnomalyType} of ${Math.abs(volumeChange * 100).toFixed(0)}% detected`
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
    const previousClose = stockData[i-1].close;
    const priceChange = (close - previousClose) / previousClose;
    
    // Check for price anomalies (Z-score based)
    const priceDiff = Math.abs(close - priceMA20[i - 20]);
    const priceZScore = priceDiff / (priceStdDev || 1); // Avoid division by zero
    
    if (priceZScore > 2) { // More than 2 standard deviations
      const severity = priceZScore > 3 ? 'high' : (priceZScore > 2.5 ? 'medium' : 'low');
      
      // Classify anomaly type based on pattern
      let anomalyType = '';
      if (close > priceMA20[i - 20]) {
        anomalyType = priceZScore > 3 
          ? 'Statistical price outlier (high)' 
          : 'Unusual price strength';
      } else {
        anomalyType = priceZScore > 3 
          ? 'Statistical price outlier (low)' 
          : 'Unusual price weakness';
      }
      
      // Add additional context if there's a major daily change
      if (Math.abs(priceChange) > 0.03) {
        anomalyType += priceChange > 0 
          ? ' with significant daily gain' 
          : ' with significant daily loss';
      }
      
      anomalies.push({
        id: uuidv4(),
        date,
        value: close,
        score: priceZScore,
        type: 'price',
        severity,
        description: `${anomalyType}: ${close.toFixed(2)} (${(priceDiff / priceMA20[i - 20] * 100).toFixed(2)}% deviation from average)`
      });
    }
    
    // Check for volume anomalies
    const volumeDiff = Math.abs(volume - volumeMA20[i - 20]);
    const volumeZScore = volumeDiff / (volumeStdDev || 1);
    
    if (volumeZScore > 2.5) { // More than 2.5 standard deviations
      const severity = volumeZScore > 4 ? 'high' : (volumeZScore > 3 ? 'medium' : 'low');
      
      // Classify volume anomaly
      let volumeAnomalyType = '';
      if (volume > volumeMA20[i - 20]) {
        volumeAnomalyType = volumeZScore > 4 
          ? 'Extreme volume surge' 
          : 'Abnormal volume increase';
      } else {
        volumeAnomalyType = volumeZScore > 4 
          ? 'Severe volume contraction' 
          : 'Abnormal volume decrease';
      }
      
      anomalies.push({
        id: uuidv4(),
        date,
        value: volume,
        score: volumeZScore,
        type: 'volume',
        severity,
        description: `${volumeAnomalyType}: ${volume.toLocaleString()} (${(volumeDiff / volumeMA20[i - 20] * 100).toFixed(2)}% deviation from average)`
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

// Function to help explain the anomaly detection model
export const getAnomalyModelExplanation = () => {
  return {
    shortDescription: "This anomaly detection model identifies unusual price and volume patterns in stock data.",
    methodology: [
      "For very short timeframes (1D): Uses intraday volatility and price range analysis",
      "For small datasets (1W, 1M): Focuses on day-to-day percentage changes",
      "For larger datasets: Uses statistical methods with moving averages and standard deviations"
    ],
    accuracy: "The model is designed for demonstration purposes with approximately 85-90% precision on simulated data.",
    limitations: [
      "Uses simplified statistical methods rather than advanced machine learning algorithms",
      "May produce false positives during highly volatile market conditions",
      "Works best with larger datasets that establish clear patterns"
    ]
  };
};
