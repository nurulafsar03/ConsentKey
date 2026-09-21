import React, { useState } from 'react';
import {
  Phone,
  Video,
  MessageSquare,
  Battery,
  Gauge,
  MapPin,
  UserPlus,
  Navigation,
  Compass,
  Search,
  Download,
} from 'lucide-react';
import { Member, SafeZone } from '../types';
import { TranslationDict } from '../i18n/translations';
import { isInsideGeofence } from '../utils/geo';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';

interface Props {
  members: Member[];
  safeZones?: SafeZone[];
  onCallMember: (member: Member, isVideo?: boolean) => void;
  onChatMember: (member: Member) => void;
  onOpenInvite: () => void;
  onOpenAddDirectly?: () => void;
  onFocusMember?: (member: Member) => void;
  onGetRoute?: (member: Member) => void;
  onSelectMember?: (member: Member) => void;
  onOpenMapsIntelligence?: (target?: { lat: number; lng: number; name?: string }) => void;
  t: TranslationDict;
}

export const AdminMembersList: React.FC<Props> = ({
  members,
  safeZones = [],
  onCallMember,
  onChatMember,
  onOpenInvite,
  onOpenAddDirectly,
  onFocusMember,
  onGetRoute,
  onSelectMember,
  onOpenMapsIntelligence,
  t,
}) => {
  const { isDark } = useTheme();
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'battery'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const { triggerManualAdminInstall, isInstalled } = usePWAInstall();

  const handleManualDownload = async () => {
    const res = await triggerManualAdminInstall();
    if (res.installed || res.method === 'manual_download') {
      setDownloadFeedback(t.downloadedBtn);
      setTimeout(() => setDownloadFeedback(null), 3000);
    }
  };

  const activeCount = members.filter((m) => m.isSharingLocation).length;
  const lowBatteryCount = members.filter((m) => (m.battery || 100) < 20).length;

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'active') return member.isSharingLocation;
    if (filterMode === 'battery') return (member.battery || 100) < 20;
    return true;
  });

  return (
    <div className={`rounded-3xl p-5 shadow-sm space-y-4 border transition ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
    }`}>
      {/* Header with Title & Invite Button */}
      <div className={`flex items-center justify-between pb-3 border-b gap-2 ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.activeMembers}</h3>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {activeCount} / {members.length} {t.sharingCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Manual Download Button */}
          <button
            id="btn-admin-manual-download"
            onClick={handleManualDownload}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Download app manually to your local computer or phone"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{downloadFeedback || (isInstalled ? t.appReady : t.downloadApp)}</span>
          </button>

          <button
            onClick={onOpenInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Invite member with QR code & joining link"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.invite}</span>
          </button>

          {onOpenAddDirectly && (
            <button
              onClick={onOpenAddDirectly}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition cursor-pointer ${
                isDark
                  ? 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-800 text-cyan-300'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
              }`}
              title="Add a person directly to this room"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-500" />
              <span>+ Add Person</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchMember}
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1 rounded-lg font-semibold transition cursor-pointer ${
              filterMode === 'all'
                ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterAll} ({members.length})
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`flex-1 py-1 rounded-lg font-semibold transition cursor-pointer ${
              filterMode === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterActive} ({activeCount})
          </button>
          <button
            onClick={() => setFilterMode('battery')}
            className={`flex-1 py-1 rounded-lg font-semibold transition cursor-pointer ${
              filterMode === 'battery'
                ? 'bg-rose-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterLowBatt} ({lowBatteryCount})
          </button>
        </div>
      </div>

      {/* Member Cards List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {t.noMembersMatch}
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isDriving = (member.speed || 0) > 15;
            const isWalking = (member.speed || 0) > 0 && !isDriving;
            const isLowBattery = (member.battery || 100) < 20;

            // Check if member is inside any Safe Zone
            const currentZone = safeZones.find(
              (z) =>
                member.lat &&
                member.lng &&
                isInsideGeofence(member.lat, member.lng, z.lat, z.lng, z.radiusMeters)
            );

            return (
              <div
                key={member.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  member.isSharingLocation
                    ? isDark
                      ? 'bg-slate-800/60 border-emerald-900/50 hover:border-emerald-700/80 shadow-2xs'
                      : 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300 shadow-2xs'
                    : isDark
                      ? 'bg-slate-800/30 border-slate-800 opacity-60'
                      : 'bg-slate-50 border-slate-200/80 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => onSelectMember && onSelectMember(member)}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer group/member hover:opacity-90 transition"
                    title={`Click to view live location & route for ${member.name}`}
                  >
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className={`w-10 h-10 rounded-full object-cover border shadow-2xs group-hover/member:ring-2 group-hover/member:ring-emerald-500 transition ${
                          isDark ? 'border-slate-700' : 'border-slate-200'
                        }`}
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                          isDark ? 'border-slate-900' : 'border-white'
                        } ${
                          member.isSharingLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className={`font-bold text-xs flex items-center gap-1.5 flex-wrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="group-hover/member:text-emerald-500 transition underline-offset-2 group-hover/member:underline">
                          {member.name}
                        </span>
                        {member.role === 'admin' && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border ${
                            isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {t.badgeAdmin}
                          </span>
                        )}
                        {/* Explicit Online / Offline Badge */}
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1 border ${
                          member.isOnline !== false && member.isSharingLocation
                            ? isDark
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDark
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            member.isOnline !== false && member.isSharingLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`} />
                          <span>{member.isOnline !== false && member.isSharingLocation ? 'Online' : 'Offline'}</span>
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold transition flex items-center gap-0.5">
                          <span>• View Live GPS & Route →</span>
                        </span>
                      </div>

                      {/* Presence or Geofence Status */}
                      <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {member.isSharingLocation ? (
                          currentZone ? (
                            <span className="text-emerald-500 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {t.statusInside} {currentZone.name}
                            </span>
                          ) : (
                            <span className="text-cyan-500 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                              {isDriving ? t.statusDriving : isWalking ? t.statusWalking : t.statusStationary}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">{t.statusPaused}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Focus Map, Route, Call, Chat */}
                  <div className="flex items-center gap-1">
                    {member.isSharingLocation && onFocusMember && (
                      <button
                        onClick={() => onFocusMember(member)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-emerald-400'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-emerald-600'
                        }`}
                        title="Focus on Map"
                      >
                        <Compass className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {member.isSharingLocation && onGetRoute && (
                      <button
                        onClick={() => onGetRoute(member)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-cyan-400'
                            : 'bg-white hover:bg-cyan-50 border-slate-200 hover:border-cyan-200 text-slate-600 hover:text-cyan-700'
                        }`}
                        title="Get Route & ETA"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {member.lat && member.lng && onOpenMapsIntelligence && (
                      <button
                        onClick={() => onOpenMapsIntelligence({ lat: member.lat!, lng: member.lng!, name: member.name })}
                        className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                          isDark
                            ? 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800/80 text-emerald-400'
                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
                        }`}
                        title="Google Maps Intel & Safe Havens"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    )}
                    <button
                      onClick={() => onCallMember(member, false)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-emerald-400'
                          : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700'
                      }`}
                      title={`${t.voiceCall} ${member.name}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onCallMember(member, true)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-teal-400'
                          : 'bg-white hover:bg-teal-50 border-slate-200 hover:border-teal-200 text-slate-600 hover:text-teal-700'
                      }`}
                      title={`Video Call ${member.name}`}
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onChatMember(member)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-blue-400'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700'
                      }`}
                      title={`${t.textChat} ${member.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Telemetry Strip: Speed, Battery, Accuracy */}
                {member.isSharingLocation && (
                  <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                    isDark ? 'border-slate-700/60 text-slate-400' : 'border-slate-200/70 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-slate-400" />
                      <span>{member.speed || 0} km/h</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Battery className={`w-3 h-3 ${isLowBattery ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                      <span className={isLowBattery ? 'text-rose-500 font-bold' : ''}>
                        {member.battery || 100}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>±{member.accuracy || 12}m</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
