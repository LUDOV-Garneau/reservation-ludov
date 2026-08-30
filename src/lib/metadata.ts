import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** Nom du site, ajouté à chaque titre par le gabarit du layout racine. */
export const SITE_NAME = "LUDOV";

/**
 * Clés de l'espace de noms `metadata` des fichiers de traduction.
 * L'union plutôt qu'un `string` : une clé mal orthographiée casse la
 * compilation au lieu de produire un titre vide dans l'onglet.
 */
export type PageMetadataKey =
  | "home"
  | "auth"
  | "resetPassword"
  | "reservation"
  | "reservationDetails"
  | "reservationSuccess"
  | "biblio"
  | "docs"
  | "policy"
  | "admin"
  | "adminTutorials"
  | "adminUser"
  | "adminReservationDetails";

/**
 * Métadonnées d'une page, traduites dans la langue du segment `[locale]`.
 *
 * Le titre est `absolute` : un layout intermédiaire qui pose son propre titre
 * — celui de `/auth` au-dessus de `/auth/reset-password`, par exemple — coupe
 * la chaîne des gabarits, et la page enfant perdrait le suffixe du site. En
 * composant le titre complet ici, chaque page porte le même format quelle que
 * soit sa profondeur.
 */
export async function pageMetadata(
  params: Promise<{ locale: string }>,
  key: PageMetadataKey,
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: { absolute: `${t(key)} · ${SITE_NAME}` },
    description: t("description"),
  };
}
