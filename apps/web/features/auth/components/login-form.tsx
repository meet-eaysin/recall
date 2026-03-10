'use client';

import { GalleryVerticalEnd, Github, Chrome } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api';
import { useDevLogin } from '@/features/auth/hooks';
import { isDevAuthEnabled } from '@/lib/dev-auth';
import Link from 'next/link';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const devLogin = useDevLogin();
  const devAuthEnabled = isDevAuthEnabled();

  const handleDevLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!devAuthEnabled) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    await devLogin.mutateAsync({ email: email || undefined });
    window.location.href = '/';
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleDevLogin}>
        <Fieldset className="w-full max-w-none">
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Mind Stack</span>
            </Link>
            <h1 className="text-xl font-bold">Welcome to Mind Stack</h1>
            <p className="text-muted-foreground text-xs">
              Use OAuth for production or dev login for local testing.
            </p>
          </div>

          {devAuthEnabled ? (
            <>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                />
              </Field>
              <Field>
                <Button type="submit" disabled={devLogin.isPending}>
                  {devLogin.isPending ? 'Logging in…' : 'Login'}
                </Button>
              </Field>
            </>
          ) : null}

          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="bg-border h-px flex-1" />
            <span className="uppercase tracking-wide">Or</span>
            <span className="bg-border h-px flex-1" />
          </div>

          <Field className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                window.location.href = authApi.buildOAuthUrl('github');
              }}
            >
              <Github />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                window.location.href = authApi.buildOAuthUrl('google');
              }}
            >
              <Chrome />
              Continue with Google
            </Button>
          </Field>
        </Fieldset>
      </form>
      <p className="text-muted-foreground px-6 text-center text-xs">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}
