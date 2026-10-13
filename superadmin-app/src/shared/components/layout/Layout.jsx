import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070a12] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">


        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
