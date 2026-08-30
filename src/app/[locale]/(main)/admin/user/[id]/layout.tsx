import { pageMetadata } from "@/lib/metadata";

/**
 * Titre de la fiche d'un utilisateur.
 *
 * Une page cliente ne peut pas exporter de métadonnées : Next ne les lit que
 * dans un composant serveur. Ce layout ne sert qu'à porter le titre.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  return pageMetadata(params, "adminUser");
}

export default function AdminUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
