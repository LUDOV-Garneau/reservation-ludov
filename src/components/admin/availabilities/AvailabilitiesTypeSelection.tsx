import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface AvailabilitiesTypeSelectionProps {
  selectedCard: string;
  setSelectedCard: (id: string) => void;
}

export default function AvailabilitiesTypeSelection({
  selectedCard,
  setSelectedCard,
}: AvailabilitiesTypeSelectionProps) {
  const t = useTranslations();

  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col md:flex-row gap-4 md:gap-10 text-center md:min-w-[600px] max-w-full">
        <Card
          id="weekly"
          className={`w-full md:flex-1 p-4 hover:cursor-pointer group ${
            selectedCard === "weekly"
              ? "border-[#02dcde]"
              : "hover:border-[#02dcde] transition-colors"
          }`}
          onClick={() => setSelectedCard("weekly")}
        >
          <CardHeader>
            <CardTitle
              className={`${
                selectedCard !== "weekly" &&
                "group-hover:text-[#02dcde] transition-colors"
              }`}
            >
              {t("admin.availabilities.typeSelection.weekly.title")}
            </CardTitle>
            <CardDescription>
              {t("admin.availabilities.typeSelection.weekly.description")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          id="specific-dates"
          className={`w-full md:flex-1 p-4 hover:cursor-pointer group ${
            selectedCard === "specific-dates"
              ? "border-[#02dcde]"
              : "hover:border-[#02dcde] transition-colors"
          }`}
          onClick={() => setSelectedCard("specific-dates")}
        >
          <CardHeader>
            <CardTitle
              className={`${
                selectedCard !== "specific-dates" &&
                "group-hover:text-[#02dcde] transition-colors"
              }`}
            >
              {t("admin.availabilities.typeSelection.specificDates.title")}
            </CardTitle>
            <CardDescription>
              {t(
                "admin.availabilities.typeSelection.specificDates.description"
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
