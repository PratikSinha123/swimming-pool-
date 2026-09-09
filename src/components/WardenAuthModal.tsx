import React, { useState } from 'react';
import { Shield, Lock, X, ArrowRight } from 'lucide-react';

interface WardenAuthModalProps {
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const WardenAuthModal: React.FC<WardenAuthModalProps> = ({
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === (correctPin || 'Ramesh1234')) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Warden Verification</h3>
        <p className="text-xs text-slate-400 mb-6">
          Enter your authorized passcode to access the management dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={32}
                autoFocus
                required
                placeholder="Enter Passcode"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-slate-800 border ${
                  error ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-center focus:outline-none focus:border-cyan-400 transition`}
              />
            </div>
            {error && (
              <span className="block text-[11px] text-rose-400 mt-1.5 font-medium">
                Incorrect passcode. Please try again.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
