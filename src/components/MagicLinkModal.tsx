import React, { useState } from 'react';
import { Mail, KeyRound, Sparkles, Check, ArrowRight, ShieldCheck, X, Download } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { UserRole } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';
import { getPublicAppBaseUrl } from '../utils/url';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, name: string, role: UserRole) => void;
  t: TranslationDict;
}

export const MagicLinkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  t,
}) => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [isSent, setIsSent] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [adminDownloaded, setAdminDownloaded] = useState(false);

  const { triggerManualAdminInstall, isInstalled } = usePWAInstall();

  if (!isOpen) return null;

  const handleAdminManualDownload = async () => {
    const res = await triggerManualAdminInstall();
    if (res.installed || res.method === 'manual_download') {
      setAdminDownloaded(true);
      setTimeout(() => setAdminDownloaded(false), 3000);
    }
  };

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const token = 'token_' + Math.random().toString(36).substring(2, 12);
    setGeneratedToken(token);
    setIsSent(true);
  };

  const handleQuickPreset = (presetEmail: string, presetName: string, presetRole: UserRole) => {
    setEmail(presetEmail);
    setName(presetName);
    setRole(presetRole);
  };

  const handleConfirmLogin = () => {
    onLoginSuccess(
      email || 'admin@safefamily.org',
      name || (role === 'admin' ? 'Sarah Jenkins (Admin)' : 'Alex Member'),
      role
    );
    setIsSent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`relative w-full max-w-md rounded-3xl border p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <span>{t.magicLinkLogin}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          {t.passwordlessNotice}
        </p>

        {/* Quick Presets */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {t.quickDemoProfiles}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('admin@family.org', 'Sarah (Family Admin)', 'admin')}
              className="p-2.5 text-left rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-400 transition cursor-pointer"
            >
              <div className="text-xs font-bold text-emerald-800">{t.familyGuardianProfile}</div>
              <div className="text-[10px] text-slate-500 truncate">admin@family.org</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('dispatch@speedydelivery.com', 'Marcus (Delivery Dispatch)', 'admin')}
              className="p-2.5 text-left rounded-2xl bg-cyan-50/60 hover:bg-cyan-50 border border-cyan-200 hover:border-cyan-400 transition cursor-pointer"
            >
              <div className="text-xs font-bold text-cyan-800">{t.deliveryDispatcherProfile}</div>
              <div className="text-[10px] text-slate-500 truncate">dispatch@speedy.com</div>
            </button>
          </div>
        </div>

        {!isSent ? (
          <form onSubmit={handleSendLink} className="mt-5 space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t.yourNameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t.enterEmail}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourbusiness.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t.rolePortalLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    role === 'admin'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.badgeAdmin}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    role === 'member'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.roleMember}
                </button>
              </div>
            </div>

            {/* Admin Manual Download Option on Magic Link Form */}
            {role === 'admin' && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-slate-900 block">{t.adminLocalDownloadLabel}</span>
                  <span className="text-[11px] text-slate-500">{t.adminLocalDownloadSub}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAdminManualDownload}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{adminDownloaded ? t.downloadedBtn : (isInstalled ? t.appReady : t.downloadBtn)}</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.sendMagicLink}</span>
            </button>
          </form>
        ) : (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">{t.magicLinkSent}</h4>
            <p className="text-[11px] text-slate-600 mt-1">
              Sent to <strong className="text-emerald-700">{email}</strong>
            </p>

            <div className="mt-4 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-600 truncate shadow-2xs">
              {getPublicAppBaseUrl()}/?magic_token={generatedToken}
            </div>

            {/* Admin manual download option after login */}
            {role === 'admin' && (
              <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs text-left shadow-2xs">
                <span className="text-slate-600 text-[11px]">{t.adminLocalDownloadLabel}</span>
                <button
                  type="button"
                  onClick={handleAdminManualDownload}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>{adminDownloaded ? t.downloadedBtn : t.downloadBtn}</span>
                </button>
              </div>
            )}

            <button
              onClick={handleConfirmLogin}
              className="mt-4 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>{t.clickToSimulateLogin}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
