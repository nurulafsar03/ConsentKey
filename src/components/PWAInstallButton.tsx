import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { TranslationDict } from '../i18n/translations';
import { UserRole } from '../types';

interface Props {
  t: TranslationDict;
  className?: string;
  role?: UserRole;
}

export const PWAInstallButton: React.FC<Props> = ({ t, className = '', role }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled || justInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 rounded-full font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>{t.appReady}</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowIOSGuide(true);
    }
  };

  const buttonLabel = t.downloadApp;

  return (
    <>
      <button
        id="btn-pwa-install"
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all cursor-pointer ${className}`}
        title={t.downloadApp}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">{buttonLabel}</span>
        <span className="sm:hidden text-[11px] font-bold">App</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Smartphone className="w-5 h-5" />
                <h3>{isIOS ? 'Install on iPhone / iPad' : 'Download to Local Device'}</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {isIOS ? (
                <>
                  <p className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Tap the <strong>Share</strong> button in your Safari browser bar (at the bottom or top).</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                    <span>Confirm by tapping <strong>Add</strong>. ConsentKey will launch as a standalone app!</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Click the <strong>Install</strong> icon in the address bar or browser menu (three dots <strong className="text-white">⋮</strong>).</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                    <span>Select <strong>"Install app"</strong> or use the downloaded launcher on your desktop.</span>
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
