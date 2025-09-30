"use client";

import Image from "next/image";
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
      className="hover:opacity-70 hover:cursor-pointer flex flex-row items-center justify-center-safe gap-1"
      onClick={switchLocale}
    >
      <Image
        src={locale === "fr" ? "/icons/us-flag.png" : "/icons/fr-flag.png"}
        alt=""
        width={512}
        height={512}
        className="w-4 h-full"
      />
      {t("header.language")}
    </div>
  );
}
