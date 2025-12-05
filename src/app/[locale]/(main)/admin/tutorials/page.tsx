import { TutorialArgs } from "@/types/docs";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import AdminTutorialsClient from "@/components/admin/tutorials/AdminTutorialsClient";

interface TutorialPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TutorialPage({
  searchParams,
}: TutorialPageProps) {
  function toTutorialArg(value: string): TutorialArgs | null {
    return Object.values(TutorialArgs).includes(value as TutorialArgs)
      ? (value as TutorialArgs)
      : null;
  }

  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page as string;
  const pageEnum = toTutorialArg(page ?? "");

  if (!pageEnum) {
    notFound();
  }

  const isAdminRessource = resolvedSearchParams.adminRessources;

  if (isAdminRessource !== "true") {
    notFound();
  }

  const filePath = path.join(
    process.cwd(),
    "src",
    "private",
    "tutoriels",
    `${pageEnum}.md`
  );

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return <AdminTutorialsClient content={content} page={pageEnum} />;
}
