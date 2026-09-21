import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Volume2, ShieldCheck, X, Phone, Video, Play, Pause } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { audioService } from '../services/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDict;
  onSimulateIncomingCall: (isVideo?: boolean) => void;
}

export const LockScreenAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  t,
  onSimulateIncomingCall,
}) => {
  const [isPlayingRingtone, setIsPlayingRingtone] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestNativePermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('ConsentKey Notification Active', {
          body: 'Background notifications enabled. You will receive alerts even when your phone screen is locked.',
          icon: '/pwa-192x192.png',
        });
      }
    }
  };

  const toggleRingtone = () => {
    if (isPlayingRingtone) {
      audioService.stopMobileRingtone();
      setIsPlayingRingtone(false);
    } else {
      audioService.startMobileRingtone();
      setIsPlayingRingtone(true);
    }
  };

  const handleClose = () => {
    if (isPlayingRingtone) {
      audioService.stopMobileRingtone();
      setIsPlayingRingtone(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <span>{t.lockScreenAlertTitle}</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          {t.lockScreenAlertDesc}
        </p>

        {/* Native Notification Request */}
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-xs font-semibold text-slate-900">{t.pushNotificationTitle}</div>
              <div className="text-[10px] text-slate-500">
                Status: <span className="text-emerald-700 font-semibold capitalize">{notificationPermission}</span>
              </div>
            </div>
          </div>
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestNativePermission}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              {t.pushEnable}
            </button>
          )}
        </div>

        {/* Realistic Mobile Phone Mockup */}
        <div className="mt-5 mx-auto max-w-[280px] rounded-[36px] bg-slate-900 border-4 border-slate-800 shadow-2xl p-4 relative overflow-hidden text-white">
          {/* Dynamic Island / Speaker notch */}
          <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-700 mr-2" />
            <div className="w-2 h-2 rounded-full bg-slate-950" />
          </div>

          {/* Clock on lock screen */}
          <div className="text-center my-3">
            <div className="text-4xl font-extralight tracking-tight text-white font-mono">{currentTime || '12:00'}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Thursday, September 10</div>
          </div>

          {/* Realistic Notification Banner */}
          <div className="my-4 p-3 rounded-2xl bg-slate-800/95 border border-slate-700 shadow-lg text-left animate-bounce">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <div className="flex items-center gap-1 font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>ConsentKey</span>
              </div>
              <span>now</span>
            </div>
            <div className="text-xs font-bold text-white">{t.incomingCallFrom}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {t.incomingCallSub}
            </div>
          </div>

          {/* Lock Screen Bottom Control */}
          <div className="mt-6 pt-2 text-center border-t border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{t.swipeUpToOpen}</span>
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={toggleRingtone}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
              isPlayingRingtone
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            {isPlayingRingtone ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span>{isPlayingRingtone ? t.stopPhoneRingtone : t.testPhoneRingtone}</span>
          </button>

          <button
            onClick={() => {
              handleClose();
              onSimulateIncomingCall(false);
            }}
            className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Voice Call</span>
          </button>

          <button
            onClick={() => {
              handleClose();
              onSimulateIncomingCall(true);
            }}
            className="flex-1 py-3 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Video Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
