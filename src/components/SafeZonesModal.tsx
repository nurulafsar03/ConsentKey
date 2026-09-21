import React, { useState } from 'react';
import { SafeZone, Member } from '../types';
import { isInsideGeofence } from '../utils/geo';
import { audioService } from '../services/audio';
import { TranslationDict } from '../i18n/translations';
import {
  MapPin,
  Plus,
  Trash2,
  X,
  Bell,
  Home,
  GraduationCap,
  Briefcase,
  Truck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  safeZones: SafeZone[];
  members: Member[];
  onSaveZone: (zone: SafeZone) => void;
  onDeleteZone: (zoneId: string) => void;
  t: TranslationDict;
}

const CATEGORIES = [
  { id: 'home', label: 'Home', icon: Home, defaultColor: '#10b981' },
  { id: 'school', label: 'School', icon: GraduationCap, defaultColor: '#3b82f6' },
  { id: 'work', label: 'Work', icon: Briefcase, defaultColor: '#8b5cf6' },
  { id: 'hub', label: 'Logistics Hub', icon: Truck, defaultColor: '#f59e0b' },
  { id: 'custom', label: 'Custom', icon: MapPin, defaultColor: '#ec4899' },
] as const;

export const SafeZonesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  safeZones,
  members,
  onSaveZone,
  onDeleteZone,
  t,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SafeZone['category']>('home');
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [color, setColor] = useState('#10b981');
  const [notifyOnEntry, setNotifyOnEntry] = useState(true);
  const [notifyOnExit, setNotifyOnExit] = useState(true);

  if (!isOpen) return null;

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Pick a realistic coordinate centered near active group members or London center
    const baseLat = members[0]?.lat || 51.5074;
    const baseLng = members[0]?.lng || -0.1278;
    // Slight jitter if multiple zones exist
    const offset = (safeZones.length + 1) * 0.0035;

    const newZone: SafeZone = {
      id: `zone_${Date.now()}`,
      name: name.trim(),
      category,
      lat: baseLat + offset,
      lng: baseLng - offset,
      radiusMeters,
      color,
      notifyOnEntry,
      notifyOnExit,
    };

    onSaveZone(newZone);
    audioService.playConsentChime();
    setIsAdding(false);
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.safeZonesTitle}</h3>
              <p className="text-xs text-slate-500">
                {t.safeZonesDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Safe Zones List */}
        {!isAdding ? (
          <div className="mt-5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {safeZones.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {t.noSafeZones}
              </div>
            ) : (
              safeZones.map((zone) => {
                // Find members inside this zone
                const membersInside = members.filter(
                  (m) =>
                    m.lat &&
                    m.lng &&
                    m.isSharingLocation &&
                    isInsideGeofence(m.lat, m.lng, zone.lat, zone.lng, zone.radiusMeters)
                );

                return (
                  <div
                    key={zone.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          style={{ backgroundColor: `${zone.color}18`, borderColor: `${zone.color}50`, color: zone.color }}
                          className="w-8 h-8 rounded-xl border flex items-center justify-center text-sm font-bold shadow-2xs"
                        >
                          📍
                        </span>
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{zone.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                              {zone.radiusMeters}m
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Bell className="w-3 h-3 text-emerald-600" />
                            <span>{t.notifyEntry} & {t.notifyExit}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteZone(zone.id)}
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                        title={t.deleteZone}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Members Currently Inside Indicator */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{t.activeMembers}:</span>
                      {membersInside.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            {membersInside.map((m) => m.name.split(' ')[0]).join(', ')} ({t.statusInside})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">{t.noMembersMatch}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <button
              onClick={() => setIsAdding(true)}
              className="w-full mt-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addSafeZone}</span>
            </button>
          </div>
        ) : (
          /* Add Zone Form */
          <form onSubmit={handleCreateZone} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.zoneNameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.zoneNamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
                required
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.categoryLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setColor(cat.defaultColor);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      category === cat.id
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Radius Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>{t.radiusLabel}</span>
                <span className="text-emerald-700 font-bold">{radiusMeters}m</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>50m</span>
                <span>500m</span>
                <span>1,000m</span>
              </div>
            </div>

            {/* Notification checkboxes */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={notifyOnEntry}
                  onChange={(e) => setNotifyOnEntry(e.target.checked)}
                  className="rounded accent-emerald-600"
                />
                <span>{t.notifyEntry}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={notifyOnExit}
                  onChange={(e) => setNotifyOnExit(e.target.checked)}
                  className="rounded accent-emerald-600"
                />
                <span>{t.notifyExit}</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {t.saveZone}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
