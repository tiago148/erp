'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { findActiveGroup, isItemActive } from '@/lib/nav';

export function GroupTabBar() {
  const pathname = usePathname();
  const group = findActiveGroup(pathname);

  if (!group || group.items.length <= 1) return null;

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-6">
      {group.items.map((item) => {
        const active = isItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
