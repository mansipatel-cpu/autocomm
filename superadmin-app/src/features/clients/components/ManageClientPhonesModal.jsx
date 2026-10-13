import React, { useState, useEffect } from 'react';
import { X, Hash, Plus, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const ManageClientPhonesModal = ({ isOpen, onClose, client, onUpdated }) => {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      const existing = client.phoneNumbers || (client.assignedPhoneNumber ? [client.assignedPhoneNumber] : []);
      setPhoneNumbers(existing);
      setNewNumber('');
      setError('');
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleAddNumber = () => {
    const trimmed = newNumber.trim();
    if (!trimmed) return;
    if (phoneNumbers.includes(trimmed)) {
      setError('This phone number is already in the list.');
      return;
    }
    setPhoneNumbers([...phoneNumbers, trimmed]);
    setNewNumber('');
    setError('');
  };

  const handleRemoveNumber = (index) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await superAdminApiClient.put(`/clients/${client._id}/phone-numbers`, {
        phoneNumbers,
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update assigned phone numbers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Manage Phone Numbers</h2>
            <p className="text-xs text-slate-400">{client.companyName} ({client.clientCode})</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Single-Tenant Exclusivity Rule:</strong> A carrier phone number can be assigned to exactly one client workspace. Assigning a number binds it exclusively to this tenant.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Add input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. +14155552671"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddNumber}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Current Numbers List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {phoneNumbers.length === 0 ? (
              <p className="text-slate-500 italic py-2">No phone numbers currently assigned.</p>
            ) : (
              phoneNumbers.map((num, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs"
                >
                  <span>{num}</span>
                  <button
                    onClick={() => handleRemoveNumber(i)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Remove number"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
