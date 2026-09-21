import React, { useState, useEffect } from 'react';
import { EmergencyAlert, Member } from '../types';
import { audioService } from '../services/audio';
import { TranslationDict } from '../i18n/translations';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeSos: EmergencyAlert | null;
  currentUser: Member;
  onTriggerSos: (alert: EmergencyAlert) => void;
  onResolveSos: () => void;
  t: TranslationDict;
}

export const SosAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeSos,
  currentUser,
  onTriggerSos,
  onResolveSos,
  t,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [distressMessage, setDistressMessage] = useState('Emergency! Need immediate assistance.');

  useEffect(() => {
    let timer: number;
    if (countdown !== null && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
        audioService.triggerHaptic('medium');
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      executeTrigger();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleStartCountdown = () => {
    setCountdown(3);
    audioService.triggerHaptic('heavy');
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
  };

  const executeTrigger = () => {
    const alert: EmergencyAlert = {
      id: `sos_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      timestamp: Date.now(),
      lat: currentUser.lat || 51.5074,
      lng: currentUser.lng || -0.1278,
      message: distressMessage,
      status: 'active',
    };
    audioService.playSosAlert();
    onTriggerSos(alert);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-800">
        {/* Top Danger Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center animate-pulse shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{t.sosModalTitle}</h3>
              <p className="text-xs text-rose-600 font-semibold">{t.priorityDistress}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeSos && activeSos.status === 'active' ? (
          /* Active Alert State */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider animate-pulse shadow-2xs">
                {t.sosActiveAlert}
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                {activeSos.senderName} ({t.sosDefaultMessage})
              </h4>
              <p className="text-xs text-rose-700 font-medium">
                "{activeSos.message}"
              </p>
              <div className="text-[11px] text-slate-500 pt-1">
                GPS: {activeSos.lat.toFixed(4)}, {activeSos.lng.toFixed(4)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onResolveSos}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.sosResolveAlert}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : countdown !== null ? (
          /* Countdown State */
          <div className="mt-6 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 border-2 border-rose-500 text-rose-700 flex items-center justify-center text-3xl font-black animate-ping">
              {countdown}
            </div>
            <h4 className="text-base font-bold text-slate-900">{countdown}s...</h4>
            <p className="text-xs text-slate-500">
              {t.sosModalDesc}
            </p>
            <button
              onClick={handleCancelCountdown}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
            >
              {t.sosCancelCountdown}
            </button>
          </div>
        ) : (
          /* Initial Trigger Prompt */
          <div className="mt-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.sosModalDesc}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.sosDistressPrompt}
              </label>
              <input
                type="text"
                value={distressMessage}
                onChange={(e) => setDistressMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{t.onlyAdminCanSee}</span>
            </div>

            <button
              onClick={handleStartCountdown}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t.sosHoldToTrigger}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
