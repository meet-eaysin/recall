import Link from 'next/link';
import {
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Security = () => {
    return (
              <section className="border-t border-subtle bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Security + reliability
            </p>
            <h3 className="text-2xl font-semibold text-foreground">
              Built with production-grade auth and auditability.
            </h3>
            <p className="text-subtle max-w-xl">
              Sessions are revocable, tokens are short-lived, and every answer
              is traceable back to source material.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                <CheckCheck className="size-3.5" />
                HTTP-only cookies
              </span>
              <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                <CheckCheck className="size-3.5" />
                Session revocation
              </span>
              <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                <CheckCheck className="size-3.5" />
                OAuth ready
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/auth/login" />}>
              Start free
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" render={<Link href="/app/settings" />}>
              Configure workspace
            </Button>
          </div>
        </div>
      </section>
    );
};

export default Security;
