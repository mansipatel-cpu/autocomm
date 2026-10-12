import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppPageHeader } from './AppPageHeader';

export const Layout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FB]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto bg-[#F8F9FB]">
          <div className="w-full px-4 md:px-8 lg:px-10 py-6 md:py-8">
            <AppPageHeader />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
