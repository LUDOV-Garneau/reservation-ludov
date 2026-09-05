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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Gamepad2,
  ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Save,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import ImageUploadField from "@/components/admin/ImageUploadField";
import {
  BookableBadge,
  PhotoBadge,
} from "@/components/admin/platforms/PlatformBadges";
import { isBookable } from "@/components/admin/platforms/platformsLogic";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/platformUpdate";
import type { PlatformRow } from "@/components/admin/platforms/types";

type Props = {
  /** Plateforme en cours d'édition ; null ferme le dialogue. */
  platform: PlatformRow | null;
  onClose: () => void;
  onPictureChange: (
    platform: PlatformRow,
    picture: string | null,
  ) => Promise<void>;
  onDescriptionChange: (
    platform: PlatformRow,
    description: string | null,
  ) => Promise<void>;
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Monitor;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-cyan-500" />
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/**
 * Fiche d'une plateforme : ce que l'admin peut changer (description, photo) et
 * ce qu'il ne peut que constater (nom, exemplaires, stations, jeux).
 *
 * Le nom est affiché verrouillé plutôt que masqué : sans cela, un admin qui
 * cherche à le corriger croit à un oubli de l'interface. La photo affichée
 * vient de `platform.picture`, donc de ce qui est réellement enregistré —
 * l'aperçu interne du champ de téléversement est désactivé pour qu'aucune
 * image rejetée par l'enregistrement ne s'affiche.
 */
export default function PlatformDialog({
  platform,
  onClose,
  onPictureChange,
  onDescriptionChange,
}: Props) {
  const t = useTranslations("admin.platforms");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Rien de l'édition précédente ne doit survivre au passage à une autre
  // plateforme : le dialogue se rouvrirait dans l'état de la précédente.
  useEffect(() => {
    setDescription(platform?.description ?? "");
    setConfirmingRemoval(false);
    setIsSaving(false);
    setIsRemoving(false);
  }, [platform?.id, platform?.description]);

  const busy = isSaving || isRemoving;
  const trimmed = description.trim();
  const isDirty = trimmed !== (platform?.description ?? "");
  const isTooLong = trimmed.length > MAX_DESCRIPTION_LENGTH;

  const handleSaveDescription = async () => {
    if (!platform || busy || !isDirty || isTooLong) return;
    setIsSaving(true);
    try {
      await onDescriptionChange(platform, trimmed === "" ? null : trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!platform || busy) return;
    setIsRemoving(true);
    try {
      await onPictureChange(platform, null);
    } finally {
      setIsRemoving(false);
      setConfirmingRemoval(false);
    }
  };

  return (
    <Dialog
      open={platform !== null}
      onOpenChange={(open) => !open && !busy && onClose()}
    >
      {/* `text-foreground` : le DialogContent partagé ne pose que
          `bg-background`, si bien qu'en thème sombre son contenu hérite de la
          couleur de texte claire du document et devient illisible. */}
      <DialogContent className="max-h-[90vh] overflow-y-auto text-foreground sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <Monitor className="h-5 w-5 shrink-0 text-cyan-500" />
            <span className="line-clamp-2">{platform?.name}</span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs">
                <Lock className="h-3 w-3" />
                {t("dialog.nameLocked")}
              </span>
              {platform && (
                <>
                  <PhotoBadge platform={platform} />
                  <BookableBadge platform={platform} />
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {platform && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Metric
                icon={Monitor}
                label={t("dialog.units")}
                value={t("card.units", {
                  active: platform.unitsActive,
                  total: platform.unitsTotal,
                })}
              />
              <Metric
                icon={MapPin}
                label={t("dialog.stations")}
                value={String(platform.stationsCount)}
              />
              <Metric
                icon={Gamepad2}
                label={t("dialog.games")}
                value={String(platform.gamesCount)}
              />
            </div>

            {!isBookable(platform) && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                <p>{t("dialog.unbookableWarning")}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="platform-description">
                {t("dialog.descriptionLabel")}
              </Label>
              <Textarea
                id="platform-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("dialog.descriptionPlaceholder")}
                disabled={busy}
                rows={4}
                aria-describedby="platform-description-count"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  id="platform-description-count"
                  className={
                    isTooLong
                      ? "text-xs font-medium text-rose-600"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {t("dialog.descriptionCount", {
                    count: trimmed.length,
                    max: MAX_DESCRIPTION_LENGTH,
                  })}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveDescription}
                  disabled={busy || !isDirty || isTooLong}
                  // Couleur explicite, comme partout ailleurs dans l'admin :
                  // le variant par défaut de shadcn s'appuie sur `bg-primary`,
                  // que `globals.css` laisse sans valeur — le bouton serait
                  // blanc sur blanc.
                  className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? t("dialog.saving") : t("dialog.save")}
                </Button>
              </div>
            </div>

            {platform.picture ? (
              <div className="flex items-start gap-4 rounded-lg border bg-muted/20 p-3">
                <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted/40">
                  <Image
                    src={platform.picture}
                    alt={platform.name}
                    fill
                    unoptimized
                    sizes="112px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium">{t("dialog.current")}</p>
                  {confirmingRemoval ? (
                    <div className="space-y-2">
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        {t("dialog.removeConfirm")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRemovePicture}
                          disabled={busy}
                          className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
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
                          disabled={busy}
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
                      disabled={busy}
                      className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("dialog.remove")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <ImageIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                {t("dialog.noPhotoYet")}
              </div>
            )}

            {/* `key` sur la plateforme : changer de plateforme doit repartir
                d'un champ vierge, pas garder le lien saisi pour la précédente. */}
            <Tabs defaultValue="file" key={platform.id}>
              <TabsList className="w-full">
                <TabsTrigger value="file" className="flex-1">
                  {t("dialog.tabFile")}
                </TabsTrigger>
                <TabsTrigger value="link" className="flex-1">
                  {t("dialog.tabLink")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-4">
                <ImageUploadField
                  category="consoles"
                  showPreview={false}
                  disabled={busy}
                  onUploaded={(path) => onPictureChange(platform, path)}
                />
              </TabsContent>

              <TabsContent value="link" className="mt-4">
                <ImageUploadField
                  category="consoles"
                  allowUrlImport
                  showDropzone={false}
                  showPreview={false}
                  disabled={busy}
                  onUploaded={(path) => onPictureChange(platform, path)}
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
            disabled={busy}
          >
            {t("dialog.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
