
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
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
          <span className="hidden sm:inline">Detected Anomalies</span>
          <span className="sm:hidden">Anomalies</span>
          <Badge variant="outline" className="ml-2 text-xs">{anomalies.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto flex-grow px-3 sm:px-6">
        {sortedAnomalies.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
            No anomalies detected
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {sortedAnomalies.map((anomaly) => (
              <div 
                key={anomaly.id}
                className={`p-2 sm:p-3 rounded-md cursor-pointer transition-all ${
                  selectedAnomalyId === anomaly.id 
                    ? 'bg-accent border-l-4 border-primary' 
                    : 'hover:bg-secondary'
                }`}
                onClick={() => onAnomalyClick(anomaly)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <div className="font-medium flex items-center text-sm sm:text-base">
                    {anomaly.type === 'price' ? (
                      <TrendingUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <BarChart className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    <span className="hidden sm:inline">{anomaly.type === 'price' ? 'Price' : 'Volume'} Anomaly</span>
                    <span className="sm:hidden">{anomaly.type === 'price' ? 'Price' : 'Volume'}</span>
                  </div>
                  <Badge 
                    variant={
                      anomaly.severity === 'high' 
                        ? 'destructive' 
                        : (anomaly.severity === 'medium' ? 'default' : 'outline')
                    }
                    className="text-xs self-start"
                  >
                    {anomaly.severity}
                  </Badge>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">
                  {formatDate(anomaly.date)}
                </div>
                <div className="text-xs sm:text-sm line-clamp-2">
                  {anomaly.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Score: {anomaly.score.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
