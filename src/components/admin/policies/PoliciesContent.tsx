"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { set } from "date-fns";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { useEffect, useState } from "react";

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

    useEffect(() => {
        fetchPolicyData();
    }, []);

    async function fetchPolicyData() {
        try {
            setIsLoading(true);
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
            if (data.policies) {
                setPolicyData(data.policies);
            }
            setIsLoading(false);
        } catch (error) {
            setError({
                title: "Erreur de chargement",
                message: "Une erreur est survenue lors du chargement de la politique de confidentialité.",
            });
            console.error("Failed to set document title:", error);
            setIsLoading(false);
        }
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
            <div className="w-full">
                <p className="text-right mb-4 text-muted-foreground">Dernière mise à jour {new Date(policyData?.lastUpdatedAt).toLocaleDateString("fr-CA")}</p>
                <textarea className="w-full h-screen border p-10">{policyData?.policies}</textarea>
            </div>
        </div>
    );
}