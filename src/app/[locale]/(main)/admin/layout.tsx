import { pageMetadata } from "@/lib/metadata";

/**
 * Titre du tableau de bord d'administration. Les sous-sections qui exportent leur propre titre le remplacent.
 *
 * Une page cliente ne peut pas exporter de métadonnées : Next ne les lit que
 * dans un composant serveur. Ce layout ne sert qu'à porter le titre.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "admin");
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
