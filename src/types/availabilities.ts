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

/**
 * Réponse de GET /api/admin/week-availabilities : mêmes structures que
 * l'état local, mais les dates sont des jours calendaires « YYYY-MM-DD ».
 */
export type fetchAvailabilities = {
  availability: Omit<AvailabilityState, "dateRange" | "exceptions"> & {
    dateRange: {
      alwaysApplies: boolean;
      range: { startDate: string | null; endDate: string | null } | null;
    };
    exceptions: {
      enabled: boolean;
      dates: { date: string; timeRange: HourRange }[];
    };
  };
  specificDates: { date: string; timeRange: HourRange }[];
};

export type DateSelection = {
  date: Date;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

export type DatesBlocked = {
  dayOfWeek: number[];
  /** Jour local "YYYY-MM-DD" (renvoyé tel quel par l'API) */
  before: string | null;
  after: string | null;
};
