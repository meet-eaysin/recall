import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { GithubIcon, YoutubeIcon } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative">
      <div
        className={cn(
          'mx-auto max-w-6xl lg:border-x px-4 py-12',
          'dark:bg-[radial-gradient(35%_80%_at_15%_0%,--theme(--color-foreground/.1),transparent)]',
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px w-full bg-border" />

        <div className="flex flex-col items-center justify-center gap-8 text-center">
          <a className="w-max" href="#top">
            <Logo className="h-6" />
          </a>

          <p className="max-w-md text-balance text-muted-foreground text-sm leading-relaxed">
            Recall is a personal knowledge engine designed to help you organize
            everything you read, watch, and research. Open source and private by
            default.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((item, index) => (
              <Button
                key={`social-${item.link}-${index}`}
                size="icon-sm"
                variant="ghost"
                className="hover:text-primary transition-colors"
                render={<Link href={item.link} target="_blank" />}
              >
                {item.icon}
              </Button>
            ))}
          </div>

          <div className="pt-8 w-full border-t">
            <p className="text-muted-foreground text-xs font-light">
              &copy; {new Date().getFullYear()} Recall. Built with passion for
              knowledge explorers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

const socialLinks = [
  {
    icon: <GithubIcon className="size-5" />,
    link: 'https://github.com/meet-eaysin/recall',
  },
  {
    icon: <XIcon className="size-4" />,
    link: '#',
  },
  {
    icon: <YoutubeIcon className="size-5" />,
    link: '#',
  },
];

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="m18.9,1.153h3.682l-8.042,9.189,9.46,12.506h-7.405l-5.804-7.583-6.634,7.583H.469l8.6-9.831L0,1.153h7.593l5.241,6.931,6.065-6.931Zm-1.293,19.494h2.039L6.482,3.239h-2.19l13.314,17.408Z" />
    </svg>
  );
}
