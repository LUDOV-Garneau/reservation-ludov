"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import ImageUploadField from "@/components/admin/ImageUploadField";
import type { GameRow } from "@/components/admin/games/types";

type Props = {
  /** Jeu en cours d'édition ; null ferme le dialogue. */
  game: GameRow | null;
  onClose: () => void;
  onUploaded: (game: GameRow, path: string) => void;
};

/**
 * Dialogue d'import de l'image d'un jeu : dépôt de fichier ou import serveur
 * depuis un lien IGDB/MobyGames.
 */
export default function GameImageDialog({ game, onClose, onUploaded }: Props) {
  const t = useTranslations("admin.gamesImages");

  return (
    <Dialog open={game !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">
            {t("importDialogTitle", { title: game?.titre ?? "" })}
          </DialogTitle>
        </DialogHeader>
        {game && (
          <ImageUploadField
            category="games"
            currentImage={game.picture}
            allowUrlImport
            onUploaded={(path) => onUploaded(game, path)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
