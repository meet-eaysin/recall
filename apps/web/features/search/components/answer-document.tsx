'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Block =
  | { type: 'heading'; depth: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; code: string; language: string | null };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || null;
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }

      if (index < lines.length) index += 1;
      blocks.push({
        type: 'code',
        code: codeLines.join('\n'),
        language,
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const [, hashes = '', headingText = ''] = headingMatch;
      blocks.push({
        type: 'heading',
        depth: hashes.length,
        text: headingText,
      });
      index += 1;
      continue;
    }

    if (/^([-*+])\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];

      while (index < lines.length) {
        const candidate = (lines[index] ?? '').trim();
        if (!candidate) break;
        const matches = ordered
          ? candidate.match(/^\d+\.\s+(.*)$/)
          : candidate.match(/^[-*+]\s+(.*)$/);
        if (!matches) break;
        items.push(matches[1] ?? '');
        index += 1;
      }

      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index] ?? '';
      const candidateTrimmed = candidate.trim();

      if (
        !candidateTrimmed ||
        candidateTrimmed.startsWith('```') ||
        /^(#{1,6})\s+/.test(candidateTrimmed) ||
        /^[-*+]\s+/.test(candidateTrimmed) ||
        /^\d+\.\s+/.test(candidateTrimmed)
      ) {
        break;
      }

      paragraphLines.push(candidateTrimmed);
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <a
        key={`${match[2]}-${match.index}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-4"
      >
        {match[1]}
      </a>,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

const headingClassNames = {
  1: 'text-2xl font-semibold tracking-tight',
  2: 'text-xl font-semibold tracking-tight',
  3: 'text-lg font-semibold tracking-tight',
  4: 'text-base font-semibold',
  5: 'text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground',
  6: 'text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground',
} as const;

function Heading({
  children,
  className,
  depth,
}: {
  children: ReactNode;
  className: string;
  depth: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  switch (depth) {
    case 1:
      return <h1 className={className}>{children}</h1>;
    case 2:
      return <h2 className={className}>{children}</h2>;
    case 3:
      return <h3 className={className}>{children}</h3>;
    case 4:
      return <h4 className={className}>{children}</h4>;
    case 5:
      return <h5 className={className}>{children}</h5>;
    default:
      return <h6 className={className}>{children}</h6>;
  }
}

export function AnswerDocument({
  className,
  content,
}: {
  className?: string;
  content: string;
}) {
  const blocks = parseBlocks(content);

  return (
    <div
      className={cn(
        'max-w-none space-y-4 text-sm leading-7 text-foreground',
        className,
      )}
    >
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const depth = Math.min(block.depth, 6) as 1 | 2 | 3 | 4 | 5 | 6;
          return (
            <Heading
              key={`${block.type}-${index}`}
              depth={depth}
              className={headingClassNames[depth]}
            >
              {renderInline(block.text)}
            </Heading>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={`${block.type}-${index}`}
              className={cn(
                'space-y-2 pl-5 text-sm leading-7',
                block.ordered ? 'list-decimal' : 'list-disc',
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item.slice(0, 24)}`}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'code') {
          return (
            <div
              key={`${block.type}-${index}`}
              className="overflow-hidden rounded-xl border border-border bg-neutral-950 text-neutral-100"
            >
              {block.language ? (
                <div className="border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                  {block.language}
                </div>
              ) : null}
              <pre className="overflow-x-auto px-4 py-4 text-xs leading-6">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        return (
          <p key={`${block.type}-${index}`} className="text-sm leading-7 text-foreground">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
