"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Une zone du gabarit, avec ses badges de variables.
 *
 * Cliquer un badge insère la variable **à la position du curseur**, et
 * remplace la sélection s'il y en a une. Les badges ajoutaient auparavant en
 * fin de zone : pour placer `{userName}` au milieu d'un paragraphe, il fallait
 * couper-coller ce que le bouton venait d'ajouter.
 */
export default function TemplateZoneField({
  zone,
  label,
  value,
  variables,
  onChange,
}: {
  zone: string;
  label: string;
  value: string;
  variables: string[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations("admin.emails");
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);

  // Le curseur est replacé APRÈS que React ait committé la nouvelle valeur.
  // Le faire dans un `requestAnimationFrame` depuis le gestionnaire de clic
  // s'exécutait trop tôt : le navigateur remettait ensuite le curseur en fin
  // de zone, et la frappe suivante atterrissait au mauvais endroit.
  useEffect(() => {
    if (caret.current === null || !ref.current) return;
    const position = caret.current;
    caret.current = null;
    ref.current.focus();
    ref.current.setSelectionRange(position, position);
  }, [value]);

  const inserer = (variable: string) => {
    const jeton = `{${variable}}`;
    const champ = ref.current;

    if (!champ) {
      onChange(`${value}${jeton}`);
      return;
    }

    const debut = champ.selectionStart ?? value.length;
    const fin = champ.selectionEnd ?? value.length;
    caret.current = debut + jeton.length;
    onChange(value.slice(0, debut) + jeton + value.slice(fin));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={`zone-${zone}`} className="font-semibold">
          {label}
        </Label>
        {variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {variables.map((variable) => (
              <Badge
                key={variable}
                asChild
                variant="outline"
                className="cursor-pointer font-mono text-[11px] hover:bg-cyan-50 dark:hover:bg-cyan-950"
              >
                {/* Un vrai bouton : le badge cliquable n'etait ni focusable ni
                    actionnable au clavier. */}
                <button
                  type="button"
                  onClick={() => inserer(variable)}
                  title={t("insertVariable", { variable })}
                >
                  {`{${variable}}`}
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Textarea
        id={`zone-${zone}`}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">{t("lineHint")}</p>
    </div>
  );
}
