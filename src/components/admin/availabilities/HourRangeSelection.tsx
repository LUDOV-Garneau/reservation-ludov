"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Plus, Trash2 } from "lucide-react";

interface HourRangeSelectionProps {
  startH: string;
  startM: string;
  endH: string;
  endM: string;
  showRemoveButton: boolean;
  showAddButton: boolean;
  invalid?: boolean;
  addRow: () => void;
  removeRow: () => void;
  onModify: (updatedRange: {
    startHour: string;
    startMinute: string;
    endHour: string;
    endMinute: string;
  }) => void;
}

const HEURES = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);

/**
 * Minutes au pas de 5. Le menu en proposait soixante, ce qui demandait de
 * faire défiler une liste entière pour choisir « 30 ». Une valeur existante
 * hors pas (issue d'une ancienne saisie) est réinjectée pour ne pas être
 * perdue au premier changement d'heure.
 */
function minutesProposees(courante: string): string[] {
  const pas = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
  return pas.includes(courante)
    ? pas
    : [...pas, courante].sort((a, b) => Number(a) - Number(b));
}

/** Déclencheur sans bordure : les quatre listes forment UN champ, pas quatre. */
const TRIGGER =
  "h-9 w-auto min-w-0 gap-1 border-0 bg-transparent px-2 text-sm tabular-nums shadow-none focus:ring-0 focus-visible:ring-0";

export default function HourRangeSelection({
  startH,
  startM,
  endH,
  endM,
  addRow,
  removeRow,
  showRemoveButton,
  showAddButton,
  invalid = false,
  onModify,
}: HourRangeSelectionProps) {
  const t = useTranslations("admin.availabilities.actions");

  // Composant contrôlé : les valeurs viennent du parent. L'ancienne copie
  // locale, resynchronisée par quatre `useEffect`, ne servait qu'à se
  // désynchroniser.
  const modifier = (champ: string, valeur: string) =>
    onModify({
      startHour: champ === "startHour" ? valeur : startH,
      startMinute: champ === "startMinute" ? valeur : startM,
      endHour: champ === "endHour" ? valeur : endH,
      endMinute: champ === "endMinute" ? valeur : endM,
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`inline-flex items-center rounded-md border bg-background ${
          invalid ? "border-destructive" : ""
        }`}
      >
        <Select
          value={startH}
          onValueChange={(v) => modifier("startHour", v)}
        >
          <SelectTrigger className={TRIGGER} aria-label={t("startHour")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEURES.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select
          value={startM}
          onValueChange={(v) => modifier("startMinute", v)}
        >
          <SelectTrigger className={TRIGGER} aria-label={t("startMinute")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutesProposees(startM).map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="px-1 text-muted-foreground">–</span>

        <Select value={endH} onValueChange={(v) => modifier("endHour", v)}>
          <SelectTrigger className={TRIGGER} aria-label={t("endHour")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEURES.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={endM} onValueChange={(v) => modifier("endMinute", v)}>
          <SelectTrigger className={TRIGGER} aria-label={t("endMinute")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutesProposees(endM).map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showRemoveButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={removeRow}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-1">{t("remove")}</span>
        </Button>
      )}
      {showAddButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950"
          onClick={addRow}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-1">{t("add")}</span>
        </Button>
      )}
    </div>
  );
}
