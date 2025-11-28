"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import SimpleEditor from "./editor";
import { Button } from "@/components/ui/button";
import { da } from "date-fns/locale";
import { set } from "date-fns";

type Error = {
    title: string;
    message: string;
}

type PolicyData = {
    policies: string;
    lastUpdatedAt: Date;
}

export default function PoliciesContent() {

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [policyData, setPolicyData] = useState<PolicyData | null>(null);
    const [editedPolicyContent, setEditedPolicyContent] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
      const [editorKey, setEditorKey] = useState<number>(0); // <-- key pour forcer remount


    useEffect(() => {
        fetchPolicyData();
    }, []);

    async function fetchPolicyData() {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch('/api/policies', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            const payload : PolicyData = data.policies; 

            setPolicyData(payload);
            setEditedPolicyContent(payload.policies);
        } catch (error) {
            setError({
                title: "Erreur de chargement",
                message: "Une erreur est survenue lors du chargement de la politique de confidentialité.",
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
            setError(null);
            setSaveSuccess(false);

            const res = await fetch('/api/policies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ policies: editedPolicyContent }),
            });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();

            const updated : PolicyData = data.policies;

            setPolicyData(updated);
            setEditedPolicyContent(updated.policies);
            setSaveSuccess(true);

            setTimeout(() => setSaveSuccess(false), 3500);

        } catch (error) {
            setError({
                title: "Erreur de sauvegarde",
                message: "Une erreur est survenue lors de la sauvegarde de la politique de confidentialité.",
            });
            console.error("Failed to save policies:", error);
        } finally {
            setIsSaving(false);
        }
    }

    function handleCancel() {
        if (editedPolicyContent !== policyData?.policies) {
            const confirmCancel = window.confirm(
                "Êtes-vous sûr de vouloir annuler vos modifications ? Toutes les modifications non enregistrées seront perdues."
            );
            if (!confirmCancel) return;
        }
        
        setEditedPolicyContent(policyData?.policies || "");
        setEditorKey(prevKey => prevKey + 1);
        setError(null);
        setSaveSuccess(false);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02dcde]"></div>
                    <p className="text-gray-500 text-sm">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div className="flex flex-col gap-1 sm:gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Gérer la politique de confidentialité</p>
            </div>

            {error && (
                <Alert variant="destructive" className="grid">
                    <AlertCircleIcon />
                    <AlertTitle className="font-bold">{error.title}</AlertTitle>
                    <AlertDescription>
                        <p>{error.message}</p>
                    </AlertDescription>
                </Alert>
            )}

            {saveSuccess && (
                <Alert variant="default" className="grid">
                    <CheckCircle2Icon />
                    <AlertTitle className="font-bold">Enregistré</AlertTitle>
                    <AlertDescription>
                        <p>La politique a été sauvegardée avec succès.</p>
                    </AlertDescription>
                </Alert>
            )}

            <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    {policyData?.lastUpdatedAt && (
                        <p className="mb-4 text-muted-foreground">Dernière mise à jour {new Date(policyData.lastUpdatedAt).toLocaleDateString("fr-CA")}</p>
                    )}
                    <div className="flex gap-2">
                        <Button 
                            className="bg-gray-400 hover:bg-red-500"
                            onClick={handleCancel}
                            disabled={ isSaving || editedPolicyContent === policyData?.policies }
                        >
                            Annuler
                        </Button>
                        <Button 
                            className="bg-cyan-500 hover:bg-cyan-700"
                            onClick={handleSave}
                            disabled={ isSaving || !editedPolicyContent || editedPolicyContent === policyData?.policies }
                        >
                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                </div>

                {isSaving ? (
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02dcde]"></div>
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