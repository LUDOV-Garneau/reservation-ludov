"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { buildEmailPreview } from "@/lib/emailPreview";
import type { EmailTemplateKey } from "@/lib/emailTemplateShapes";

export type TemplateContent = {
  subject: string;
  zones: Record<string, string>;
  /** Une ligne existe en base ; sinon c'est le texte embarqué qui part. */
  customized?: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type Template = {
  key: EmailTemplateKey;
  zones: string[];
  variables: string[];
  content: Record<string, TemplateContent>;
};

export type EmailLocale = "fr" | "en";

export function useEmailTemplates() {
  const t = useTranslations("admin.emails");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>(
    "confirmation" as EmailTemplateKey,
  );
  const [locale, setLocale] = useState<EmailLocale>("fr");

  const [subject, setSubject] = useState("");
  const [zoneValues, setZoneValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const selected = useMemo(
    () => templates.find((tpl) => tpl.key === selectedKey) ?? null,
    [templates, selectedKey],
  );

  const chargerDansEditeur = useCallback(
    (template: Template | null, cible: EmailLocale) => {
      if (!template) return;
      const contenu = template.content[cible];
      setSubject(contenu?.subject ?? "");
      setZoneValues({ ...(contenu?.zones ?? {}) });
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
      return data.templates as Template[];
    } catch (err) {
      console.error(err);
      toast.error(t("alerts.errorTitle"), {
        description: t("alerts.fetchError"),
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTemplates().then((chargés) => {
      if (!chargés) return;
      const premier = chargés.find((tpl) => tpl.key === "confirmation") ?? chargés[0];
      if (premier) {
        setSelectedKey(premier.key);
        chargerDansEditeur(premier, "fr");
      }
    });
    // Chargement initial uniquement : le contenu de l'éditeur n'est ensuite
    // remplacé que par un changement DÉLIBÉRÉ de gabarit ou de langue, jamais
    // par un effet. L'ancien effet sur `[selected, locale]` écrasait en
    // silence les modifications en cours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!selected) return false;
    const enregistre = selected.content[locale];
    if (!enregistre) return true;
    if (enregistre.subject !== subject) return true;
    return selected.zones.some(
      (zone) => (enregistre.zones[zone] ?? "") !== (zoneValues[zone] ?? ""),
    );
  }, [selected, locale, subject, zoneValues]);

  const preview = useMemo(
    () =>
      selected
        ? buildEmailPreview(selected.key, { subject, zones: zoneValues })
        : null,
    [selected, subject, zoneValues],
  );

  /** Change de gabarit ou de langue en rechargeant l'éditeur. L'appelant est
   *  responsable d'avoir confirmé si `dirty`. */
  const changerSelection = useCallback(
    (cle: EmailTemplateKey, cible: EmailLocale) => {
      const template = templates.find((tpl) => tpl.key === cle) ?? null;
      setSelectedKey(cle);
      setLocale(cible);
      chargerDansEditeur(template, cible);
    },
    [templates, chargerDansEditeur],
  );

  const reinitialiser = useCallback(() => {
    chargerDansEditeur(selected, locale);
  }, [selected, locale, chargerDansEditeur]);

  const save = useCallback(async () => {
    if (!selected) return;
    // Une variable inconnue est refusée par la route : autant le dire ici,
    // plutôt que d'attendre l'aller-retour pour l'apprendre.
    if (preview && preview.unknownVariables.length > 0) {
      toast.error(t("alerts.errorTitle"), {
        description: t("alerts.unknownVariables", {
          variables: preview.unknownVariables.map((v) => `{${v}}`).join(", "),
        }),
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/email-templates/${selected.key}?locale=${locale}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, zones: zoneValues }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.key === selected.key
            ? {
                ...tpl,
                content: {
                  ...tpl.content,
                  [locale]: {
                    subject,
                    zones: { ...zoneValues },
                    customized: true,
                    updatedAt: data.updatedAt ?? null,
                    updatedBy: data.updatedBy ?? null,
                  },
                },
              }
            : tpl,
        ),
      );
      toast.success(t("alerts.successTitle"), {
        description: t("alerts.saveSuccess"),
      });
    } catch (err) {
      toast.error(t("alerts.errorTitle"), {
        description: err instanceof Error ? err.message : t("alerts.saveError"),
      });
    } finally {
      setSaving(false);
    }
  }, [selected, preview, locale, subject, zoneValues, t]);

  const sendTest = useCallback(async () => {
    if (!selected) return;
    setTesting(true);
    try {
      const res = await fetch(
        `/api/admin/email-templates/${selected.key}/test?locale=${locale}`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");
      toast.success(t("alerts.successTitle"), {
        description: t("alerts.testSuccess", { email: data.sentTo }),
      });
    } catch (err) {
      toast.error(t("alerts.errorTitle"), {
        description: err instanceof Error ? err.message : t("alerts.testError"),
      });
    } finally {
      setTesting(false);
    }
  }, [selected, locale, t]);

  return {
    templates,
    selected,
    selectedKey,
    locale,
    subject,
    setSubject,
    zoneValues,
    setZoneValues,
    loading,
    saving,
    testing,
    dirty,
    preview,
    changerSelection,
    reinitialiser,
    save,
    sendTest,
  };
}
