import { pageMetadata } from "@/lib/metadata";

/**
 * Titre de l'écran atteint depuis le lien du courriel.
 *
 * Une page cliente ne peut pas exporter de métadonnées : Next ne les lit que
 * dans un composant serveur. Ce layout ne sert qu'à porter le titre.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "resetPassword");
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
