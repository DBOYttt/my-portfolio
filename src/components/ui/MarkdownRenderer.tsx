import { markdownToHtml } from "@/lib/markdown";
import CodeCopyEnhancer from "./CodeCopyEnhancer";

interface Props {
  content: string;
  className?: string;
}

export default async function MarkdownRenderer({ content, className }: Props) {
  const html = await markdownToHtml(content);
  return (
    <CodeCopyEnhancer>
      <div
        className={`markdown-content ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </CodeCopyEnhancer>
  );
}
