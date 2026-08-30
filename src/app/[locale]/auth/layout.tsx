import { pageMetadata } from "@/lib/metadata";

/**
 * Titre de la page de connexion et du parcours d'inscription.
 *
 * Une page cliente ne peut pas exporter de métadonnées : Next ne les lit que
 * dans un composant serveur. Ce layout ne sert qu'à porter le titre.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "auth");
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
