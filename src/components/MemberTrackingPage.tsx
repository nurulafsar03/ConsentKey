import React, { useState } from 'react';
import { Member, Group, SafeZone, NavigationRoute, EmergencyAlert, LocationBreadcrumb } from '../types';
import { ConsentMap } from './ConsentMap';
import { TranslationDict } from '../i18n/translations';
import {
  ArrowLeft,
  Phone,
  Video,
  MessageSquare,
  Navigation,
  Battery,
  Gauge,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  Radio,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isInsideGeofence } from '../utils/geo';

interface Props {
  member: Member;
  group: Group;
  safeZones: SafeZone[];
  breadcrumbs: LocationBreadcrumb[];
  activeRoute: NavigationRoute | null;
  activeSos: EmergencyAlert | null;
  t: TranslationDict;
  onBack: () => void;
  onCallMember: (member: Member, isVideo?: boolean) => void;
  onChatMember: (member: Member) => void;
  onGetRoute: (member: Member) => void;
  onClearRoute: () => void;
  onManageSafeZones: () => void;
  onTriggerSos: () => void;
  onOpenMapsIntelligence?: (target?: { lat: number; lng: number; name?: string }) => void;
}

export const MemberTrackingPage: React.FC<Props> = ({
  member,
  group,
  safeZones,
  breadcrumbs,
  activeRoute,
  activeSos,
  t,
  onBack,
  onCallMember,
  onChatMember,
  onGetRoute,
  onClearRoute,
  onManageSafeZones,
  onTriggerSos,
  onOpenMapsIntelligence,
}) => {
  const { isDark } = useTheme();

  const isDriving = (member.speed || 0) > 15;
  const isWalking = (member.speed || 0) > 0 && !isDriving;
  const isLowBattery = (member.battery || 100) < 20;

  // Filter breadcrumbs specifically for this member
  const memberCrumbs = breadcrumbs.filter((b) => b.memberId === member.id);

  // Check safe zones
  const currentZone = safeZones.find(
    (z) =>
      member.lat &&
      member.lng &&
      isInsideGeofence(member.lat, member.lng, z.lat, z.lng, z.radiusMeters)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Header Navigation Bar with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center gap-2 font-bold text-xs shadow-2xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-emerald-500" />
            <span>Back to Circles</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}>
                {group.name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Single Member Live Tracking
              </span>
            </div>
            <h1 className={`text-2xl font-black mt-0.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>{member.name}</span>
              {member.role === 'admin' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {t.badgeAdmin}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Quick Member Comms Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGetRoute(member)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-cyan-950/60 border-cyan-800 hover:bg-cyan-900/60 text-cyan-300'
                : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-800'
            }`}
          >
            <Navigation className="w-4 h-4 text-cyan-500" />
            <span>Get Route & ETA</span>
          </button>

          <button
            onClick={() => onChatMember(member)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>Message / Voice</span>
          </button>

          <button
            onClick={() => onCallMember(member, false)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Voice Call</span>
          </button>

          <button
            onClick={() => onCallMember(member, true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Video Call</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Dedicated Member Live Map + Member Telemetry & Route Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dedicated Interactive Map focused strictly on this member */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
            <ConsentMap
              members={[member]}
              safeZones={safeZones}
              breadcrumbs={memberCrumbs}
              activeRoute={activeRoute}
              activeSos={activeSos}
              focusedMemberId={member.id}
              currentUserId={member.id}
              isAdminView={true}
              t={t}
              onCallMember={onCallMember}
              onChatMember={onChatMember}
              onClearRoute={onClearRoute}
              onManageSafeZones={onManageSafeZones}
              onTriggerSos={onTriggerSos}
              onOpenMapsIntelligence={onOpenMapsIntelligence}
            />
          </div>

          {/* Privacy & Sovereignty notice for single member */}
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                24h Rolling TTL: All location markers and routes purge automatically after 24 hours.
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-500 font-bold">
              Strict Member Consent Active
            </span>
          </div>
        </div>

        {/* Right: Live Telemetry, Route Card, Geofence Status */}
        <div className="lg:col-span-4 space-y-4">
          {/* Member Profile & Live State Card */}
          <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  member.isSharingLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {member.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {member.email}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {member.isSharingLocation ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      ● Live Broadcasting
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      ○ Location Paused
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className={`grid grid-cols-3 gap-2.5 p-3 rounded-2xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-500" />
                  <span>Speed</span>
                </div>
                <div className={`text-sm font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {member.speed || 0} km/h
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-500" />
                  <span>Battery</span>
                </div>
                <div className={`text-sm font-extrabold mt-0.5 ${isLowBattery ? 'text-rose-500 font-black' : isDark ? 'text-white' : 'text-slate-900'}`}>
                  {member.battery || 100}%
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>Accuracy</span>
                </div>
                <div className={`text-sm font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ±{member.accuracy || 15}m
                </div>
              </div>
            </div>

            {/* Current Zone Status */}
            <div className={`p-3.5 rounded-2xl border ${
              currentZone
                ? isDark ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200'
                : isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Safe Zone Location
              </div>
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${currentZone ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold ${currentZone ? 'text-emerald-500' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {currentZone ? `Inside "${currentZone.name}"` : 'En Route / Open Field'}
                </span>
              </div>
            </div>

            {/* Active Route & ETA Details */}
            {activeRoute && (
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-cyan-950/40 border-cyan-800' : 'bg-cyan-50 border-cyan-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    <Navigation className="w-4 h-4" />
                    <span>Navigation Route & ETA</span>
                  </div>
                  <button
                    onClick={onClearRoute}
                    className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Distance</span>
                    <div className="text-sm font-extrabold text-cyan-700 dark:text-cyan-300">
                      {activeRoute.distanceKm.toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Est. Travel</span>
                    <div className="text-sm font-extrabold text-cyan-700 dark:text-cyan-300">
                      ~{activeRoute.estimatedMinutes} mins
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GPS Coordinates */}
            <div className={`p-3 rounded-2xl border font-mono text-xs flex items-center justify-between ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <span>Coordinates:</span>
              <span className="font-bold text-emerald-500">
                {member.lat?.toFixed(5)}, {member.lng?.toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
