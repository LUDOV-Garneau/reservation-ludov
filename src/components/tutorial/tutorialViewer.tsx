"use client";

import { extractHeadings, slugify } from "@/lib/markdown";
import { TutorialViewerProps } from "@/types/docs";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TutorialViewer({
  page,
  adminRessources,
  onHeadings,
  content,
}: TutorialViewerProps & { content?: string }) {
  const [markdownContent, setMarkdownContent] = useState<string>(content || "");
  const [loading, setLoading] = useState<boolean>(!content);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      setMarkdownContent(content);
      const headings = extractHeadings(content);
      onHeadings?.(headings);
      return;
    }

    let isMounted = true;

    async function fetchMarkdown() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          adminRessources
            ? `/tutoriels/admin/${page}.md`
            : `/tutoriels/${page}.md`
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

        const headings = extractHeadings(text);
        onHeadings?.(headings);
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
  }, [page, adminRessources, onHeadings, content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-cyan-600 mb-4"></div>
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
            <div className="shrink-0">
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
    <article className="bg-[white] rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-8 md:p-12 lg:p-16">
        <div
          className="prose prose-lg prose-slate max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h1:text-4xl prose-h1:mb-10 prose-h1:pb-6 prose-h1:border-b-2 prose-h1:border-gray-200
          prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-cyan-600 prose-h2:pb-3 prose-h2:border-b prose-h2:border-cyan-100
          prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-gray-800
          prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-3 prose-h4:text-gray-700
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base
          prose-a:text-cyan-600 prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:text-cyan-800 prose-a:transition-colors
          prose-strong:text-gray-900 prose-strong:font-bold
          prose-code:text-pink-700 prose-code:bg-pink-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:border prose-code:border-pink-200 prose-code:before:content-[''] prose-code:after:content-['']
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:shadow-xl prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:my-8
          prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
          prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
          prose-li:text-gray-700 prose-li:leading-relaxed prose-li:my-2
          prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-50 prose-blockquote:pl-6 prose-blockquote:pr-6 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:rounded-r-lg prose-blockquote:shadow-sm prose-blockquote:my-8
          prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:border prose-img:border-gray-200
          prose-hr:my-12 prose-hr:border-0 prose-hr:h-px prose-hr:bg-linear-to-r prose-hr:from-transparent prose-hr:via-gray-300 prose-hr:to-transparent
          prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden prose-table:border prose-table:border-gray-200
          prose-thead:bg-gray-50
          prose-th:font-semibold prose-th:text-gray-900 prose-th:text-left prose-th:p-4 prose-th:border-r prose-th:border-gray-200 prose-th:text-sm
          prose-td:p-4 prose-td:border-r prose-td:border-gray-200 prose-td:text-gray-700 prose-td:text-sm
          prose-tbody:divide-y prose-tbody:divide-gray-200 prose-tbody:bg-white"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 id={slugify(String(children)) as string}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 id={slugify(String(children)) as string}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 id={slugify(String(children)) as string}>{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 id={slugify(String(children)) as string}>{children}</h4>
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
