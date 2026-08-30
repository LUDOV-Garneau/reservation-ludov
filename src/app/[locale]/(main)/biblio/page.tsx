import BibliothequeClient from "@/components/docs/BibliothequeClient";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "biblio");
}

export default function TutorialContent() {
  return <BibliothequeClient />;
}
