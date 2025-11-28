"use client";

import { TutorialArgs } from "@/types/tuto";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TutorialViewer({
  page,
  adminRessources,
}: {
  page: TutorialArgs;
  adminRessources: boolean;
}) {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMarkdown() {
      try {
        setLoading(true);
        setError(null);

        console.log(
          "Fetching tutorial:",
          page,
          "Admin resources:",
          adminRessources
        );

        const response = await fetch(
          adminRessources
            ? `/Tutorials/admin/${page}.md`
            : `/Tutorials/${page}.md`
        );

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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du tutoriel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-full py-8">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-600"
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
            <div className="flex-1">
              <h3 className="text-base font-semibold text-red-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
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
    <article className="bg-[white] rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="p-8 md:p-12 lg:p-16">
        <div
          className="prose prose-lg prose-slate max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-gray-800
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-cyan-600 prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:text-cyan-900
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
          prose-pre:bg-gray-900 prose-pre:shadow-lg prose-pre:border prose-pre:border-gray-700
          prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
          prose-li:my-2 prose-li:text-gray-700
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic
          prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
          prose-hr:my-12 prose-hr:border-gray-300
          prose-table:border-collapse prose-table:w-full
          prose-th:bg-gray-100 prose-th:font-semibold prose-th:p-3 prose-th:border prose-th:border-gray-300
          prose-td:p-3 prose-td:border prose-td:border-gray-300"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
