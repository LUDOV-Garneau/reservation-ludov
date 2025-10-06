import { Calendar } from "@/components/ui/calendar";
import { frCA, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

type DatePickerProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
};

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const locale = useLocale();

  return (
    <Calendar
      mode="single"
      locale={locale === "fr" ? frCA : enUS}
      defaultMonth={selected}
      selected={selected}
      onSelect={onSelect}
      disabled={{
        before: new Date(),
      }}
      className="rounded-lg border shadow-sm text-lg p-4 sm:[&_button]:h-12 sm:[&_button]:w-12 sm:[&_button]:text-lg"
    />
  );
}
