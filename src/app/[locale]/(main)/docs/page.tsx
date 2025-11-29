import { Suspense } from "react";
import DocsClient from "@/components/docs/DocsClient";

interface TutorialPageProps {
  children: React.ReactNode;
}

export default function TutorialPage({ children }: TutorialPageProps) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DocsClient>{children}</DocsClient>
    </Suspense>
  );
}
