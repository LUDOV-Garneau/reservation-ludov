import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AvailabilitiesTypeSelectionProps {
  selectedCard: string;
  setSelectedCard: (id: string) => void;
}

export default function AvailabilitiesTypeSelection({
  selectedCard,
  setSelectedCard,
}: AvailabilitiesTypeSelectionProps) {
  return (
    <div className="flex gap-10 text-center">
      <Card
        id="weekly"
        className={`min-w-[300px] p-4 hover:cursor-pointer group ${
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
            Par semaine
          </CardTitle>
          <CardDescription>
            Ajoutez des disponibilités récurrentes à chaque semaine.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card
        id="specific-dates"
        className={`min-w-[300px] p-4 hover:cursor-pointer group ${
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
            Dates spécifiques
          </CardTitle>
          <CardDescription>
            Ajoutez des disponibilités spécifiques.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
