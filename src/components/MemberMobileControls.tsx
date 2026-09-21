import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Navigation, Battery, LogOut, Compass, AlertTriangle, MessageSquare } from 'lucide-react';
import { Member } from '../types';
import { TranslationDict } from '../i18n/translations';
import { audioService } from '../services/audio';
import { useTheme } from '../context/ThemeContext';

interface Props {
  currentMember: Member;
  onToggleSharing: (isSharing: boolean) => void;
  onLeaveGroup: () => void;
  onUpdateCoords: (lat: number, lng: number) => void;
  onTriggerSos?: () => void;
  onOpenChatWithAdmin?: () => void;
  t: TranslationDict;
}

export const MemberMobileControls: React.FC<Props> = ({
  currentMember,
  onToggleSharing,
  onLeaveGroup,
  onUpdateCoords,
  onTriggerSos,
  onOpenChatWithAdmin,
  t,
}) => {
  const { isDark } = useTheme();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isSimulatingMove, setIsSimulatingMove] = useState(false);

  const handleToggle = () => {
    const next = !currentMember.isSharingLocation;
    onToggleSharing(next);
    audioService.playConsentChime();
  };

  const handleFetchRealGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onUpdateCoords(pos.coords.latitude, pos.coords.longitude);
          audioService.playConsentChime();
        },
        () => {
          // If denied, nudge slightly
          if (currentMember.lat && currentMember.lng) {
            onUpdateCoords(currentMember.lat + 0.001, currentMember.lng + 0.001);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleSimulateStep = () => {
    setIsSimulatingMove(true);
    // Slight jitter in coordinates to demonstrate live tracking
    const newLat = (currentMember.lat ?? 51.5074) + (Math.random() - 0.5) * 0.003;
    const newLng = (currentMember.lng ?? -0.1278) + (Math.random() - 0.5) * 0.003;
    onUpdateCoords(newLat, newLng);
    setTimeout(() => setIsSimulatingMove(false), 600);
  };

  return (
    <div className={`rounded-3xl p-5 shadow-sm space-y-4 border transition ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
    }`}>
      {/* Member Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentMember.avatar}
              alt={currentMember.name}
              className={`w-10 h-10 rounded-full border-2 border-emerald-500 object-cover shadow-2xs ${
                isDark ? 'border-emerald-600' : ''
              }`}
            />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                isDark ? 'border-slate-900' : 'border-white'
              } ${
                currentMember.isSharingLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{t.yourProfile}</div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentMember.name}</h4>
          </div>
        </div>

        {/* Battery Indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
          isDark
            ? 'bg-slate-800 text-slate-200 border-slate-700'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <Battery className="w-3.5 h-3.5 text-emerald-500" />
          <span>{currentMember.battery ?? 89}%</span>
        </div>
      </div>

      {/* Main Consent Status Switch */}
      <div className={`p-4 rounded-2xl border transition-all ${
        currentMember.isSharingLocation
          ? isDark
            ? 'bg-emerald-950/40 border-emerald-800 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 shadow-xs'
          : isDark
            ? 'bg-slate-800/40 border-slate-800'
            : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {currentMember.isSharingLocation ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentMember.isSharingLocation ? t.sharingStatusActive : t.sharingStatusPaused}
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentMember.isSharingLocation
                  ? t.memberSharingActive
                  : t.memberSharingPaused}
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentMember.isSharingLocation}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* 1-Tap Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={handleSimulateStep}
          disabled={!currentMember.isSharingLocation}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer font-medium shadow-2xs disabled:opacity-40 ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 text-cyan-500 ${isSimulatingMove ? 'animate-spin' : ''}`} />
          <span>{t.simulateMove}</span>
        </button>

        <button
          onClick={handleFetchRealGps}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer font-medium shadow-2xs ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.realDeviceGps}</span>
        </button>
      </div>

      {/* Emergency Distress Beacon Button */}
      {onTriggerSos && (
        <button
          onClick={onTriggerSos}
          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs ${
            isDark
              ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>{t.broadcastSos}</span>
        </button>
      )}

      {/* Message Admin Option for Member */}
      {onOpenChatWithAdmin && (
        <button
          onClick={onOpenChatWithAdmin}
          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-emerald-500'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.messageDispatcher}</span>
        </button>
      )}

      {/* Frictionless Leave Group Button */}
      <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        {!showLeaveConfirm ? (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              isDark
                ? 'bg-slate-800/60 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border-slate-700 hover:border-rose-900'
                : 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border-slate-200 hover:border-rose-200'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.leaveGroup} ({t.noQuestionsAsked})</span>
          </button>
        ) : (
          <div className={`p-3 rounded-xl border text-center animate-in fade-in space-y-2 ${
            isDark ? 'bg-rose-950/60 border-rose-900' : 'bg-rose-50 border-rose-200'
          }`}>
            <p className={`text-xs font-medium ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>{t.leaveGroupConfirm}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeaveGroup();
                }}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {t.confirmLeave}
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
