"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import ImageUploadField from "@/components/admin/ImageUploadField";
import GameArtworkSearch from "@/components/admin/games/GameArtworkSearch";
import { displayConsole, type GameRow } from "@/components/admin/games/types";

type Props = {
  /** Jeu en cours d'édition ; null ferme le dialogue. */
  game: GameRow | null;
  onClose: () => void;
  onUploaded: (game: GameRow, path: string) => void;
  onRemove: (game: GameRow) => Promise<void>;
};

/**
 * Édition de l'image d'un jeu : rappel du jeu concerné, image enregistrée avec
 * son retrait, puis trois façons d'en fournir une — recherche dans les bases de
 * jeux, dépôt de fichier, lien direct.
 *
 * L'image affichée en haut vient de `game.picture`, c'est-à-dire de ce qui est
 * réellement enregistré. L'aperçu interne du champ de téléversement est
 * désactivé pour qu'aucune image rejetée par l'enregistrement ne s'affiche.
 */
export default function GameImageDialog({
  game,
  onClose,
  onUploaded,
  onRemove,
}: Props) {
  const t = useTranslations("admin.gamesImages");
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Ni la confirmation ni l'onglet actif ne doivent survivre au passage à un
  // autre jeu : le dialogue se rouvrirait dans l'état du précédent.
  useEffect(() => {
    setConfirmingRemoval(false);
    setIsRemoving(false);
  }, [game?.id]);

  const handleRemove = async () => {
    if (!game || isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemove(game);
    } finally {
      setIsRemoving(false);
      setConfirmingRemoval(false);
    }
  };

  return (
    <Dialog
      open={game !== null}
      onOpenChange={(open) => !open && !isRemoving && onClose()}
    >
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="line-clamp-2 pr-6">{game?.titre}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2">
              <span>{game ? displayConsole(game) : ""}</span>
              <span aria-hidden>·</span>
              {game?.picture ? (
                <Badge className="bg-green-100 text-green-800 border-0">
                  {t("status.withImage")}
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-0">
                  {t("status.withoutImage")}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {game && (
          <div className="space-y-5">
            {game.picture ? (
              <div className="flex items-start gap-4 rounded-lg border bg-muted/20 p-3">
                <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted/40">
                  <Image
                    src={game.picture}
                    alt={game.titre}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium">{t("dialog.current")}</p>
                  {confirmingRemoval ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-700">
                        {t("dialog.removeConfirm")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRemove}
                          disabled={isRemoving}
                          className="gap-2 bg-red-600 text-white hover:bg-red-700"
                        >
                          {isRemoving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {t("dialog.removeConfirmYes")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmingRemoval(false)}
                          disabled={isRemoving}
                        >
                          {t("dialog.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmingRemoval(true)}
                      className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("dialog.remove")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-sm text-amber-800">
                <ImageIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                {t("dialog.noImageYet")}
              </div>
            )}

            {/* `key` sur le jeu : changer de jeu doit repartir d'une recherche
                pré-remplie avec le nouveau titre, pas garder l'ancienne. */}
            <Tabs defaultValue="search" key={game.id}>
              <TabsList className="w-full">
                <TabsTrigger value="search" className="flex-1">
                  {t("dialog.tabSearch")}
                </TabsTrigger>
                <TabsTrigger value="file" className="flex-1">
                  {t("dialog.tabFile")}
                </TabsTrigger>
                <TabsTrigger value="link" className="flex-1">
                  {t("dialog.tabLink")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="mt-4">
                <GameArtworkSearch
                  initialQuery={game.titre}
                  disabled={isRemoving}
                  onPicked={(path) => onUploaded(game, path)}
                />
              </TabsContent>

              <TabsContent value="file" className="mt-4">
                <ImageUploadField
                  category="games"
                  showPreview={false}
                  disabled={isRemoving}
                  onUploaded={(path) => onUploaded(game, path)}
                />
              </TabsContent>

              <TabsContent value="link" className="mt-4">
                <ImageUploadField
                  category="games"
                  allowUrlImport
                  showDropzone={false}
                  showPreview={false}
                  disabled={isRemoving}
                  onUploaded={(path) => onUploaded(game, path)}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRemoving}
          >
            {t("dialog.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
