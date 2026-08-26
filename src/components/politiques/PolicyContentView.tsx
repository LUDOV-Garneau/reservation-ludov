"use client";

import { useCallback, useEffect, useState } from "react";

export type PolicyType = "privacy" | "usage";

type Policy = {
  policies: string | null;
  lastUpdatedAt?: string;
};

type Props = {
  type: PolicyType;
  /** Différer le chargement (ex. : modal fermé) */
  active?: boolean;
};

const ERROR_MESSAGES: Record<PolicyType, string> = {
  privacy: "Impossible de récupérer la politique de confidentialité.",
  usage: "Impossible de récupérer la politique d'utilisation.",
};

/**
 * Corps partagé d'affichage d'une politique (HTML éditée via TipTap) :
 * utilisé par le modal de confidentialité et la page /politique-utilisation.
 */
export default function PolicyContentView({ type, active = true }: Props) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/policies?type=${type}`);
      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }
      const data = await res.json();
      setPolicy(data.policies ?? null);
    } catch (err: unknown) {
      console.error("Failed to fetch policy:", err);
      setError(ERROR_MESSAGES[type]);
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (active) {
      fetchPolicy();
    }
  }, [active, fetchPolicy]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchPolicy}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!policy?.policies) {
    return (
      <div className="text-center py-12 text-gray-600">
        Aucune politique disponible pour le moment
      </div>
    );
  }

  return (
    <>
      {policy.lastUpdatedAt && (
        <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
          Dernière mise à jour : {formatDate(policy.lastUpdatedAt)}
        </p>
      )}

      <div
        className="policy-content"
        dangerouslySetInnerHTML={{ __html: policy.policies }}
        style={{ lineHeight: "1.7" }}
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
          color: #0092b8;
          text-decoration: underline;
        }

        .policy-content :global(a:hover) {
          color: #00b8db;
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
  );
}
