import { TutorialArgs } from "@/types/docs";
import { notFound } from "next/navigation";
import db from "@/db";
import { docs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import AdminTutorialsClient from "@/components/admin/tutorials/AdminTutorialsClient";
import { pageMetadata } from "@/lib/metadata";

interface TutorialPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "adminTutorials");
}

export default async function TutorialPage({
  params,
  searchParams,
}: TutorialPageProps) {
  function toTutorialArg(value: string): TutorialArgs | null {
    return Object.values(TutorialArgs).includes(value as TutorialArgs)
      ? (value as TutorialArgs)
      : null;
  }

  const resolvedSearchParams = await searchParams;
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "fr";
  const page = resolvedSearchParams.page as string;
  const pageEnum = toTutorialArg(page ?? "");

  if (!pageEnum) {
    notFound();
  }

  const isAdminRessource = resolvedSearchParams.adminRessources;

  if (isAdminRessource !== "true") {
    notFound();
  }

  // Documentation stockée en BD (éditable dans l'admin), repli fr si la
  // variante dans la langue courante n'existe pas encore.
  const row =
    (await db.query.docs.findFirst({
      where: and(eq(docs.slug, pageEnum), eq(docs.locale, locale)),
    })) ??
    (locale !== "fr"
      ? await db.query.docs.findFirst({
          where: and(eq(docs.slug, pageEnum), eq(docs.locale, "fr")),
        })
      : null);

  if (!row) {
    notFound();
  }

  return <AdminTutorialsClient content={row.content} page={pageEnum} />;
}
