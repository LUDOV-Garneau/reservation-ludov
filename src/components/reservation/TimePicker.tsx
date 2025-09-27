import { Button } from "@/components/ui/button";

type TimePickerProps = {
  selectedTime: string;
  onSelect: (time: string) => void;
  times?: string[];
};

const defaultTimes = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
];

export function TimePicker({
  selectedTime,
  onSelect,
  times = defaultTimes,
}: TimePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {times.map((time) => (
        <Button
          key={time}
          variant={selectedTime === time ? "default" : "outline"}
          className="w-full"
          onClick={() => onSelect(time)}
        >
          {time}
        </Button>
      ))}
    </div>
  );
}
