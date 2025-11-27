"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TutorialViewer() {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMarkdown() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/Tutorials/GettingStartedAdmin.md");

        if (!response.ok) {
          throw new Error(
            `Erreur lors du chargement: ${response.status} ${response.statusText}`
          );
        }

        const text = await response.text();

        if (isMounted) {
          setMarkdownContent(text);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Une erreur inattendue s'est produite"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMarkdown();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Chargement du tutoriel...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur de chargement
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert w-full mx-auto py-8 px-4 bg-[white] dark:bg-gray-800 rounded-lg shadow-md my-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}
