import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

  return (
    <Card className="w-full max-w-sm bg-gradient-to-br from-white to-gray-50 border-gray-200 overflow-hidden group h-full">
      <div></div>

      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="p-2 bg-cyan-50 rounded-lg">
            <Monitor className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 tracking-wide font-medium">
              {t("reservation.accueil.console")}
            </p>
            <h3 className="font-bold text-gray-900">{consoleType}</h3>
          </div>
        </div>

        <div className="flex-grow mb-4">
          <p className="text-xs text-gray-500 tracking-wide font-medium mb-2">
            {t("reservation.accueil.games")}
          </p>
          <div className="space-y-2">
            {games.map((game, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-800">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 flex-shrink-0"></div>
                <span className="text-sm font-medium">{game}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("reservation.accueil.date")}</p>
              <p className="text-sm font-semibold text-gray-800">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t("reservation.accueil.time")}</p>
              <p className="text-sm font-semibold text-gray-800">{heure}</p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full text-cyan-500 border-cyan-500 hover:bg-cyan-500 hover:text-white mt-auto"
          onClick={onDetailsClick}
        >
          {t("reservation.accueil.detailsButton")}
        </Button>
      </CardContent>
    </Card>
  );
}