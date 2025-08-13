import React, { memo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const components: Options["components"] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-xl font-semibold text-gray-100 mt-1 mb-1" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-lg font-semibold text-gray-100 mt-1 mb-1" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-base font-semibold text-gray-100 mt-1 mb-1" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mb-1" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-0" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-0" {...props} />,
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-blue-400 hover:underline" target="_blank" rel="noreferrer" {...props} />
  ),
  hr: () => <hr className="my-4" />,
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')

    if (!inline && match) {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match ? match[1] : undefined}
          PreTag="div"
          customStyle={{
            background: "#0b1220",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            lineHeight: 1.45,
            fontSize: "0.9rem",
          }}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      );
    }
    return (
      <code className="px-1 py-0.5 rounded bg-gray-800 text-gray-100" {...props}>
        {children}
      </code>
    );
  },
};

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id?: string }) => {
    return (
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    if (prevProps.id !== nextProps.id) return false;
    return true;
  },
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';
