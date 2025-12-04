import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  const [mode, setMode] = useState<DateFilterMode>(value.mode);

  const handleModeChange = (newMode: DateFilterMode) => {
    setMode(newMode);
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Sélectionner une date';
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
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
      <div className="w-full sm:w-auto">
        <Label htmlFor="filter-mode" className="text-sm font-medium mb-1.5 block">
          Type de filtre
        </Label>
        <Select value={mode} onValueChange={handleModeChange}>
          <SelectTrigger id="filter-mode" className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sélectionner le type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="specific">Date spécifique</SelectItem>
            <SelectItem value="range">Plage de dates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'specific' && (
        <div className="w-full sm:w-auto">
          <Label className="text-sm font-medium mb-1.5 block">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[240px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formatDate(value.specificDate)}
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
        </div>
      )}

      {mode === 'range' && (
        <>
          <div className="w-full sm:w-auto">
            <Label className="text-sm font-medium mb-1.5 block">
              Date de début
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-[200px] justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(value.startDate)}
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
          </div>

          <div className="w-full sm:w-auto">
            <Label className="text-sm font-medium mb-1.5 block">
              Date de fin
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-[200px] justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(value.endDate)}
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
          </div>
        </>
      )}

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="mt-0 sm:mt-0 self-end"
          title="Effacer le filtre"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}