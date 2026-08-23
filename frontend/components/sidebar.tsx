'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getVisibleNavGroups, isItemActive } from '@/lib/nav';
import { useAuth } from '@/context/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const groups = getVisibleNavGroups(user?.allowedModules);

  return (
    <aside className="w-[68px] shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col items-center overflow-y-auto py-3 gap-0.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary bg-gradient-to-br from-secondary to-background mb-3">
        <span className="font-heading text-base leading-none text-primary">OP</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-0.5">
        {groups.map((group) => {
          const target = group.items[0];
          const Icon = target.icon;
          const active = group.items.some((item) => isItemActive(item.href, pathname));

          return (
            <div key={group.id} className="group relative">
              <Link
                href={target.href}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                  active
                    ? 'border-sidebar-primary/40 bg-sidebar-primary/10 text-sidebar-primary'
                    : 'border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <Icon size={18} />
              </Link>
              <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                {group.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
