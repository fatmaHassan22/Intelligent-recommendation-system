import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function StudyMarkdown({ content }: { content: string }) {
  return (
    <div className="study-markdown" dir="auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        disallowedElements={["img"]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          pre: ({ children }) => <pre dir="ltr">{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
