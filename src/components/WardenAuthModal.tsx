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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-sm pb-safe pt-safe">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3.5 sm:mb-4">
          <Shield className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Warden Verification</h3>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Enter authorized passcode to access the management panel.
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
                inputMode="text"
                placeholder="Enter Passcode"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className={`w-full min-h-[46px] bg-slate-800 border ${
                  error ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                } rounded-xl pl-10 pr-4 py-2.5 text-base font-mono text-center focus:outline-none focus:border-cyan-400 transition`}
              />
            </div>
            {error && (
              <span className="block text-[11px] text-rose-400 mt-1.5 font-medium">
                Incorrect passcode. Please try again.
              </span>
            )}
          </div>

          {/* Stay Logged In / Remember Passcode Checkbox */}
          <div className="pt-0.5 text-left bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-200">
              <input
                type="checkbox"
                checked={rememberPasscode}
                onChange={(e) => setRememberPasscode(e.target.checked)}
                className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-400 border-slate-700 bg-slate-800 cursor-pointer h-4 w-4"
              />
              <div className="flex-1">
                <span className="font-semibold text-white">Stay logged in on this phone</span>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  You won't have to enter the passcode again on this device.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer active:scale-[0.98]"
          >
            <span>Unlock & Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
