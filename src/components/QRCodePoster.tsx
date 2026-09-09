import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { PoolSettings } from '../types';
import { format24To12 } from '../utils/timeUtils';
import { Download, Printer, X, Waves, ExternalLink } from 'lucide-react';

interface QRCodePosterProps {
  settings: PoolSettings;
  onClose: () => void;
}

export const QRCodePoster: React.FC<QRCodePosterProps> = ({ settings, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [targetUrl, setTargetUrl] = useState(
    settings.appUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  );
  const [qrGenerated, setQrGenerated] = useState(false);

  const openTime12 = format24To12(settings.openTime);
  const closeTime12 = format24To12(settings.closeTime);

  useEffect(() => {
    if (!canvasRef.current || !targetUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      targetUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0369a1', // ocean blue
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          console.error('QR code generation error:', error);
        } else {
          setQrGenerated(true);
        }
      }
    );
  }, [targetUrl]);

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `pool-entry-qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:static print:inset-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 print:border-0 print:shadow-none print:bg-white print:text-black print:p-8 print:max-w-none">
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Poster Container */}
        <div id="printable-poster" className="flex flex-col items-center text-center">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold uppercase tracking-wider mb-3 print:border-cyan-800 print:text-cyan-800">
            <Waves className="w-4 h-4 text-cyan-400 print:text-cyan-800" />
            {settings.hostelName || 'Hostel Campus'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 print:text-black">
            {settings.poolName || 'Swimming Pool Entry'}
          </h2>
          <p className="text-sm text-slate-400 mb-6 print:text-slate-600">
            Scan with your mobile camera to check in & enter the pool
          </p>

          {/* QR Code Frame */}
          <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/40 mb-5 print:border-slate-800">
            <canvas ref={canvasRef} className="rounded-xl w-64 h-64 sm:w-72 sm:h-72 object-contain" />
          </div>

          {/* Operating Hours Banner */}
          <div className="w-full bg-cyan-950/40 border border-cyan-800/40 rounded-2xl p-4 mb-4 text-left print:bg-slate-50 print:border-slate-300">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-2 print:text-cyan-900">
              <span>Pool Operating Hours</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-medium print:bg-emerald-100 print:text-emerald-800">
                Daily
              </span>
            </div>
            <div className="text-lg font-bold text-white print:text-black flex items-center justify-between">
              <span>{openTime12} – {closeTime12}</span>
              <span className="text-xs font-normal text-slate-400 print:text-slate-600">
                Registration Required
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-cyan-900/60 print:border-slate-200 text-[11px] text-slate-400 print:text-slate-600">
              <span className="font-semibold text-cyan-300 print:text-cyan-900 block mb-0.5">Closed During Meal Intervals:</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span>• Breakfast: 7:30 – 9:00 AM</span>
                <span>• Lunch: 12:00 – 2:00 PM</span>
                <span>• Snacks: 5:30 – 6:30 PM</span>
                <span>• Dinner: 8:00 – 9:15 PM</span>
              </div>
            </div>
          </div>

          {/* Instructions List */}
          <div className="w-full text-xs text-slate-300 text-left bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 mb-6 print:bg-slate-50 print:text-slate-700 print:border-slate-300">
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your smartphone camera or any QR scanner.</li>
              <li>Scan the QR code above and open the link.</li>
              <li>Fill in your <strong>Name</strong> and <strong>Hostel Room Number</strong>.</li>
              <li>Submit to record your swimming pool entry.</li>
            </ol>
          </div>

          {/* URL Editor (Hidden in Print) */}
          <div className="w-full mb-6 print:hidden">
            <label className="block text-xs font-medium text-slate-400 text-left mb-1.5 flex items-center justify-between">
              <span>Target Website URL (Your Vercel URL):</span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                Test Link <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-app.vercel.app"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-left mt-1">
              💡 When you deploy this to Vercel, paste your live Vercel link here to update the QR code.
            </p>
          </div>

          {/* Action Buttons (Hidden in Print) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full print:hidden">
            <button
              onClick={handleDownloadQR}
              disabled={!qrGenerated}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium py-2.5 px-4 rounded-xl text-sm transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Download QR Image
            </button>
            <button
              onClick={handlePrintPoster}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition"
            >
              <Printer className="w-4 h-4" />
              Print Entrance Poster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
