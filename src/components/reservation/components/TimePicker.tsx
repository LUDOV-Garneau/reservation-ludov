import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

type TimePickerProps = {
  selectedTime: string;
  onSelect: (time: string) => void;
  times: string[];
};

export function TimePicker({ selectedTime, onSelect, times }: TimePickerProps) {
  const formatTime = (time: string): string => {
    return time.slice(0, 5);
  };

  if (times.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Aucune plage horaire disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-4">
        {times.length} plage{times.length > 1 ? "s" : ""} disponible{times.length > 1 ? "s" : ""} (2h de jeu)
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
        {times.map((time) => {
          const isSelected = selectedTime === time;
          return (
            <Button
              key={time}
              variant={isSelected ? "default" : "outline"}
              className={`
                h-14 text-base font-semibold transition-all
                ${isSelected 
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md scale-105" 
                  : "hover:border-cyan-400 hover:bg-cyan-50"
                }
              `}
              onClick={() => onSelect(time)}
            >
              <Clock className="mr-2 h-4 w-4" />
              {formatTime(time)}
            </Button>
          );
        })}
      </div>

      {selectedTime && (
        <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <p className="text-sm text-cyan-900">
            <span className="font-semibold">Durée :</span> 2 heures
            <span className="mx-2">•</span>
            <span className="font-semibold">Fin :</span> {formatTime(addTwoHours(selectedTime))}
          </p>
        </div>
      )}
    </div>
  );
}

function addTwoHours(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + 120;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}:00`;
}