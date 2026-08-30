import { Suspense } from "react";
import DocsClient from "@/components/docs/DocsClient";
import { pageMetadata } from "@/lib/metadata";

interface TutorialPageProps {
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "docs");
}

export default function TutorialPage({ children }: TutorialPageProps) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocsClient>{children}</DocsClient>
    </Suspense>
  );
}
