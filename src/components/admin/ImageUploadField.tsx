"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ImageIcon, Link2, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  category: "consoles" | "games" | "docs";
  /** Image actuelle (chemin /api/images/... ou URL https héritée) */
  currentImage?: string | null;
  /** Appelé avec le chemin public (/api/images/...) après téléversement */
  onUploaded: (path: string) => void;
  /** Champ « importer depuis un lien IGDB/MobyGames » */
  allowUrlImport?: boolean;
  /**
   * Aperçu de l'image dans la zone de dépôt. À désactiver quand l'appelant
   * affiche déjà l'image enregistrée : l'aperçu interne bascule dès que le
   * fichier est déposé, avant que l'appelant ait pu l'enregistrer, et
   * afficherait la nouvelle image même si l'enregistrement a échoué.
   */
  showPreview?: boolean;
  /**
   * Zone de dépôt de fichier. À désactiver quand l'appelant n'expose que
   * l'import par lien (onglet dédié).
   */
  showDropzone?: boolean;
  disabled?: boolean;
};

/**
 * Champ de téléversement d'image partagé (photos de consoles, images de jeux,
 * documentation) : fichier local (clic ou glisser-déposer) et, si activé,
 * import serveur depuis un lien IGDB/MobyGames. Stockage sur le volume local
 * via POST /api/admin/uploads.
 */
export default function ImageUploadField({
  category,
  currentImage,
  onUploaded,
  allowUrlImport = false,
  showPreview = true,
  showDropzone = true,
  disabled = false,
}: Props) {
  const t = useTranslations("admin.imageUpload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);

  const upload = useCallback(
    async (formData: FormData) => {
      setIsUploading(true);
      setError(null);
      try {
        formData.set("category", category);
        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || t("error"));
        }
        setPreview(data.path);
        setImportUrl("");
        onUploaded(data.path);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
      } finally {
        setIsUploading(false);
      }
    },
    [category, onUploaded, t],
  );

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file || disabled || isUploading) return;
      const formData = new FormData();
      formData.set("file", file);
      upload(formData);
    },
    [disabled, isUploading, upload],
  );

  const handleUrlImport = useCallback(() => {
    if (!importUrl.trim() || disabled || isUploading) return;
    const formData = new FormData();
    formData.set("url", importUrl.trim());
    upload(formData);
  }, [importUrl, disabled, isUploading, upload]);

  return (
    <div className="space-y-3">
      {showDropzone && (
        <div
          role="button"
          tabIndex={0}
          aria-label={t("dropzone")}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-cyan-500 bg-cyan-50"
              : "border-gray-300 hover:border-cyan-500 bg-muted/30"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {showPreview && preview ? (
            <div className="relative h-32 w-full">
              <Image
                src={preview}
                alt=""
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          )}

          {isUploading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("uploading")}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              {t("dropzone")}
            </p>
          )}
        </div>
      )}

      {showDropzone && (
        <p className="text-xs text-muted-foreground">{t("constraints")}</p>
      )}

      {allowUrlImport && (
        <div className="space-y-2">
          {showDropzone && (
            <p className="text-sm font-medium">{t("urlLabel")}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              disabled={disabled || isUploading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlImport}
              disabled={disabled || isUploading || !importUrl.trim()}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              {t("importUrl")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
