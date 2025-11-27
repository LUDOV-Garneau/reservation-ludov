"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TutorialPage() {
  const [markdownContent, setMarkdownContent] = useState<string>("");

  useEffect(() => {
    fetchMarkdown();
  }, []);

  function fetchMarkdown() {
    fetch("/Tutorials/GettingStartedAdmin.md")
      .then((response) => response.text())
      .then((text) => setMarkdownContent(text));
  }

  return (
    <div className="mx-auto mt-8 px-4 sm:px-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}
