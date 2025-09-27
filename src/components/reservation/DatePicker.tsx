import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";

type DatePickerProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
};

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  return (
    <Calendar
      mode="single"
      locale={fr}
      defaultMonth={selected}
      selected={selected}
      onSelect={onSelect}
      disabled={{
        before: new Date(),
      }}
      className="rounded-lg border shadow-sm"
    />
  );
}
