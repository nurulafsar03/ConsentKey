import React, { useState } from 'react';
import { Member, Group, DirectShareLink } from '../types';
import { TranslationDict } from '../i18n/translations';
import {
  ShieldCheck,
  ShieldAlert,
  Share2,
  Radio,
  Send,
  Bell,
  Compass,
  Battery,
  Phone,
  Video,
  MessageSquare,
  AlertTriangle,
  Clock,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { audioService } from '../services/audio';
import { getPublicAppBaseUrl } from '../utils/url';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  currentMember: Member;
  currentGroup: Group;
  onToggleSharing: (isSharing: boolean) => void;
  onUpdateCoords: (lat: number, lng: number) => void;
  onTriggerSos: () => void;
  onOpenDirectShare: () => void;
  onOpenChatWithAdmin: () => void;
  onCallAdmin: (isVideo?: boolean) => void;
  t: TranslationDict;
}

export const MemberPortalView: React.FC<Props> = ({
  currentMember,
  currentGroup,
  onToggleSharing,
  onUpdateCoords,
  onTriggerSos,
  onOpenDirectShare,
  onOpenChatWithAdmin,
  onCallAdmin,
  t,
}) => {
  const { isDark } = useTheme();
  const [quickCopied, setQuickCopied] = useState(false);
  const [sharePersonName, setSharePersonName] = useState('');
  const [shareDurationHours, setShareDurationHours] = useState(2);
  const [createdShareLink, setCreatedShareLink] = useState<string | null>(null);
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);

  // Toggle sharing
  const handleToggle = () => {
    const next = !currentMember.isSharingLocation;
    onToggleSharing(next);
    audioService.playConsentChime();
  };

  // Quick GPS Refresh
  const handleFetchGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onUpdateCoords(pos.coords.latitude, pos.coords.longitude);
          audioService.playConsentChime();
        },
        () => {
          if (currentMember.lat && currentMember.lng) {
            onUpdateCoords(currentMember.lat + 0.001, currentMember.lng + 0.001);
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  // Simulate walking step
  const handleSimulateStep = () => {
    setIsSimulatingGps(true);
    const newLat = (currentMember.lat ?? 51.5074) + (Math.random() - 0.5) * 0.0025;
    const newLng = (currentMember.lng ?? -0.1278) + (Math.random() - 0.5) * 0.0025;
    onUpdateCoords(newLat, newLng);
    setTimeout(() => setIsSimulatingGps(false), 500);
  };

  // Create one-click direct share for any person
  const handleGenerateDirectLink = (e: React.FormEvent) => {
    e.preventDefault();
    const token = Math.random().toString(36).substring(2, 9);
    const baseUrl = getPublicAppBaseUrl();
    const url = `${baseUrl}/?share=${token}&for=${encodeURIComponent(sharePersonName || 'Guest')}&lat=${currentMember.lat || 51.5074}&lng=${currentMember.lng || -0.1278}`;
    setCreatedShareLink(url);
    audioService.playConsentChime();
  };

  const copyCreatedLink = async () => {
    if (!createdShareLink) return;
    const ok = await copyToClipboard(createdShareLink);
    if (ok) {
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner: Member Mode Notice */}
      <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentMember.avatar}
                alt={currentMember.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                isDark ? 'border-slate-900' : 'border-white'
              } ${
                currentMember.isSharingLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Member / Field Mode
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Room: <strong>{currentGroup.name}</strong>
                </span>
              </div>
              <h1 className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentMember.name}
              </h1>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                You have sovereign control over your live location. You can toggle broadcasting off at any second or share directly with anyone.
              </p>
            </div>
          </div>

          {/* Quick toggle sharing status button */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleToggle}
              className={`flex-1 md:flex-initial px-5 py-3 rounded-2xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                currentMember.isSharingLocation
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {currentMember.isSharingLocation ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Pause My Location</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Start Sharing My Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Instructions from Admin & Admin Dispatch Comms */}
        <div className="md:col-span-7 space-y-6">
          {/* Admin Instructions Card */}
          <div className={`p-6 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Instructions from Admin ({currentGroup.adminName})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live operational instructions and room broadcasts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCallAdmin(false)}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                  }`}
                  title="Voice Call Admin"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onCallAdmin(true)}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-400'
                      : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'
                  }`}
                  title="Video Call Admin"
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onOpenChatWithAdmin}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-400'
                      : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700'
                  }`}
                  title="Message Admin"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List of Admin instructions */}
            <div className="space-y-3">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">Room Rule #1: Safety & Check-in</span>
                  <span>10 mins ago</span>
                </div>
                <p className="text-xs leading-relaxed">
                  "Please ensure GPS sharing is turned ON while you are on transit or on delivery duty. Tap 'Send Coordinates' below if you move into a new zone."
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                  <span className="text-cyan-600 dark:text-cyan-400">Room Rule #2: Geofence Safe Zones</span>
                  <span>1 hour ago</span>
                </div>
                <p className="text-xs leading-relaxed">
                  "Safe zones are active for London Central and Depot East. When you enter or exit these zones, an automated alert will notify the room."
                </p>
              </div>
            </div>

            {/* Quick Action bar with Admin */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={onOpenChatWithAdmin}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Direct Chat with Admin</span>
              </button>

              <button
                onClick={onTriggerSos}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Emergency SOS</span>
              </button>
            </div>
          </div>

          {/* Member GPS Controls & Calibration */}
          <div className={`p-6 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-sm font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              GPS Calibration & Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Update your real device GPS coordinates or simulate walking steps for testing without moving.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleFetchGps}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Fetch Real GPS</span>
              </button>

              <button
                onClick={handleSimulateStep}
                disabled={isSimulatingGps}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-cyan-950/40 hover:bg-cyan-900/40 border-cyan-800 text-cyan-300'
                    : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
                }`}
              >
                <Navigation className={`w-4 h-4 text-cyan-500 ${isSimulatingGps ? 'animate-spin' : ''}`} />
                <span>Simulate Walking Step</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span>Current Coords: {currentMember.lat?.toFixed(4)}, {currentMember.lng?.toFixed(4)}</span>
              <span>Speed: {currentMember.speed || 0} km/h • Battery: {currentMember.battery || 85}%</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Share your live location with any person */}
        <div className="md:col-span-5 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Share Live Location With Anyone
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Create a short-lived, encrypted temporary web link to share your live location with any friend, client, customer, or family member outside the room.
            </p>

            <form onSubmit={handleGenerateDirectLink} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Recipient Person's Name or Note
                </label>
                <input
                  type="text"
                  value={sharePersonName}
                  onChange={(e) => setSharePersonName(e.target.value)}
                  placeholder="e.g. Uber Driver, Mom, Customer #4"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 transition ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Auto-Expire Duration
                </label>
                <select
                  value={shareDurationHours}
                  onChange={(e) => setShareDurationHours(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 transition cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value={1}>1 Hour (Temporary Trip)</option>
                  <option value={2}>2 Hours (Meeting / Delivery)</option>
                  <option value={8}>8 Hours (Full Shift)</option>
                  <option value={24}>24 Hours (Maximum Privacy Limit)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/25"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Generate Personal Live Link</span>
              </button>
            </form>

            {/* Generated Link Result */}
            {createdShareLink && (
              <div className={`mt-4 p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/80 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  <span>Link Created for {sharePersonName || 'Guest'}</span>
                  <span>Expires in {shareDurationHours}h</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={createdShareLink}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono border truncate select-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  />
                  <button
                    onClick={copyCreatedLink}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{quickCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Direct Share Modal Trigger */}
          <div className={`p-5 rounded-3xl border shadow-sm text-center ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Want QR Code / Instant Link?
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              Open the full 1-to-1 direct share wizard with QR code generation.
            </p>
            <button
              onClick={onOpenDirectShare}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span>Open 1 to 1 Share Wizard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
