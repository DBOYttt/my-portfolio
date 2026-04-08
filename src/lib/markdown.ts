import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export async function markdownToHtml(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        // Allow language-* classes from remark-rehype and hljs* classes from rehype-highlight
        code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/, "hljs"] as any], // eslint-disable-line
        span: [...(defaultSchema.attributes?.span ?? []), ["className", /^hljs/] as any], // eslint-disable-line
      },
    })
    .use(rehypeStringify)
    .process(content);
  return result.toString();
}
