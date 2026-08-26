"use client";

import { toast } from "sonner";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";

type TemplateContent = { subject: string; zones: Record<string, string> };

type Template = {
  key: string;
  zones: string[];
  variables: string[];
  content: Record<string, TemplateContent>;
};

type AlertState = {
  type: "success" | "destructive";
  message: string;
} | null;

export default function EmailTemplatesEditor() {
  const t = useTranslations("admin.emails");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedKey, setSelectedKey] = useState<string>("confirmation");
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [subject, setSubject] = useState("");
  const [zoneValues, setZoneValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Rétroaction sous forme de toast (sonner) plutôt que de bannière dans la
  // page ; le <Toaster> est monté dans app/[locale]/layout.tsx.
  const showAlert = useCallback(
    (next: NonNullable<AlertState>) => {
      if (next.type === "success") {
        toast.success(t("alerts.successTitle"), { description: next.message });
      } else {
        toast.error(t("alerts.errorTitle"), { description: next.message });
      }
    },
    [t]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedKey) ?? null,
    [templates, selectedKey],
  );

  const loadEditorContent = useCallback(
    (template: Template | null, targetLocale: "fr" | "en") => {
      if (!template) return;
      const content = template.content[targetLocale];
      setSubject(content?.subject ?? "");
      setZoneValues({ ...(content?.zones ?? {}) });
    },
    [],
  );

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");
      setTemplates(data.templates);
    } catch (err) {
      console.error(err);
      showAlert({ type: "destructive", message: t("alerts.fetchError") });
    } finally {
      setLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    loadEditorContent(selectedTemplate, locale);
  }, [selectedTemplate, locale, loadEditorContent]);

  const handleSave = useCallback(async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/admin/email-templates/${selectedTemplate.key}?locale=${locale}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, zones: zoneValues }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

      setTemplates((prev) =>
        prev.map((template) =>
          template.key === selectedTemplate.key
            ? {
                ...template,
                content: {
                  ...template.content,
                  [locale]: { subject, zones: { ...zoneValues } },
                },
              }
            : template,
        ),
      );
      showAlert({ type: "success", message: t("alerts.saveSuccess") });
    } catch (err) {
      showAlert({
        type: "destructive",
        message: err instanceof Error ? err.message : t("alerts.saveError"),
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedTemplate, locale, subject, zoneValues, showAlert, t]);

  const handleTestSend = useCallback(async () => {
    if (!selectedTemplate) return;
    setIsTesting(true);
    try {
      const res = await fetch(
        `/api/admin/email-templates/${selectedTemplate.key}/test?locale=${locale}`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");
      showAlert({
        type: "success",
        message: t("alerts.testSuccess", { email: data.sentTo }),
      });
    } catch (err) {
      showAlert({
        type: "destructive",
        message: err instanceof Error ? err.message : t("alerts.testError"),
      });
    } finally {
      setIsTesting(false);
    }
  }, [selectedTemplate, locale, showAlert, t]);

  const insertVariable = useCallback(
    (zone: string, variable: string) => {
      setZoneValues((prev) => ({
        ...prev,
        [zone]: `${prev[zone] ?? ""}{${variable}}`,
      }));
    },
    [],
  );

  const hasChanges = useMemo(() => {
    if (!selectedTemplate) return false;
    const saved = selectedTemplate.content[locale];
    if (!saved) return true;
    if (saved.subject !== subject) return true;
    return selectedTemplate.zones.some(
      (zone) => (saved.zones[zone] ?? "") !== (zoneValues[zone] ?? ""),
    );
  }, [selectedTemplate, locale, subject, zoneValues]);

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">


      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                {/* L'icône vit dans le déclencheur, comme pour le filtre de
                    l'onglet Réservations. `flex-1` sur la valeur l'ancre à
                    l'icône et garde le chevron collé à droite ; la largeur
                    passe à 320px pour que « Réinitialisation du mot de passe »
                    tienne malgré la place prise par l'icône. */}
                <SelectTrigger className="w-full sm:w-[320px] *:data-[slot=select-value]:flex-1">
                  <Mail className="mr-2 h-4 w-4 text-cyan-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.key} value={template.key}>
                      {t(`templates.${template.key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        </CardHeader>

        {selectedTemplate && (
          <CardContent className="p-4 sm:p-6 space-y-6">
            {selectedTemplate.variables.length > 0 && (
              <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3 text-sm text-cyan-900">
                {t("variablesHint")}{" "}
                {selectedTemplate.variables.map((variable) => (
                  <code
                    key={variable}
                    className="mx-1 rounded bg-white px-1.5 py-0.5 border border-cyan-200"
                  >
                    {`{${variable}}`}
                  </code>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email-subject" className="font-semibold">
                {t("subjectLabel")}
              </Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {selectedTemplate.zones.map((zone) => (
              <div key={zone} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`zone-${zone}`} className="font-semibold">
                    {t(`zones.${zone}`)}
                  </Label>
                  {selectedTemplate.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.variables.map((variable) => (
                        <Badge
                          key={variable}
                          variant="outline"
                          className="cursor-pointer hover:bg-cyan-50 font-mono text-[11px]"
                          onClick={() => insertVariable(zone, variable)}
                        >
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Textarea
                  id={`zone-${zone}`}
                  value={zoneValues[zone] ?? ""}
                  onChange={(e) =>
                    setZoneValues((prev) => ({
                      ...prev,
                      [zone]: e.target.value,
                    }))
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{t("lineHint")}</p>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={handleTestSend}
                disabled={isTesting || hasChanges}
                title={hasChanges ? t("saveBeforeTest") : undefined}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t("testSend")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-cyan-500 hover:bg-cyan-600 gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
