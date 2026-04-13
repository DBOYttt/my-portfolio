import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export interface TocHeading {
  depth: number;
  text: string;
  id: string;
}

export function extractTocHeadings(markdown: string): TocHeading[] {
  const regex = /^(#{1,3})\s+(.+)$/gm;
  const slugs = new Map<string, number>();
  const headings: TocHeading[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(markdown)) !== null) {
    const text = m[2].replace(/[*_`[\]]/g, "").trim();
    let id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const count = slugs.get(id) ?? 0;
    slugs.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    headings.push({ depth: m[1].length, text, id });
  }
  return headings;
}

export async function markdownToHtml(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeSlug)
    .use(rehypeSanitize, {
      ...defaultSchema,
      clobberPrefix: "",
      attributes: {
        ...defaultSchema.attributes,
        // Allow language-* classes from remark-rehype and hljs* classes from rehype-highlight
        code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/, "hljs"] as any], // eslint-disable-line
        span: [...(defaultSchema.attributes?.span ?? []), ["className", /^hljs/] as any], // eslint-disable-line
        // Allow rehype-slug's generated id attributes to survive sanitization
        h1: [["id"]], h2: [["id"]], h3: [["id"]], h4: [["id"]], h5: [["id"]], h6: [["id"]],
      },
    })
    .use(rehypeStringify)
    .process(content);
  return result.toString();
}
