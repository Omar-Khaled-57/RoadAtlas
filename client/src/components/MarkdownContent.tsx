import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  headingLevel?: 2 | 3 | 4;
}

/**
 * Renders user-authored Markdown. All headings are flattened to one level so
 * note content can never break the page's heading order (WCAG 1.3.1).
 */
export function MarkdownContent({ content, headingLevel = 3 }: MarkdownContentProps) {
  if (!content.trim()) return null;

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const headings = {
    h1: Heading,
    h2: Heading,
    h3: Heading,
    h4: Heading,
    h5: Heading,
    h6: Heading,
  } as Record<string, 'h2' | 'h3' | 'h4'>;

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...headings,
          a: ({ href, children, ...props }: ComponentProps<'a'>) => {
            const external = Boolean(href && /^https?:\/\//i.test(href));
            return (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
