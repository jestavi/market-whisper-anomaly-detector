
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimeRange } from '@/types';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  onPresetSelected?: (preset: TimeRange) => void;
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  className,
  onPresetSelected,
}: DateRangeSelectorProps) {
  const presets: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'MAX'];

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4", className)}>
      <div className="flex flex-wrap gap-1 bg-secondary rounded-md p-1 w-full sm:w-auto">
        {presets.map((preset) => (
          <Button 
            key={preset} 
            variant="ghost" 
            size="sm" 
            onClick={() => onPresetSelected?.(preset)}
            className="text-xs px-2 py-1 h-auto flex-1 sm:flex-auto min-w-0"
          >
            {preset}
          </Button>
        ))}
      </div>

      <div className="flex items-center w-full sm:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal w-full sm:w-auto text-xs sm:text-sm",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <>
                    <span className="hidden sm:inline">Pick a date range</span>
                    <span className="sm:hidden">Date range</span>
                  </>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
