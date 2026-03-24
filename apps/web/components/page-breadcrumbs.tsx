'use client';

import Link from 'next/link';
import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type PageBreadcrumbItem = {
  href?: string;
  icon?: React.ReactNode;
  label: string;
};

export function PageBreadcrumbs({
  className,
  current,
  items,
}: {
  className?: string;
  current: string;
  items: PageBreadcrumbItem[];
}) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="gap-1 text-xs sm:gap-1.5">
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink
                  render={<Link href={item.href} />}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.icon}
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground">
                  {item.icon}
                  {item.label}
                </span>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="opacity-50" />
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-md truncate rounded-md px-1.5 py-0.5 text-xs font-medium text-foreground/90">
            {current}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
