import React, { useState } from 'react';
import { Shield, Lock, X, ArrowRight } from 'lucide-react';
import { setWardenDeviceAuthenticated } from '../utils/storage';

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
  const [rememberPasscode, setRememberPasscode] = useState(true);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEntered = pin.trim();
    const expected = (correctPin || 'Ramesh1234').trim();

    if (cleanEntered === expected) {
      setWardenDeviceAuthenticated(rememberPasscode);
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

          {/* Stay Logged In / Remember Passcode Checkbox */}
          <div className="pt-0.5 text-left bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-200">
              <input
                type="checkbox"
                checked={rememberPasscode}
                onChange={(e) => setRememberPasscode(e.target.checked)}
                className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-400 border-slate-700 bg-slate-800 cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-semibold text-white">Stay logged in on this device</span>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  You won't have to enter the passcode again on this device.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer"
          >
            <span>Unlock & Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
