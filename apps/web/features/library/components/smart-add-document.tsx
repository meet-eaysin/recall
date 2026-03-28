'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { libraryApi } from '../api';
import { useFolders } from '../hooks';
import { Button } from '@/components/ui/button';
import {
  Loader2Icon,
  UploadCloudIcon,
  LinkIcon,
  FileIcon,
  XIcon,
  TypeIcon,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';

interface SmartAddDocumentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultFolderId?: string;
}

export function SmartAddDocument({
  onSuccess,
  onCancel,
  defaultFolderId,
}: SmartAddDocumentProps) {
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = React.useState(false);
  const [sourceInput, setSourceInput] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [folderId, setFolderId] = React.useState<string | undefined>(
    defaultFolderId,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: folders = [] } = useFolders();

  const resetForm = () => {
    setSourceInput('');
    setTitle('');
    setDescription('');
    setSelectedFile(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (sourceInput.trim()) {
        formData.append('source', sourceInput.trim());
      } else {
        throw new Error('Please provide a file or a URL.');
      }

      if (folderId && folderId !== 'none') {
        formData.append('folderIds', folderId);
      }

      if (title.trim()) {
        formData.append('title', title.trim());
      }

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      return libraryApi.createDocument(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY.ROOT });
      toast.success('Document added successfully! AI is processing it.');
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add document.');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setSourceInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSourceInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !sourceInput.trim()) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-40 px-4 py-6 text-center border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:bg-muted/50 cursor-pointer',
          selectedFile ? 'bg-muted/30 border-solid' : '',
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,text/plain"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 relative">
            <div className="p-3 bg-background rounded-full shadow-sm">
              <FileIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium truncate max-w-[200px]">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute -top-3 -right-8 size-6 rounded-full bg-muted hover:bg-destructive hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <XIcon className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="p-3 bg-background rounded-full shadow-sm mb-1">
              <UploadCloudIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDFs, Images, or Text Files
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center w-full">
        <div className="border-t border-border/50 grow"></div>
        <span className="px-3 text-xs uppercase text-muted-foreground font-medium">
          OR Paste URL
        </span>
        <div className="border-t border-border/50 grow"></div>
      </div>

      {/* URL Input */}
      <div className="relative">
        <InputGroup>
          <InputGroupAddon>
            <LinkIcon className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            className="border-0 shadow-none focus-visible:ring-0"
            placeholder="https://example.com/article"
            type="url"
            value={sourceInput}
            onChange={(e) => {
              setSourceInput(e.target.value);
              if (e.target.value.trim() && selectedFile) {
                setSelectedFile(null);
              }
            }}
            disabled={!!selectedFile || mutation.isPending}
          />
        </InputGroup>
      </div>

      {/* Metadata: Title & Description */}
      <div className="flex flex-col gap-4 pt-2 mt-2 border-t border-border/50">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="name"
            className="text-[11px] font-bold text-muted-foreground/80"
          >
            Document Name (Optional)
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <TypeIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="name"
              placeholder="e.g. My Document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mutation.isPending}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="desc"
            className="text-[11px] font-bold text-muted-foreground/80"
          >
            Description (Optional - AI will generate if empty)
          </Label>
          <InputGroup>
            <InputGroupTextarea
              id="desc"
              placeholder="Brief summary of what this document is about..."
              className="min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={mutation.isPending}
            />
          </InputGroup>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        <label className="text-[11px] font-bold text-muted-foreground/80">
          Save to Folder (Optional)
        </label>
        <Select
          value={folderId ?? 'none'}
          onValueChange={(v) => setFolderId(v === 'none' ? undefined : v)}
          disabled={mutation.isPending}
        >
          <SelectTrigger className="h-10 text-sm">
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No folder</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="min-w-[120px]"
          disabled={
            (!selectedFile && !sourceInput.trim()) || mutation.isPending
          }
        >
          {mutation.isPending ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add to Library'
          )}
        </Button>
      </div>
    </form>
  );
}
