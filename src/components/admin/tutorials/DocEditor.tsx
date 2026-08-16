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
import { AlertCircle, BookOpen, Loader2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ImageUploadField from "@/components/admin/ImageUploadField";

type Props = {
  slug: string;
  /** Appelé après une sauvegarde réussie (contenu de la langue sauvegardée). */
  onSaved: (locale: "fr" | "en", content: string) => void;
  onClose: () => void;
};

/**
 * Éditeur Markdown de la documentation (admin) : édition côte à côte avec
 * aperçu, bilingue (l'anglais part du contenu français si absent), et
 * insertion d'images téléversées sur le volume local.
 */
export default function DocEditor({ slug, onSaved, onClose }: Props) {
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

  const handleImageUploaded = useCallback((path: string) => {
    setContent((prev) => `${prev}\n\n![](${path})\n`);
    setShowUpload(false);
  }, []);

  return (
    <div className="bg-white rounded-xl border-2 border-cyan-200 p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold">Édition de la documentation</h2>
        <div className="flex items-center gap-2">
          <Tabs
            value={locale}
            onValueChange={(value) => setLocale(value as "fr" | "en")}
          >
            <TabsList>
              <TabsTrigger value="fr">Français</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Link
        href={`/admin/tutorials?page=markdown-guide&adminRessources=true`}
        className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700"
        target="_blank"
      >
        <BookOpen className="h-4 w-4" />
        Guide de la syntaxe Markdown
      </Link>

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

          <div className="flex items-center justify-between">
            <Label className="font-semibold">Contenu (Markdown)</Label>
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
            <ImageUploadField category="docs" onUploaded={handleImageUploaded} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={24}
              className="font-mono text-sm resize-y"
              aria-label="Contenu Markdown"
            />
            <div className="border rounded-lg p-4 overflow-auto max-h-[600px] prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
