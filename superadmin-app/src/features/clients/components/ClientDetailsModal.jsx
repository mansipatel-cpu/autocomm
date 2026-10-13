import React from 'react';
import { X, Building2, Mail, Phone, Calendar, Clock, Coins, Hash, ShieldCheck, KeyRound } from 'lucide-react';

export const ClientDetailsModal = ({ isOpen, onClose, client, onManageCredits, onManagePhones }) => {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{client.companyName}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                {client.clientCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tenant Workspace & Configuration Profile</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Admin Info */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-300 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Administrative Contact
            </h3>
            <div className="space-y-1.5 text-slate-400">
              <div>
                <span className="text-slate-500 block text-[11px]">Admin Contact:</span>
                <span className="text-slate-200 font-medium">{client.adminName || 'Admin'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Address:</span>
                <span className="text-slate-200 font-medium">{client.adminEmail}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Direct Phone:</span>
                <span className="text-slate-200 font-medium">{client.contactNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Subscription & Credits */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-300 flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> Plan & Usage
            </h3>
            <div className="space-y-1.5 text-slate-400">
              <div>
                <span className="text-slate-500 block text-[11px]">Subscription Tier:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-semibold inline-block mt-0.5">
                  {client.plan || 'Starter'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Available Credits:</span>
                <span className="text-white font-bold text-sm">
                  {client.credits?.toLocaleString() || 0} units
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tenant Status:</span>
                <span className={`font-semibold capitalize ${
                  client.status === 'active' ? 'text-emerald-400' : client.status === 'suspended' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {client.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Phone Numbers */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-rose-400" /> Assigned Phone Numbers
              </h3>
              {onManagePhones && (
                <button
                  onClick={() => onManagePhones(client)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Manage
                </button>
              )}
            </div>
            {client.phoneNumbers && client.phoneNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {client.phoneNumbers.map((num, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                    {num}
                  </span>
                ))}
              </div>
            ) : client.assignedPhoneNumber ? (
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                {client.assignedPhoneNumber}
              </span>
            ) : (
              <p className="text-slate-500 italic">No dedicated carrier numbers assigned.</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-sky-400" /> Account Timeline
            </h3>
            <div className="space-y-1.5 text-slate-400">
              <div>
                <span className="text-slate-500 block text-[11px]">Account Provisioned:</span>
                <span className="text-slate-200">
                  {client.createdAt ? new Date(client.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Last Workspace Login:</span>
                <span className="text-slate-200">
                  {client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3 text-xs">
          {onManageCredits && (
            <button
              onClick={() => onManageCredits(client)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Adjust Credits
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
