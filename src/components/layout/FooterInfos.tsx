"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import PolitiquesClient from "@/components/politiques/PolitiquesClient";

export default function FooterInfos() {
  const t = useTranslations();
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <>
      <div className="relative z-10 flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">
          <Link href="/">
            <Image
              src="/images/LUDOV-logo-texte.png"
              alt="LUDOV"
              width={1010}
              height={247}
              className="w-[128px] h-auto"
            />
          </Link>
        </h1>
        <div className="flex gap-6">
          <a
            href="https://www.ludov.ca/fr/contact/"
            className="text-black hover:text-[#aaaaaa] transition-all duration-300"
          >
            {t("footer.contact")}
          </a>
          <button
            onClick={() => setPolicyOpen(true)}
            className="text-black hover:text-[#aaaaaa] transition-all duration-300"
          >
            {t("footer.policy")}
          </button>
        </div>
      </div>

      <hr className="mt-4 mb-8" />

      <div className="relative z-10 md:text-center mx-auto">
        <a
          href="https://www.cegepgarneau.ca/programmes/tous-les-programmes/informatique/"
          target="_blank"
          className="opacity-70 hover:opacity-100 transition-all duration-300"
        >
          {t("footer.developedBy")}
        </a>
        <p className="mt-6">{t("footer.copyright")}</p>
      </div>

      <PolitiquesClient open={policyOpen} onOpenChange={setPolicyOpen} />
    </>
  );
}
