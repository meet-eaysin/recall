'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function ResizableDocumentPreview({
  isOpen,
  onClose,
  children,
  title = 'Document Preview',
}: Props) {
  const [width, setWidth] = React.useState(600);
  const [isResizing, setIsResizing] = React.useState(false);

  // Load width from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('recall-preview-width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 300) setWidth(parsed);
    }
  }, []);

  // Persist width
  const saveWidth = (w: number) => {
    localStorage.setItem('recall-preview-width', w.toString());
  };

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        // Constraints: Min 300, Max 90% of screen
        if (newWidth > 300 && newWidth < window.innerWidth * 0.9) {
          setWidth(newWidth);
          saveWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for outside click - sits exactly on top of chat area */}
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full z-50 bg-background border-l shadow-2xl flex flex-col transition-none',
          isResizing && 'select-none',
        )}
        style={{ width: `${width}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/10 transition-colors z-100 group"
          onMouseDown={startResizing}
        >
          {/* Subtle grab handle indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-10 w-1 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors" />
        </div>

        {/* Content Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 space-y-0 shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground/80 lowercase">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="hover:bg-muted p-1 h-7 w-7"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Child Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
