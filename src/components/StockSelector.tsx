
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvailableStockSymbols } from '@/utils/stockData';

interface StockSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function StockSelector({ value, onChange }: StockSelectorProps) {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<string[]>([]);
  
  // Fetch stock symbols safely
  useEffect(() => {
    try {
      const availableStocks = getAvailableStockSymbols();
      setStocks(availableStocks || []);
    } catch (error) {
      console.error("Error loading stock symbols:", error);
      setStocks([]);
    }
  }, []);

  return (
    <div className="flex items-center space-x-4">
      <div className="font-medium">Stock Symbol:</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[140px] justify-between"
          >
            {value || "Select stock..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[140px] p-0">
          <Command>
            <CommandInput placeholder="Search stocks..." />
            <CommandEmpty>No stock found.</CommandEmpty>
            <CommandGroup>
              {Array.isArray(stocks) && stocks.length > 0 ? (
                stocks.map((stock) => (
                  <CommandItem
                    key={stock}
                    value={stock}
                    onSelect={() => {
                      onChange(stock);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === stock ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {stock}
                  </CommandItem>
                ))
              ) : (
                <CommandItem value="loading" disabled>
                  Loading stocks...
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
