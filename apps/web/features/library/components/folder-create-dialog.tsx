import * as React from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Form } from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { Check, FolderOpen } from 'lucide-react';
import { useCreateFolder } from '../hooks';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

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

const schema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100),
  color: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface FolderCreateDialogProps {
  trigger?: React.ReactElement;
}

export function FolderCreateDialog({ trigger }: FolderCreateDialogProps) {
  const [open, setOpen] = React.useState(false);
  const mutation = useCreateFolder();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      color: FOLDER_COLORS[0].label,
    },
  });

  const selectedColorLabel = form.watch('color');
  const selectedColor =
    FOLDER_COLORS.find((c) => c.label === selectedColorLabel) ??
    FOLDER_COLORS[0];

  const onFormSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        name: values.name,
        color: values.color.toLowerCase(),
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          toast.success('Folder created', {
            description: `"${values.name}" is now ready.`,
          });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.details?.length) {
            error.details.forEach((detail) => {
              const field = detail.field as keyof FormValues;
              if (field === 'name' || field === 'color') {
                form.setError(field, {
                  type: 'server',
                  message: detail.messages[0],
                });
              }
            });
          }
        },
      },
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? <Button variant="outline">New Folder</Button>}
        </DialogTrigger>

        <DialogContent className="gap-0 p-0 sm:max-w-[420px]">
          <FormProvider {...form}>
            <Form
              className="flex flex-col gap-0"
              onSubmit={form.handleSubmit(onFormSubmit)}
            >
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

              <div className="space-y-6 px-6 py-5">
                {/* Name */}
                <Field>
                  <FieldLabel
                    htmlFor="folder-name"
                    className="text-sm font-medium"
                  >
                    Folder name
                  </FieldLabel>
                  <Input
                    {...form.register('name')}
                    id="folder-name"
                    placeholder="e.g. Research, Reading queue…"
                    autoComplete="off"
                    autoFocus
                    className={cn(
                      'h-10 transition-all focus:bg-background',
                      form.formState.errors.name
                        ? 'border-destructive/50 focus-visible:ring-destructive/20'
                        : 'bg-muted/5',
                    )}
                  />
                  {form.formState.errors.name && (
                    <FieldError>
                      {form.formState.errors.name.message}
                    </FieldError>
                  )}
                </Field>

                {/* Color */}
                <Field className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-sm font-medium">
                      Color
                    </FieldLabel>
                    <Badge
                      variant="secondary"
                      className="font-normal capitalize text-[10px] h-5"
                    >
                      {selectedColor.label}
                    </Badge>
                  </div>

                  <Controller
                    name="color"
                    control={form.control}
                    render={({ field }) => (
                      <div className="grid grid-cols-6 gap-2">
                        {FOLDER_COLORS.map((c) => {
                          const isActive = c.label === field.value;
                          return (
                            <Tooltip key={c.label}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={c.label}
                                  aria-pressed={isActive}
                                  onClick={() => field.onChange(c.label)}
                                  className={cn(
                                    'relative flex size-9 items-center justify-center rounded-lg transition-all duration-150',
                                    c.bg,
                                    'opacity-75 hover:opacity-100 hover:scale-105',
                                    isActive && [
                                      'opacity-100 scale-110 shadow-sm',
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
                              <TooltipContent
                                side="bottom"
                                className="text-[10px] px-2 py-1"
                              >
                                {c.label}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground/80">
                    Choose a color to help identify this folder visually.
                  </p>
                </Field>

                {/* Mutation-level Error (Non-field specific) */}
                {mutation.error &&
                  !form.formState.errors.name &&
                  !form.formState.errors.color && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {mutation.error.message}
                    </p>
                  )}
              </div>

              <Separator />

              {/* Footer */}
              <DialogFooter className="px-6 py-4 sm:justify-end gap-2 bg-muted/5">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!form.formState.isValid || mutation.isPending}
                  className="min-w-[100px]"
                >
                  {mutation.isPending ? 'Creating…' : 'Create folder'}
                </Button>
              </DialogFooter>
            </Form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
