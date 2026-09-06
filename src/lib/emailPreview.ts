import {
  findUnknownVariables,
  renderZoneText,
  TEMPLATE_VARIABLES,
  TEMPLATE_ZONES,
  zoneToParagraphs,
  type EmailTemplateKey,
} from "@/lib/emailTemplateShapes";

/**
 * Prévisualisation d'un gabarit de courriel.
 *
 * Module pur, réutilisant le MÊME moteur que l'envoi (`renderZoneText`,
 * `zoneToParagraphs`) : sans cela la prévisualisation montrerait une
 * approximation, ce qui serait pire que pas de prévisualisation du tout.
 *
 * Jusqu'ici le seul moyen de voir un gabarit était de s'envoyer un courriel de
 * test — et ce bouton exige d'avoir enregistré, donc de publier en production
 * ce qu'on voulait justement relire avant.
 */

/**
 * Valeurs d'exemple, une par variable connue. Volontairement reconnaissables :
 * une date d'exemple ne doit pas pouvoir être confondue avec une vraie.
 */
export const SAMPLE_VARIABLES: Record<string, string> = {
  userName: "Camille Tremblay",
  reservationId: "a1b2c3d4",
  date: "2026-09-15",
  time: "14:00",
  consoleName: "Nintendo 64",
  reason: "La station est en réparation.",
  expiresInMinutes: "30",
  otpCode: "482913",
};

export type EmailPreview = {
  subject: string;
  zones: { zone: string; html: string }[];
  /** Variables écrites dans le gabarit mais inconnues pour cette clé. */
  unknownVariables: string[];
  /** Variables disponibles et jamais utilisées : souvent un oubli. */
  unusedVariables: string[];
};

function valeursExemple(key: EmailTemplateKey): Record<string, string> {
  const valeurs: Record<string, string> = {};
  for (const variable of TEMPLATE_VARIABLES[key]) {
    // Repli sur le nom : une variable ajoutée à `TEMPLATE_VARIABLES` sans
    // exemple reste visible au lieu de disparaître silencieusement.
    valeurs[variable] = SAMPLE_VARIABLES[variable] ?? `{${variable}}`;
  }
  return valeurs;
}

/** Variables réellement écrites dans le sujet ou les zones. */
export function usedVariables(content: {
  subject: string;
  zones: Record<string, string>;
}): string[] {
  const utilisees = new Set<string>();
  for (const texte of [content.subject, ...Object.values(content.zones)]) {
    for (const found of texte.matchAll(/\{(\w+)\}/g)) utilisees.add(found[1]);
  }
  return [...utilisees];
}

export function buildEmailPreview(
  key: EmailTemplateKey,
  content: { subject: string; zones: Record<string, string> },
): EmailPreview {
  const valeurs = valeursExemple(key);
  const utilisees = new Set(usedVariables(content));

  return {
    subject: renderZoneText(content.subject, valeurs),
    zones: TEMPLATE_ZONES[key].map((zone) => ({
      zone,
      // Le texte de zone n'est délibérément pas échappé : le serveur ne
      // l'échappe pas non plus, ce qui laisse l'admin écrire un <strong>.
      // La prévisualisation doit montrer le même résultat, pas un plus sage.
      html: zoneToParagraphs(renderZoneText(content.zones[zone] ?? "", valeurs)),
    })),
    unknownVariables: findUnknownVariables(key, {
      subject: content.subject,
      zones: content.zones,
    }),
    unusedVariables: TEMPLATE_VARIABLES[key].filter((v) => !utilisees.has(v)),
  };
}
