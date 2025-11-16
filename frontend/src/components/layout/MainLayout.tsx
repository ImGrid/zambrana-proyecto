import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cemento-50">
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Sidebar className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-64" />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
