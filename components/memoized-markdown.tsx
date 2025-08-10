import React, { memo, useMemo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import { marked } from "marked";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const components: Options["components"] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-xl font-semibold text-gray-100 mt-2" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-lg font-semibold text-gray-100 mt-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-base font-semibold text-gray-100 mt-2" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mb-3" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5" {...props} />,
  li: ({ node, ...props }) => <li {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-blue-400 hover:underline" target="_blank" rel="noreferrer" {...props} />
  ),
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')

    if (!inline && match) {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus}
          chi
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

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id?: string }) => {
    const messageId = id || 'message';
    const index = 0;

    return (
      <div>
        <MemoizedMarkdownBlock
          content={content}
          key={`${messageId}-block_${index}`}
        />
      </div>
    );
  },
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';
