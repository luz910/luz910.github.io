import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Texto con formato (negritas, títulos, listas, enlaces, tablas). No ejecuta HTML. */
export function Markdown({ children, className = '' }: { children?: string | null; className?: string }) {
  if (!children?.trim()) return null;
  return (
    <div className={`prose-bq ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const ext = href?.startsWith('http');
            return <a href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
          },
          img: ({ src, alt }) => <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
