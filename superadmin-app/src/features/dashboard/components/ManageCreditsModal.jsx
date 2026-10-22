import React, { useState, useEffect } from 'react';
import { Coins, X, Building2 } from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const ManageCreditsModal = ({ isOpen, onClose, onUpdated }) => {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [credits, setCredits] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const loadClients = async () => {
        setLoading(true);
        try {
          const res = await superAdminApiClient.get('/clients', { params: { limit: 100 } });
          const clientList = res.data.data.clients || [];
          setClients(clientList);
          if (clientList.length > 0) {
            setSelectedClientId(clientList[0].id || clientList[0]._id);
            setCurrentCredits(clientList[0].credits || 0);
            setCredits(clientList[0].credits || 0);
          }
        } catch (err) {
          console.error('Failed to load clients for credits', err);
        } finally {
          setLoading(false);
        }
      };
      loadClients();
    }
  }, [isOpen]);

  const handleClientChange = (id) => {
    setSelectedClientId(id);
    const found = clients.find((c) => String(c.id || c._id) === String(id));
    if (found) {
      setCurrentCredits(found.credits || 0);
      setCredits(found.credits || 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;
    setSubmitting(true);
    try {
      await superAdminApiClient.put(`/clients/${selectedClientId}/credits`, {
        credits: Number(credits),
      });
      alert('Client credits successfully updated!');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update credits');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Manage Client Credits</h3>
              <p className="text-[11px] text-slate-400">Allocate message & voice credits to tenant workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Select Client Workspace</label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.companyName} ({c.clientCode}) - Balance: {c.credits?.toLocaleString() || 0}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">Current Balance:</span>
            <span className="font-mono font-bold text-amber-400">
              {currentCredits !== null ? currentCredits.toLocaleString() : '...'} credits
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">New Credits Balance</label>
            <input
              type="number"
              min="0"
              required
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="e.g. 25000"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Directly sets the total available message & calling credits pool for this client.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              {submitting ? 'Saving...' : 'Update Credits'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
