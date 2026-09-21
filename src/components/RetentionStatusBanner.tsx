import React, { useState, useEffect } from 'react';
import { Trash2, Clock, ShieldCheck, Check, Database, Info } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { StorageService } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

interface Props {
  t: TranslationDict;
  onPurged?: () => void;
}

export const RetentionStatusBanner: React.FC<Props> = ({ t, onPurged }) => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({ messageCount: 0, breadcrumbCount: 0, oldestAgeMinutes: 0 });
  const [justPurged, setJustPurged] = useState(false);

  const refreshStats = () => {
    setStats(StorageService.getStats());
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePurge = () => {
    StorageService.clearEverything();
    refreshStats();
    setJustPurged(true);
    if (onPurged) onPurged();
    setTimeout(() => setJustPurged(false), 3000);
  };

  return (
    <div className={`w-full rounded-3xl border p-4 shadow-sm transition ${
      isDark
        ? 'bg-slate-900/80 border-slate-800'
        : 'bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-cyan-50/50 border-emerald-200/80'
    }`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-2xl border mt-0.5 shadow-2xs ${
            isDark
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
              : 'bg-emerald-100 border-emerald-300 text-emerald-700'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.storage24hTitle}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {t.storage24hBadge}
              </span>
            </div>
            <p className={`text-xs mt-0.5 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.storage24hDesc}
            </p>
          </div>
        </div>

        {/* Real-time browser metrics & Purge Action */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className={`flex items-center gap-3 text-xs px-3 py-2 rounded-xl border shadow-2xs ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-300'
              : 'bg-white/90 border-emerald-200/70 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold">{stats.messageCount} msg</span>
            </div>
            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-500" />
              <span className="font-semibold">{stats.breadcrumbCount} pts</span>
            </div>
          </div>

          <button
            onClick={handlePurge}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
              justPurged
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isDark
                ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-900'
                : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-200'
            }`}
            title={t.purgeNow}
          >
            {justPurged ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Trash2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{justPurged ? t.purgedSuccess : t.purgeNow}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
