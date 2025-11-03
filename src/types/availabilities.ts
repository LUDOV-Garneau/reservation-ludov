export type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

export type WeekDay = {
  label: string;
  enabled: boolean;
  hoursRanges: HourRange[];
};

export type Exception = {
  date: Date;
  timeRange: HourRange;
};

export type AvailabilityState = {
  weekly: Record<string, WeekDay>;
  dateRange: {
    alwaysApplies: boolean;
    range: { startDate: Date | null; endDate: Date | null } | null;
  };
  exceptions: { enabled: boolean; dates: Exception[] };
};

export type fetchAvailabilities = {
  availability: AvailabilityState;
  specificDates: Exception[];
};

export type DateSelection = {
  date: Date;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
