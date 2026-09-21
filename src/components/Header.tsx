import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Smartphone,
  Cloud,
  Check,
  ChevronDown,
  Radio,
  Sun,
  Moon,
  Settings,
  LogIn,
  LogOut,
  UserCheck,
  HelpCircle,
  Download,
} from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, TranslationDict } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';
import { ConsentKeyLogo } from './ConsentKeyLogo';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { InfoModalTab } from './InfoModal';

interface Props {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  userEmail?: string | null;
  userName?: string | null;
  onOpenMagicLink?: () => void;
  onLogout?: () => void;
  onOpenDirectShare?: () => void;
  onOpenLockScreenTest: () => void;
  onOpenCloudflareModal: () => void;
  onOpenJoinModal?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenP2PTransfer?: (initialMode?: 'send' | 'receive') => void;
  onOpenInfoModal?: (tab?: InfoModalTab) => void;
  t: TranslationDict;
}

export const Header: React.FC<Props> = ({
  currentLanguage,
  onSelectLanguage,
  currentRole,
  onChangeRole,
  userEmail,
  userName,
  onOpenMagicLink,
  onLogout,
  onOpenDirectShare,
  onOpenLockScreenTest,
  onOpenCloudflareModal,
  onOpenJoinModal,
  onOpenAdminPanel,
  onOpenP2PTransfer,
  onOpenInfoModal,
  t,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors shadow-xs ${
      isDark
        ? 'border-slate-800 bg-slate-950/90 text-white'
        : 'border-slate-200/90 bg-white/90 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <ConsentKeyLogo className="w-9 h-9" withPing={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.appName}
              </span>
              <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                isDark
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {t.zeroKnowledge}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Role Toggle Pill (Visible on PC, Tablet, and Mobile) */}
        <div className="flex items-center">
          <div className={`flex items-center border rounded-xl p-0.5 sm:p-1 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}>
            <button
              id="header-role-admin"
              onClick={() => onChangeRole('admin')}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.roleAdmin}
            </button>
            <button
              id="header-role-member"
              onClick={() => onChangeRole('member')}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                currentRole === 'member'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.roleMember}
            </button>
          </div>
        </div>

        {/* Desktop-only secondary utility shortcuts */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Lock Screen Test */}
          <button
            onClick={onOpenLockScreenTest}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isDark
                ? 'bg-emerald-950/50 hover:bg-emerald-900/50 border-emerald-800/60 text-emerald-300'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.lockAlertNav}</span>
          </button>

          {/* Cloudflare Edge Badge */}
          <button
            onClick={onOpenCloudflareModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isDark
                ? 'bg-amber-950/50 hover:bg-amber-900/50 border-amber-800/60 text-amber-300'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:text-amber-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.cloudflareNav}</span>
          </button>

          {/* Master Admin Panel & AdSense Engine */}
          {onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:opacity-90 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Open Master Admin Panel (View users, insert Google AdSense & embed ads)"
            >
              <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Admin & Ads</span>
            </button>
          )}
        </div>

        {/* Right Section: Theme Switcher, Language Dropdown, PWA */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Admin Login Button / Logged In Admin Profile Status (Visible on ALL device views) */}
          {!userEmail ? (
            <button
              id="btn-header-admin-login"
              onClick={onOpenMagicLink}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap active:scale-98 ${
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-200'
              }`}
              title="Admin Login (Request magic link or enter credentials)"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Admin Login</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <div
                className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
                title={`Logged in as ${userEmail}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[110px] lg:max-w-[150px]">
                  {userName || userEmail}
                </span>
              </div>
              {onLogout && (
                <button
                  id="btn-header-logout"
                  onClick={onLogout}
                  className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-900 hover:bg-rose-950/60 border-slate-800 hover:border-rose-800/80 text-slate-400 hover:text-rose-300'
                      : 'bg-slate-100 hover:bg-rose-50 border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700'
                  }`}
                  title="Log out of Admin session"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          )}

          {/* EXPORT / DOWNLOAD SOURCE ZIP BUTTON */}
          <a
            id="btn-header-download-zip"
            href="/api/download-zip"
            download="consentkey-source.zip"
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-emerald-950/70 hover:bg-emerald-900/90 border-emerald-700/60 text-emerald-300 hover:text-emerald-200'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 hover:text-emerald-900'
            }`}
            title="Download full project source code as a ZIP file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline font-bold">Download ZIP</span>
          </a>

          {/* THEME TOGGLE: Compact icon on mobile, with label on md+ */}
          <button
            id="btn-toggle-theme"
            onClick={toggleTheme}
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300 hover:text-amber-200'
                : 'bg-gradient-to-r from-amber-50 via-emerald-50 to-teal-50 hover:from-amber-100 hover:to-teal-100 border-emerald-200 text-emerald-900'
            }`}
            title={isDark ? 'Switch to Clean & Colorful Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span className="hidden md:inline font-bold">Clean / Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden md:inline font-bold">Dark Mode</span>
              </>
            )}
          </button>

          {/* 8 Languages Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title={t.langSelectorTitle}
            >
              <span>{activeLangObj.flag}</span>
              <span className="hidden md:inline">{activeLangObj.nativeName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-b mb-1 ${
                  isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'
                }`}>
                  {t.langSelectorTitle}
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      currentLanguage === lang.code
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </div>
                    {currentLanguage === lang.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton t={t} role={currentRole} />
        </div>
      </div>
    </header>
  );
};
