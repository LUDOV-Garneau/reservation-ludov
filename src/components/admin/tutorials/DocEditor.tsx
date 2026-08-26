"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ImageUploadField from "@/components/admin/ImageUploadField";

/** Ce que l'éditeur expose au parent pour alimenter le bouton d'en-tête. */
export type DocEditorApi = {
  save: () => void;
  isSaving: boolean;
  canSave: boolean;
};

type Props = {
  slug: string;
  /** Appelé après une sauvegarde réussie (contenu de la langue sauvegardée). */
  onSaved: (locale: "fr" | "en", content: string) => void;
  /** Reçoit l'action d'enregistrement, déclenchée depuis l'en-tête de la page. */
  onApiChange: (api: DocEditorApi) => void;
};

/**
 * Éditeur Markdown de la documentation (admin) : édition côte à côte avec
 * aperçu, bilingue (l'anglais part du contenu français si absent), et
 * insertion d'images téléversées sur le volume local.
 */
export default function DocEditor({ slug, onSaved, onApiChange }: Props) {
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/docs/${slug}?locale=${locale}`);
        if (!res.ok) throw new Error("Erreur de chargement du document.");
        const data = await res.json();
        if (cancelled) return;
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Erreur de chargement.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/docs/${slug}?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la sauvegarde.");
      }
      onSaved(locale, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  }, [slug, locale, title, content, onSaved]);

  // Le parent affiche « Enregistrer » à côté de « Arrêter l'édition » : il a
  // besoin de l'action et de l'état courant du formulaire.
  const canSave = Boolean(title.trim()) && Boolean(content.trim());
  useEffect(() => {
    onApiChange({ save: handleSave, isSaving, canSave });
  }, [onApiChange, handleSave, isSaving, canSave]);

  const handleImageUploaded = useCallback((path: string) => {
    setContent((prev) => `${prev}\n\n![](${path})\n`);
    setShowUpload(false);
  }, []);

  return (
    <div className="bg-[white] rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Tabs
          value={locale}
          onValueChange={(value) => setLocale(value as "fr" | "en")}
        >
          <TabsList>
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Button asChild variant="outline" size="sm" className="w-fit gap-2">
        <Link
          href={`/admin/tutorials?page=markdown-guide&adminRessources=true`}
          target="_blank"
        >
          <BookOpen className="h-4 w-4" />
          Guide de la syntaxe Markdown
        </Link>
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="doc-title" className="font-semibold">
              Titre
            </Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              {/* min-h-8 : garde les deux colonnes alignées, la hauteur de
                  l'en-tête étant imposée par le bouton (size="sm"). */}
              <div className="flex min-h-8 items-center justify-between gap-2">
                <Label htmlFor="doc-content" className="font-semibold">
                  Contenu (Markdown)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpload((prev) => !prev)}
                >
                  Insérer une image
                </Button>
              </div>

              {showUpload && (
                <ImageUploadField
                  category="docs"
                  onUploaded={handleImageUploaded}
                />
              )}

              <Textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                className="bg-white font-mono text-sm resize-y max-h-[600px] overflow-auto"
              />
            </div>

            <div className="space-y-2">
              <div className="flex min-h-8 items-center">
                <Label className="font-semibold">Aperçu</Label>
              </div>
              <div className="border rounded-lg bg-white p-4 overflow-auto max-h-[600px] prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
