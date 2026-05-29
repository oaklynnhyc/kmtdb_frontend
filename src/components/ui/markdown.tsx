import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownProps {
  children: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-lg font-bold mt-4 mb-2 ink-text">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold mt-3 mb-1.5 ink-text">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-2.5 mb-1 ink-text">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-gray-700 mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside text-sm text-gray-700 space-y-0.5 mb-2 pl-5 [&_ul]:list-[circle]">{children}</ul>
  ),
  ol: ({ children, start }) => (
    <ol start={start} className="list-decimal list-outside text-sm text-gray-700 space-y-0.5 mb-2 pl-5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed pl-0.5">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-800">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code className="block bg-neutral-100 rounded p-3 text-xs font-mono text-neutral-700 overflow-x-auto my-2 whitespace-pre-wrap">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-neutral-100 rounded px-1.5 py-0.5 text-xs font-mono text-neutral-700">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-[var(--gold)]/40 pl-3 my-2 text-gray-600 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-xs border-collapse border border-gray-200 rounded">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-neutral-50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-2 py-1 text-gray-600">{children}</td>
  ),
  hr: () => (
    <hr className="my-3 border-gray-200" />
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-[var(--jade)] hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ children, className = '' }: MarkdownProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
