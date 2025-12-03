"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Policy = {
    policies: string;
    lastUpdatedAt?: string;
};

interface PolitiquesClientProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function PolitiquesClient({ open, onOpenChange }: PolitiquesClientProps) {
    const [policy, setPolicy] = useState<Policy | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchPolicy();
        }
    }, [open]);

    async function fetchPolicy() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/policies");
            if (!res.ok) {
                throw new Error(`Erreur serveur (${res.status})`);
            }
            const data = await res.json();

            const payload: Policy = data.policies;

            setPolicy(payload);
        } catch (err: unknown) {
            console.error("Failed to fetch policy:", err);
            setError("Impossible de récupérer la politique de confidentialité.");
            setPolicy(null);
        } finally {
            setLoading(false);
        }
    }

    function formatDate(iso?: string) {
        if (!iso) return null;
        try {
            const d = new Date(iso);
            return d.toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return iso;
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-w-[calc(100vw-2rem)] max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
                <DialogHeader className="border-b px-6 py-4 bg-gray-50 shrink-0">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                        Politique de confidentialité
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-600">
                                Chargement de la politique de confidentialité…
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-700">{error}</p>
                            <button
                                onClick={fetchPolicy}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {!loading && !error && policy && (
                        <>
                            {policy.lastUpdatedAt && (
                                <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
                                    Dernière mise à jour : {formatDate(policy.lastUpdatedAt)}
                                </p>
                            )}

                            <div
                                className="policy-content"
                                dangerouslySetInnerHTML={{ __html: policy.policies }}
                                style={{
                                    lineHeight: "1.7",
                                }}
                            />

                            <style jsx>{`
                              .policy-content :global(h1) {
                                font-size: 2rem;
                                font-weight: 700;
                                margin-top: 2rem;
                                margin-bottom: 1rem;
                                color: #1a1a1a;
                              }

                              .policy-content :global(h2) {
                                font-size: 1.5rem;
                                font-weight: 600;
                                margin-top: 1.75rem;
                                margin-bottom: 0.875rem;
                                color: #2d2d2d;
                              }

                              .policy-content :global(h3) {
                                font-size: 1.25rem;
                                font-weight: 600;
                                margin-top: 1.5rem;
                                margin-bottom: 0.75rem;
                                color: #404040;
                              }

                              .policy-content :global(p) {
                                margin-bottom: 1rem;
                                color: #4a4a4a;
                              }

                              .policy-content :global(ul),
                              .policy-content :global(ol) {
                                margin-left: 1.5rem;
                                margin-bottom: 1rem;
                                color: #4a4a4a;
                              }

                              .policy-content :global(li) {
                                margin-bottom: 0.5rem;
                                padding-left: 0.25rem;
                              }

                              .policy-content :global(strong) {
                                font-weight: 600;
                                color: #2d2d2d;
                              }

                              .policy-content :global(a) {
                                color: #2563eb;
                                text-decoration: underline;
                              }

                              .policy-content :global(a:hover) {
                                color: #1d4ed8;
                              }

                              .policy-content :global(code) {
                                background-color: #f3f4f6;
                                padding: 0.125rem 0.375rem;
                                border-radius: 0.25rem;
                                font-size: 0.875em;
                                font-family: monospace;
                              }

                              .policy-content :global(blockquote) {
                                border-left: 4px solid #e5e7eb;
                                padding-left: 1rem;
                                margin: 1rem 0;
                                color: #6b7280;
                                font-style: italic;
                              }
                            `}</style>
                        </>
                    )}

                    {!loading && !error && !policy && (
                        <div className="text-center py-12 text-gray-600">
                            Aucune politique disponible pour le moment.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
