import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Icône de la section (Users, Computer, Gamepad2…). */
  icon: LucideIcon;
  title: string;
}

/**
 * État vide commun aux onglets de l'admin : pastille grise avec l'icône de la
 * section, puis le titre. Pas de description (voir les onglets Stations et
 * Réservations, dont ce composant reprend exactement la présentation).
 */
export default function EmptyState({ icon: Icon, title }: EmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        {title}
      </h3>
    </div>
  );
}
