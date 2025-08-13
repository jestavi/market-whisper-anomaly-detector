import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WatchlistManagerProps {
  watchlist: string[];
  onAddStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  stockSectors: Record<string, string>;
}

// Popular stocks by sector for quick adding
const popularStocks = {
  Technology: ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META', 'AMZN', 'CRM', 'ADBE'],
  Finance: ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA'],
  Healthcare: ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'BMY', 'LLY', 'TMO'],
  Energy: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO'],
  Automotive: ['TSLA', 'F', 'GM', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI'],
  'E-commerce': ['AMZN', 'SHOP', 'EBAY', 'ETSY', 'BABA', 'JD', 'MELI', 'SE']
};

export const WatchlistManager = ({ watchlist, onAddStock, onRemoveStock, stockSectors }: WatchlistManagerProps) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleAddStock = () => {
    if (newSymbol.trim()) {
      const symbol = newSymbol.trim().toUpperCase();
      if (watchlist.includes(symbol)) {
        toast({
          title: "Already Added",
          description: `${symbol} is already in your watchlist`,
          variant: "destructive",
        });
        return;
      }
      onAddStock(symbol);
      setNewSymbol('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddStock();
    }
  };

  // Filter popular stocks based on search
  const filteredPopularStocks = Object.entries(popularStocks).reduce((acc, [sector, stocks]) => {
    const filtered = stocks.filter(stock => 
      stock.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !watchlist.includes(stock)
    );
    if (filtered.length > 0) {
      acc[sector] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Group watchlist by sector
  const watchlistBySector = watchlist.reduce((acc, stock) => {
    const sector = stockSectors[stock] || 'Other';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(stock);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      {/* Add New Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Add Stock to Watchlist</CardTitle>
          <CardDescription>
            Enter a stock symbol to add it to your portfolio monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyPress={handleKeyPress}
              className="uppercase"
            />
            <Button onClick={handleAddStock} disabled={!newSymbol.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle>Current Watchlist ({watchlist.length} stocks)</CardTitle>
          <CardDescription>
            Stocks currently being monitored for anomalies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {watchlist.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No stocks in watchlist. Add some stocks to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(watchlistBySector).map(([sector, stocks]) => (
                <div key={sector}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">{sector}</h4>
                  <div className="flex flex-wrap gap-2">
                    {stocks.map((stock) => (
                      <Badge key={stock} variant="secondary" className="px-3 py-1">
                        {stock}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2 hover:bg-transparent"
                          onClick={() => onRemoveStock(stock)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Stocks */}
      <Card>
        <CardHeader>
          <CardTitle>Add Popular Stocks</CardTitle>
          <CardDescription>
            Quick add popular stocks from different sectors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search popular stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {Object.keys(filteredPopularStocks).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {searchTerm ? 'No stocks found matching your search.' : 'All popular stocks are already in your watchlist.'}
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredPopularStocks).map(([sector, stocks]) => (
                <div key={sector}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">{sector}</h4>
                  <div className="flex flex-wrap gap-2">
                    {stocks.map((stock) => (
                      <Button
                        key={stock}
                        variant="outline"
                        size="sm"
                        onClick={() => onAddStock(stock)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {stock}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};