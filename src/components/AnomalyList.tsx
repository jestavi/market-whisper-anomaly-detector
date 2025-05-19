
import { AnomalyData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, BarChart } from 'lucide-react';

interface AnomalyListProps {
  anomalies: AnomalyData[];
  onAnomalyClick: (anomaly: AnomalyData) => void;
  selectedAnomalyId?: string;
}

export function AnomalyList({ anomalies, onAnomalyClick, selectedAnomalyId }: AnomalyListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Sort anomalies by severity (high to low) then by date (newest first)
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    const severityScore = { high: 3, medium: 2, low: 1 };
    if (severityScore[b.severity] !== severityScore[a.severity]) {
      return severityScore[b.severity] - severityScore[a.severity];
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2" /> 
          Detected Anomalies
          <Badge variant="outline" className="ml-2">{anomalies.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto flex-grow">
        {sortedAnomalies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No anomalies detected
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAnomalies.map((anomaly) => (
              <div 
                key={anomaly.id}
                className={`p-3 rounded-md cursor-pointer transition-all ${
                  selectedAnomalyId === anomaly.id 
                    ? 'bg-accent border-l-4 border-primary' 
                    : 'hover:bg-secondary'
                }`}
                onClick={() => onAnomalyClick(anomaly)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium flex items-center">
                    {anomaly.type === 'price' ? (
                      <TrendingUp className="mr-2 h-4 w-4" />
                    ) : (
                      <BarChart className="mr-2 h-4 w-4" />
                    )}
                    {anomaly.type === 'price' ? 'Price' : 'Volume'} Anomaly
                  </div>
                  <Badge 
                    variant={
                      anomaly.severity === 'high' 
                        ? 'destructive' 
                        : (anomaly.severity === 'medium' ? 'default' : 'outline')
                    }
                  >
                    {anomaly.severity}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  {formatDate(anomaly.date)}
                </div>
                <div className="text-sm">
                  {anomaly.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Anomaly score: {anomaly.score.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
