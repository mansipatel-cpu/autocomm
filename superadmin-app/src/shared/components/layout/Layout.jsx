import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070a12] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0c111e] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Platform Topology:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All Nodes Online (Node-US-01, Node-EU-01)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="px-2.5 py-1 bg-indigo-950/60 text-indigo-300 rounded border border-indigo-500/30 font-mono">
              Multi-Tenant Architecture v1.0
            </span>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
