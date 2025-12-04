import React from 'react';
import { Calendar, Funnel, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DateFilterMode = 'specific' | 'range';

type DateFilterValue = {
  mode: DateFilterMode;
  specificDate?: Date;
  startDate?: Date;
  endDate?: Date;
};

type DateFilterProps = {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  onClear: () => void;
};

export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export default function DateFilter({ value, onChange, onClear }: DateFilterProps) {
  const handleModeChange = (newMode: DateFilterMode) => {
    onChange({
      mode: newMode,
      specificDate: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleSpecificDateChange = (date: Date | undefined) => {
    onChange({
      ...value,
      mode: 'specific',
      specificDate: date,
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    onChange({
      ...value,
      mode: 'range',
      startDate: date,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onChange({
      ...value,
      mode: 'range',
      endDate: date,
    });
  };

  const formatDate = (date: Date | undefined, placeholder: string) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const hasActiveFilter =
    (value.mode === 'specific' && value.specificDate) ||
    (value.mode === 'range' && (value.startDate || value.endDate));

  return (
    <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
      <div className="flex items-center gap-2 w-full lg:w-auto">
        <Funnel className="h-5 w-5 text-cyan-500 flex-shrink-0" />

        <Select value={value.mode} onValueChange={handleModeChange}>
          <SelectTrigger className="w-full md:w-[180px] show-svg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="specific">Date spécifique</SelectItem>
            <SelectItem value="range">Plage de dates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
        {value.mode === 'specific' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-[240px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4 text-cyan-500" />
                {formatDate(value.specificDate, 'Sélectionner une date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={value.specificDate}
                onSelect={handleSpecificDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {value.mode === 'range' && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-[200px] justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4 text-cyan-500" />
                  {formatDate(value.startDate, 'Date de début')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={value.startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-[200px] justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4 text-cyan-500" />
                  {formatDate(value.endDate, 'Date de fin')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={value.endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                  disabled={(date) =>
                    value.startDate ? date < value.startDate : false
                  }
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            title="Effacer le filtre"
            className="self-start md:self-center"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}