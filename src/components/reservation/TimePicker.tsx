import { Button } from "@/components/ui/button";

type TimePickerProps = {
  selectedTime: string;
  onSelect: (time: string) => void;
  times?: string[];
};

const defaultTimes = [
  "08:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

export function TimePicker({
  selectedTime,
  onSelect,
  times = defaultTimes,
}: TimePickerProps) {
  return (
    <div className="grid grid-flow-col gap-2 justify-center grid-rows-[repeat(7,auto)]">
      {times.map((time) => (
        <Button
          key={time}
          variant={selectedTime === time ? "default" : "outline"}
          className="w-full px-8"
          onClick={() => onSelect(time)}
        >
          {time}
        </Button>
      ))}
    </div>
  );
}
