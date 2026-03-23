import {
  Card,
  CardDescription,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import type { FolderRow } from '../types';

export function FolderShelfCard({
  active,
  description,
  folder,
  icon: Icon,
  name,
  onClick,
}: {
  active: boolean;
  description: string;
  folder?: FolderRow;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={[
          'h-full transition-colors duration-150',
          active
            ? 'border-primary/40 bg-accent'
            : 'hover:border-border hover:bg-accent',
        ].join(' ')}
      >
        <CardHeader className="p-3.5 pb-2">
          <div className="flex items-start gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: folder?.color ?? '#64748b' }}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="truncate text-sm leading-5">
                  {name}
                </CardTitle>
                {active ? (
                  <span className="shrink-0 text-[11px] font-medium text-primary">
                    Active
                  </span>
                ) : null}
              </div>
              <CardDescription className="line-clamp-2 text-[13px] leading-5">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between px-3.5 pb-3.5 pt-0">
          <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
            {folder ? 'Folder' : 'Library'}
          </span>
          <span className="text-xs text-muted-foreground">
            {active ? 'Viewing' : 'Open'}
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
