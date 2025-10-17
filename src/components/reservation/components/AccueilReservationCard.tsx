import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock9, Monitor } from "lucide-react";

interface AccueilReservationCardProps {
  games: string[];
  console: string;
  date: string;
  heure: string;
  onDetailsClick?: () => void;
}

export default function AccueilReservationCard({
  games,
  console: consoleType,
  date,
  heure,
  onDetailsClick,
}: AccueilReservationCardProps) {
  return (
    <Card className="w-full max-w-sm bg-gray-200">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">

        <h3 className="font-semibold text-lg flex flex-col items-center space-y-1 text-center">
          {games.map((game, index) => (
            <span key={index} className="flex items-center justify-center">
              <span className="text-cyan-500 mr-2">•</span>
              <span>{game}</span>
            </span>
          ))}
        </h3>

        <div className="flex items-start gap-3">
          <Monitor className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">
              {consoleType}
            </h3>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap md:mr-auto lg:mr-8">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              {date}
            </span>
            <span className="text-gray-400">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock9 className="h-4 w-4 flex-shrink-0" />
              {heure}
            </span>
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full text-cyan-500 border-cyan-500 hover:bg-cyan-500 hover:text-white"
          onClick={onDetailsClick}
        >
          Détails
        </Button>
      </CardContent>
    </Card>
  );
}
