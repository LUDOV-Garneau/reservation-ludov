import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PolicyContentView from "@/components/politiques/PolicyContentView";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "policy");
}

export default async function PolitiqueUtilisationPage() {
  const t = await getTranslations("politique");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="mb-6 flex items-center gap-1 text-gray-600 hover:text-cyan-500 transition-colors w-fit group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">{t("backHome")}</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-lg px-6 sm:px-10 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          {t("usageTitle")}
        </h1>
        <PolicyContentView type="usage" />
      </div>
    </div>
  );
}
