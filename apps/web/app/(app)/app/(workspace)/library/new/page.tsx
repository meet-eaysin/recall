import { AddDocumentForm } from '@/features/library/components/add-document-form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AppLibraryNewPage() {
  const endpoints = ['POST /documents'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Add to Library</h1>
        <p className="text-muted-foreground">
          Save a new link or document to your knowledge base.
        </p>
      </header>

      <div className="grid gap-6">
        <Card className="border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="px-5 py-4">
            <CardTitle>Add to Library</CardTitle>
            <CardDescription>
              Input a URL to save for later, or manually create a knowledge
              note. Type @ in the notes field to mention other documents.
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-4 px-5 pb-5 pt-0">
            {endpoints.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Backend endpoints
                </h3>
                <div className="flex flex-wrap gap-2">
                  {endpoints.map((endpoint) => (
                    <Badge
                      key={endpoint}
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {endpoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border/40">
              <AddDocumentForm />
            </div>
          </CardPanel>
        </Card>
      </div>
    </div>
  );
}
