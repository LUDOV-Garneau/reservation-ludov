"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Coquille commune aux pages « pleine page » : une carte blanche posée sur le
 * fond gris, avec le lien de retour en haut.
 *
 * C'est la présentation de /admin ; l'accueil et les pages de détail de
 * réservation la réutilisent pour que les marges, les coins, la bordure et la
 * position du retour soient identiques partout.
 */
export function PageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-2 my-4 sm:mx-10 sm:my-6">
      <div
        className={`flex flex-col bg-[white] min-h-screen px-4 py-6 sm:px-10 sm:py-8 rounded-xl border border-gray-200 w-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

type BackLinkProps = {
  /** Destination du retour ; sans valeur, `onClick` doit être fourni. */
  href?: string;
  onClick?: () => void;
  label: string;
};

/** Retour en haut de page, identique sur /admin et les pages de détail. */
export function BackLink({ href, onClick, label }: BackLinkProps) {
  const className =
    "mb-6 flex items-center gap-1 text-gray-600 hover:text-cyan-500 transition-colors w-fit group";
  const content = (
    <>
      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
