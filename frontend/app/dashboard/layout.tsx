'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { GroupTabBar } from '@/components/group-tab-bar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <GroupTabBar />
          <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}