"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, RotateCcw, Send } from "lucide-react";
import { parseDbDate } from "@/lib/dates";
import type { EmailTemplateKey } from "@/lib/emailTemplateShapes";
import EmailPreviewPanel from "./EmailPreviewPanel";
import TemplateZoneField from "./TemplateZoneField";
import {
  useEmailTemplates,
  type EmailLocale,
} from "./hooks/useEmailTemplates";

/** Ce qu'un changement de sélection attend d'être confirmé. */
type Pending = { key: EmailTemplateKey; locale: EmailLocale } | null;

export default function EmailTemplatesManager() {
  const t = useTranslations("admin.emails");
  const uiLocale = useLocale();
  const c = useEmailTemplates();
  const [pending, setPending] = useState<Pending>(null);

  /**
   * Changer de gabarit ou de langue rechargeait l'éditeur depuis la base, ce
   * qui effaçait le travail en cours **sans rien dire**. On demande maintenant.
   */
  const demanderChangement = useCallback(
    (key: EmailTemplateKey, locale: EmailLocale) => {
      if (key === c.selectedKey && locale === c.locale) return;
      if (c.dirty) setPending({ key, locale });
      else c.changerSelection(key, locale);
    },
    [c],
  );

  const confirmer = useCallback(() => {
    if (pending) c.changerSelection(pending.key, pending.locale);
    setPending(null);
  }, [pending, c]);

  if (c.loading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const enregistre = c.selected?.content[c.locale];
  const modifieLe = parseDbDate(enregistre?.updatedAt ?? null);

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <Card className="shadow-md">
        <CardHeader className="border-b p-4 pb-3 sm:p-6 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={c.selectedKey}
              onValueChange={(value) =>
                demanderChangement(value as EmailTemplateKey, c.locale)
              }
            >
              <SelectTrigger className="w-full *:data-[slot=select-value]:flex-1 sm:w-[320px]">
                <Mail className="mr-2 h-4 w-4 text-cyan-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {c.templates.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    {t(`templates.${template.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              {c.dirty && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                >
                  {t("unsaved")}
                </Badge>
              )}
              <Tabs
                value={c.locale}
                onValueChange={(value) =>
                  demanderChangement(c.selectedKey, value as EmailLocale)
                }
              >
                <TabsList>
                  <TabsTrigger value="fr">Français</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Qui a touché ce gabarit, et quand. Les deux colonnes étaient
              enregistrées mais n'étaient jamais renvoyées au client. */}
          <p className="mt-2 text-xs text-muted-foreground">
            {enregistre?.customized
              ? modifieLe
                ? t("updatedAtBy", {
                    date: modifieLe.toLocaleString(
                      uiLocale === "en" ? "en-CA" : "fr-CA",
                    ),
                    author: enregistre.updatedBy ?? t("unknownAuthor"),
                  })
                : t("customized")
              : t("usingDefault")}
          </p>
        </CardHeader>

        {c.selected && c.preview && (
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-subject" className="font-semibold">
                    {t("subjectLabel")}
                  </Label>
                  <Input
                    id="email-subject"
                    value={c.subject}
                    onChange={(e) => c.setSubject(e.target.value)}
                  />
                </div>

                {c.selected.zones.map((zone) => (
                  <TemplateZoneField
                    key={zone}
                    zone={zone}
                    label={t(`zones.${zone}`)}
                    value={c.zoneValues[zone] ?? ""}
                    variables={c.selected!.variables}
                    onChange={(value) =>
                      c.setZoneValues((prev) => ({ ...prev, [zone]: value }))
                    }
                  />
                ))}
              </div>

              <EmailPreviewPanel
                preview={c.preview}
                zoneLabel={(zone) => t(`zones.${zone}`)}
              />
            </div>

            <div className="flex flex-col justify-end gap-3 border-t pt-4 sm:flex-row">
              <Button
                variant="ghost"
                onClick={c.reinitialiser}
                disabled={!c.dirty || c.saving}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {t("reset")}
              </Button>
              <Button
                variant="outline"
                onClick={c.sendTest}
                disabled={c.testing || c.dirty}
                className="gap-2"
              >
                {c.testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t("testSend")}
              </Button>
              <Button
                onClick={c.save}
                disabled={c.saving || !c.dirty}
                className="gap-2 bg-cyan-500 text-white transition-colors hover:bg-cyan-600"
              >
                {c.saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </div>

            {/* Le bouton de test s'appuyait sur un `title` pour expliquer sa
                désactivation : invisible au clavier comme sur mobile. */}
            {c.dirty && (
              <p className="text-right text-sm text-muted-foreground">
                {t("saveBeforeTest")}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent className="text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discard.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discard.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("discard.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmer}>
              {t("discard.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
