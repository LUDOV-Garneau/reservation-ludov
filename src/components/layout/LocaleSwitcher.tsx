"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  function switchLocale() {
    const newLocale = locale === "fr" ? "en" : "fr";

    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/") || "/";
    console.log(segments);

    router.push(newPath);
  }

  return (
    <div
      className="hover:underline hover:cursor-pointer"
      onClick={switchLocale}
    >
      {t("header.language")}
    </div>
  );
}
