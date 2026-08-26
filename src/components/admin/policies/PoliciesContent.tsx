"use client";

import { toast } from "sonner";

import { useEffect, useState } from "react";
import SimpleEditor from "./editor";
import { Button } from "@/components/ui/button";
import CancelPolicyEditsAction from "./DialogConfirmationCancelPolicy";

type PolicyData = {
  policies: string;
  lastUpdatedAt: Date;
};

type PolicyType = "privacy" | "usage";

const POLICY_LABELS: Record<PolicyType, { title: string }> = {
  privacy: { title: "Politique de confidentialité" },
  usage: { title: "Politique d'utilisation" },
};

export default function PoliciesContent({
  type = "privacy",
}: {
  type?: PolicyType;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [policyData, setPolicyData] = useState<PolicyData | null>(null);
  const [editedPolicyContent, setEditedPolicyContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editorKey, setEditorKey] = useState<number>(0); // <-- key pour forcer remount

  useEffect(() => {
    fetchPolicyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function fetchPolicyData() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/policies?type=${type}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const payload: PolicyData | null = data.policies ?? null;

      setPolicyData(payload);
      setEditedPolicyContent(payload?.policies ?? "");
    } catch (error) {
      toast.error("Erreur de chargement", {
        description:
          "Une erreur est survenue lors du chargement de la politique de confidentialité.",
      });
      console.error("Failed to set document title:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!editedPolicyContent) return;

    if (policyData?.policies === editedPolicyContent) return;

    try {
      setIsSaving(true);

      const res = await fetch(`/api/policies?type=${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ policies: editedPolicyContent }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      // Le POST renvoie { success, message } : le contenu sauvegardé est
      // celui de l'éditeur.
      await res.json();

      setPolicyData({
        policies: editedPolicyContent,
        lastUpdatedAt: new Date(),
      });
      toast.success("Enregistré", {
        description: "La politique a été sauvegardée avec succès.",
      });
    } catch (error) {
      toast.error("Erreur de sauvegarde", {
        description:
          "Une erreur est survenue lors de la sauvegarde de la politique de confidentialité.",
      });
      console.error("Failed to save policies:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // La confirmation est gérée par <CancelPolicyEditsAction> : ce handler n'est
  // appelé qu'une fois l'abandon confirmé.
  function handleCancel() {
    setEditedPolicyContent(policyData?.policies || "");
    setEditorKey((prevKey) => prevKey + 1);
  }

  const hasUnsavedChanges = editedPolicyContent !== policyData?.policies;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mt-4 space-y-4 sm:space-y-6">



      <div className="w-full">
        {/* La date est toujours rendue et les boutons sont poussés à droite
            par `md:ml-auto` : sans cela, une politique jamais enregistrée
            (lastUpdatedAt absent) faisait remonter les boutons à gauche, et
            les deux onglets n'avaient pas la même disposition. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <p className="text-muted-foreground">
            Dernière mise à jour :{" "}
            {policyData?.lastUpdatedAt
              ? new Date(policyData.lastUpdatedAt).toLocaleDateString("fr-CA")
              : "jamais"}
          </p>
          <div className="flex gap-2 w-full md:w-auto md:ml-auto">
            <CancelPolicyEditsAction
              policyTitle={POLICY_LABELS[type].title}
              onConfirm={handleCancel}
            >
              {({ open }) => (
                <Button
                  // Même style que les autres « Annuler » de l'admin
                  // (variant outline) : le fond gris plein donnait un bouton
                  // qui paraissait désactivé.
                  variant="outline"
                  className="flex-1 md:flex-0 hover:bg-gray-50"
                  // Toujours actif (donc jamais grisé) : sans modification en
                  // cours, la confirmation n'a pas lieu d'être et le clic
                  // réinitialise simplement l'éditeur.
                  onClick={hasUnsavedChanges ? open : handleCancel}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
              )}
            </CancelPolicyEditsAction>
            <Button
              className="bg-cyan-500 hover:bg-cyan-700 flex-1 md:flex-0"
              onClick={handleSave}
              disabled={isSaving || !editedPolicyContent || !hasUnsavedChanges}
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>

        {isSaving ? (
          <div className="flex items-center justify-center mb-4">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <p className="text-gray-500 text-sm">Sauvegarde en cours...</p>
            </div>
          </div>
        ) : (
          <SimpleEditor
            key={editorKey}
            content={editedPolicyContent || "<p>Contenu initial</p>"}
            onChange={(html) => setEditedPolicyContent(html)}
          />
        )}
      </div>
    </div>
  );
}
