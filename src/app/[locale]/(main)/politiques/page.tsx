"use client";

import { useTranslations } from "next-intl";

export default function PrivacyPolicyPage() {
    const t = useTranslations();

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">{t("privacy.title")}</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line leading-relaxed text-lg">
                    {t("privacy.content")}
                </p>
            </div>
        </div>
    );
}
