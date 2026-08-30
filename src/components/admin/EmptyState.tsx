import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Icône de la section (Users, Computer, Gamepad2…). */
  icon: LucideIcon;
  title: string;
  /** Optionnel : précise pourquoi la liste est vide (filtres actifs, etc.). */
  description?: string;
  /** Optionnel : action de sortie, typiquement « Effacer les filtres ». */
  action?: React.ReactNode;
}

/**
 * État vide commun aux onglets de l'admin : pastille avec l'icône de la
 * section, puis le titre. La description et l'action sont facultatives — les
 * onglets qui n'en passent pas gardent exactement la présentation d'origine.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
