'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, FolderOpen } from 'lucide-react';
import { useCreateFolder } from '../hooks';

// Colors expressed as Tailwind bg/ring utility classes — zero hardcoded hex
const FOLDER_COLORS = [
  { label: 'Sky', bg: 'bg-sky-500', ring: 'ring-sky-500/40' },
  { label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-500/40' },
  { label: 'Indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500/40' },
  { label: 'Violet', bg: 'bg-violet-500', ring: 'ring-violet-500/40' },
  { label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-500/40' },
  { label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-500/40' },
  { label: 'Amber', bg: 'bg-amber-400', ring: 'ring-amber-400/40' },
  { label: 'Lime', bg: 'bg-lime-500', ring: 'ring-lime-500/40' },
  { label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500/40' },
  { label: 'Teal', bg: 'bg-teal-500', ring: 'ring-teal-500/40' },
  { label: 'Slate', bg: 'bg-slate-500', ring: 'ring-slate-500/40' },
  { label: 'Zinc', bg: 'bg-zinc-500', ring: 'ring-zinc-500/40' },
] as const;

type FolderColor = (typeof FOLDER_COLORS)[number];

interface FolderCreateDialogProps {
  trigger?: React.ReactElement;
}

export function FolderCreateDialog({ trigger }: FolderCreateDialogProps) {
  const [selectedColor, setSelectedColor] = React.useState<FolderColor>(
    FOLDER_COLORS[0],
  );
  const [name, setName] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const mutation = useCreateFolder();

  const canSubmit = name.trim().length > 0 && !mutation.isPending;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    await mutation.mutateAsync({
      color: selectedColor.label.toLowerCase(),
      name: name.trim(),
    });

    setName('');
    setSelectedColor(FOLDER_COLORS[0]);
    setOpen(false);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? <Button variant="outline">New Folder</Button>}
        </DialogTrigger>

        <DialogContent className="gap-0 p-0 sm:max-w-[400px]">
          {/* Header */}
          <DialogHeader className="px-6 pb-4 pt-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted">
              <FolderOpen className="size-5 text-muted-foreground" />
            </div>
            <DialogTitle className="text-base font-semibold">
              Create folder
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Group related documents into a named folder.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 px-6 py-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="folder-name" className="text-sm font-medium">
                  Folder name
                </Label>
                <Input
                  id="folder-name"
                  placeholder="e.g. Research, Reading queue…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Color</Label>
                  <Badge variant="secondary" className="font-normal">
                    {selectedColor.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {FOLDER_COLORS.map((c) => {
                    const isActive = c.label === selectedColor.label;
                    return (
                      <Tooltip key={c.label}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={c.label}
                            aria-pressed={isActive}
                            onClick={() => setSelectedColor(c)}
                            className={cn(
                              'relative flex size-9 items-center justify-center rounded-lg transition-all duration-150',
                              c.bg,
                              'opacity-75 hover:opacity-100 hover:scale-105',
                              isActive && [
                                'opacity-100 scale-105',
                                'ring-2 ring-offset-2 ring-offset-background',
                                c.ring,
                              ],
                            )}
                          >
                            {isActive && (
                              <Check
                                className="size-3.5 text-white drop-shadow-sm"
                                strokeWidth={2.5}
                              />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {c.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Color helps you identify the folder at a glance.
                </p>
              </div>

              {/* Error */}
              {mutation.error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {mutation.error.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!canSubmit}>
                {mutation.isPending ? 'Creating…' : 'Create folder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
