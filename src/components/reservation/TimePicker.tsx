import { Button } from "@/components/ui/button";

type TimePickerProps = {
  selectedTime: string;
  onSelect: (time: string) => void;
  times: string[];
};

export function TimePicker({ selectedTime, onSelect, times }: TimePickerProps) {
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
