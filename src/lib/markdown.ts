// lib/markdown.ts
import type { HeadingItem, TocNode } from "@/types/docs";

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractHeadings(markdown: string): HeadingItem[] {
  const re = /^(#{1,4})\s+(.*)$/gm;
  const out: HeadingItem[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(markdown)) !== null) {
    const level = m[1].length;
    const raw = m[2].trim();
    const id = slugify(raw);

    out.push({ depth: level, text: raw, id, isActive: false });
  }

  return out;
}

export function buildToc(headings: HeadingItem[], sectionDepth = 2): TocNode[] {
  if (!headings || headings.length === 0) return [];

  if (!headings.some((h) => h.depth === sectionDepth)) sectionDepth = 1;

  const toc: TocNode[] = [];
  let currentSection: TocNode | null = null;

  for (const h of headings) {
    const node: TocNode = {
      id: h.id,
      text: h.text,
      depth: h.depth,
      children: [],
      isActive: false,
    };

    if (h.depth <= sectionDepth) {
      currentSection = node;
      toc.push(currentSection);
    } else {
      if (!currentSection) {
        currentSection = {
          id: "intro",
          text: "Introduction",
          depth: sectionDepth,
          children: [],
          isActive: false,
        };
        toc.push(currentSection);
      }
      currentSection.children.push(node);
    }
  }

  return toc;
}
