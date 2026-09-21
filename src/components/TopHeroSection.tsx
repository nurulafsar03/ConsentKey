import React from 'react';
import {
  ArrowDown,
  Radio,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';

interface Props {
  t: TranslationDict;
  onScrollToLiveMap: () => void;
  onOpenJoinModal: () => void;
  onOpenDirectShare: () => void;
  onOpenP2PTransfer?: (initialMode?: 'send' | 'receive') => void;
}

export const TopHeroSection: React.FC<Props> = ({
  t,
  onScrollToLiveMap,
  onOpenJoinModal,
  onOpenDirectShare,
  onOpenP2PTransfer,
}) => {
  const { isDark } = useTheme();

  return (
    <>
      {/* =========================================================================
          MOBILE & TABLET COMPACT QUICK ACTION BAR (< lg)
          Hides bloated marketing copy, giant headings, and redundant text.
          Shows ONLY important actions: Test QR Join, 1-to-1 Share, and P2P Transfer.
          ========================================================================= */}
      <div className={`lg:hidden px-3.5 py-3 border-b transition-colors ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Action 1: Test QR / Link Join */}
          <button
            id="btn-hero-test-qr-mobile"
            onClick={onOpenJoinModal}
            className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-98 ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Test QR Join</span>
          </button>

          {/* Action 2: Direct 1 to 1 Share */}
          <button
            id="btn-hero-direct-share-mobile"
            onClick={onOpenDirectShare}
            className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-98 ${
              isDark
                ? 'bg-slate-900 border-cyan-800/80 text-cyan-300'
                : 'bg-cyan-50/70 border-cyan-200 text-cyan-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse shrink-0" />
            <span className="truncate">1-to-1 Share</span>
          </button>

          {/* Action 3: Direct P2P File Transfer (6-digit code) */}
          {onOpenP2PTransfer && (
            <button
              id="btn-hero-p2p-transfer-mobile"
              onClick={() => onOpenP2PTransfer('send')}
              className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border border-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-98"
            >
              <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
              <span className="truncate">P2P File</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          DESKTOP (PC) FULL MARKETING HERO (>= lg)
          Full desktop overview for large screens
          ========================================================================= */}
      <section className={`hidden lg:block relative pt-10 sm:pt-14 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors ${
        isDark
          ? 'bg-slate-950/60 border-b border-slate-800/80'
          : 'bg-gradient-to-b from-white via-emerald-50/20 to-slate-50/50 border-b border-slate-200/80'
      }`}>
        {/* Ambient background glows */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] blur-3xl pointer-events-none ${
          isDark
            ? 'bg-emerald-950/25'
            : 'bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-transparent'
        }`} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-2xs text-xs font-semibold mb-6 transition">
            <span className={`inline-flex items-center gap-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Short-Lived Permissions</span>
            </span>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Lock-Screen Browser Alerts</span>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
            <span className={isDark ? 'text-teal-300' : 'text-teal-700 font-bold'}>Zero Cloud Surveillance</span>
          </div>

          {/* Hero Title */}
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {t.heroTitle}
          </h1>

          {/* Hero Subtitle */}
          <p className={`mt-5 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-normal ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {t.heroSubtitle}
          </p>

          {/* Quick Action Triggers */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            {/* Button 1: Open Live Workspace */}
            <button
              id="btn-hero-open-workspace"
              onClick={onScrollToLiveMap}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              <span>Open Live Workspace</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>

            {/* Button 2: Test QR / Link Join */}
            <button
              id="btn-hero-test-qr"
              onClick={onOpenJoinModal}
              className={`px-5 py-3.5 rounded-2xl border font-bold text-sm flex items-center gap-2 shadow-2xs transition cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px] ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-500/50'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-400'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span>Test QR / Link Join</span>
            </button>

            {/* Button 3: Direct 1 to 1 Share */}
            <button
              id="btn-hero-direct-share"
              onClick={onOpenDirectShare}
              className={`px-5 py-3.5 rounded-2xl border font-bold text-sm flex items-center gap-2 shadow-2xs transition cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px] ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-cyan-800/80 text-cyan-300 hover:border-cyan-600'
                  : 'bg-white hover:bg-cyan-50/60 border-cyan-200 text-cyan-800 hover:border-cyan-400'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-500 animate-pulse" />
              <span>Direct 1 to 1 Share</span>
            </button>

            {/* Button 4: Direct P2P File Transfer (6-digit code) */}
            {onOpenP2PTransfer && (
              <button
                id="btn-hero-p2p-transfer"
                onClick={() => onOpenP2PTransfer('send')}
                className={`px-5 py-3.5 rounded-2xl border font-bold text-sm flex items-center gap-2 shadow-2xs transition cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px] ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-950/80 to-cyan-950/80 hover:bg-slate-800 border-cyan-700/80 text-cyan-300 hover:border-cyan-500'
                    : 'bg-gradient-to-r from-emerald-50 to-cyan-50 hover:bg-cyan-100/70 border-cyan-300 text-cyan-900 hover:border-cyan-500'
                }`}
              >
                <Zap className="w-4 h-4 text-cyan-500 fill-current" />
                <span>P2P File Transfer</span>
              </button>
            )}
          </div>

          {/* Live Security Stats Strip */}
          <div className={`mt-10 py-3 px-5 rounded-2xl border max-w-2xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs font-semibold shadow-xs ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-300'
              : 'bg-white/95 border-slate-200/90 text-slate-700 shadow-slate-100'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>100% Client-Side Privacy</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
              <span>24h Automatic Purge</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>
              <span>Zero Cloud Surveillance</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
