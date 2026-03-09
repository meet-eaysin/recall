'use client';

import * as React from 'react';
import { useDocuments } from '@/lib/api/documents';
import { cn } from '@/lib/utils';

type TextareaProps = React.ComponentProps<'textarea'>;

export const MentionTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ onChange, onKeyDown, value, ...props }, ref) => {
  // Basic `@` mention state
  const [mentionSearch, setMentionSearch] = React.useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const internalRef = React.useRef<HTMLTextAreaElement>(null);

  // Fetch documents to show in dropdown
  const { data } = useDocuments(1, 10);

  // Filter documents based on current @search
  const suggestions = React.useMemo(() => {
    const docs = data?.items || [];
    if (mentionSearch === null) return [];
    const lowerSearch = mentionSearch.toLowerCase();
    return docs
      .filter(
        (d) =>
          d.title.toLowerCase().includes(lowerSearch) ||
          d.source.toLowerCase().includes(lowerSearch),
      )
      .slice(0, 5);
  }, [mentionSearch, data?.items]);

  // Handle typing to detect `@`
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Look backwards from cursor for an `@` symbol
    const textBeforeCursor = val.slice(0, cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSignIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSignIndex + 1);
      // If there are no spaces after the @, we might be searching
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        // Very basic visual positioning for demonstration
        setCursorCoords({
          top: 30,
          left: 16 + (textBeforeCursor.length % 40) * 8,
        });
      } else {
        setMentionSearch(null);
      }
    } else {
      setMentionSearch(null);
    }

    onChange?.(e);
  };

  const insertMention = (title: string, id: string) => {
    if (!internalRef.current) return;
    const textarea = internalRef.current;
    const val = textarea.value;
    const cursorPosition = textarea.selectionStart;

    const textBeforeCursor = val.slice(0, cursorPosition);
    const textAfterCursor = val.slice(cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSignIndex !== -1) {
      // Build the new text
      const beforeAt = val.slice(0, lastAtSignIndex);
      // Insert custom format [Title](id)
      const newText = `${beforeAt}@[${title}](${id}) ${textAfterCursor}`;

      // Native event dispatch so react-hook-form picks it up
      const event = {
        target: { value: newText },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange?.(event);

      // Reset state
      setMentionSearch(null);
    }
  };

  return (
    <div className="relative w-full">
      <Textarea
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;

          if (node) internalRef.current = node;
        }}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (mentionSearch !== null && e.key === 'Escape') {
            setMentionSearch(null);
          }
          onKeyDown?.(e);
        }}
        value={value}
        {...props}
      />

      {/* Floating Dropdown */}
      {mentionSearch !== null && suggestions.length > 0 && cursorCoords && (
        <div
          className="absolute z-50 mt-1 min-w-[240px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
          style={{
            top: cursorCoords.top,
            left: Math.min(cursorCoords.left, 200),
          }}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50">
            Link Documents
          </div>
          <div className="p-1 max-h-48 overflow-auto">
            {suggestions.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="w-full text-left relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                onClick={() => insertMention(doc.title, doc.id)}
              >
                <span className="truncate">{doc.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MentionTextarea.displayName = 'MentionTextarea';

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <span
      className="relative inline-flex w-full rounded-lg border border-input bg-background text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] has-focus-within:border-ring has-focus-within:ring-[3px] has-aria-invalid:border-destructive/36 has-focus-within:has-aria-invalid:border-destructive/64 has-focus-within:has-aria-invalid:ring-destructive/16 has-disabled:opacity-64 sm:text-sm dark:bg-input/32"
      data-slot="textarea-control"
    >
      <textarea
        className={cn(
          'field-sizing-content min-h-20 w-full rounded-[inherit] bg-transparent px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none',
          className,
        )}
        data-slot="textarea"
        {...props}
      />
    </span>
  );
}
