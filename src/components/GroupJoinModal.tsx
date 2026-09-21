import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  UserCheck,
  EyeOff,
  Lock,
  X,
  Check,
  Copy,
  Share2,
  Download,
  Smartphone,
  Sparkles,
  QrCode as QrCodeIcon,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Group } from '../types';
import { TranslationDict } from '../i18n/translations';
import { audioService } from '../services/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';
import { getPublicAppBaseUrl } from '../utils/url';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onAgreeToJoin: () => void;
  t: TranslationDict;
  initialMode?: 'invite' | 'join';
}

export const GroupJoinModal: React.FC<Props> = ({
  group,
  isOpen,
  onClose,
  onAgreeToJoin,
  t,
  initialMode,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [isProcessingAgree, setIsProcessingAgree] = useState<boolean>(false);
  const [showIOSHint, setShowIOSHint] = useState<boolean>(false);

  const { triggerAutoMemberInstall } = usePWAInstall();

  const publicBaseUrl = getPublicAppBaseUrl();
  const inviteUrl = `${publicBaseUrl}/?join=${group.inviteCode}`;

  useEffect(() => {
    // Generate high-resolution QR code
    QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrCodeDataUrl)
      .catch(() => {});
  }, [inviteUrl]);

  useEffect(() => {
    if (isOpen) {
      // If URL has ?join= or initialMode is 'join', show the joining consent screen
      const params = new URLSearchParams(window.location.search);
      if (params.get('join') || initialMode === 'join') {
        setActiveTab('join');
      } else {
        setActiveTab('invite');
      }
      setDownloadSuccessToast(null);
      setIsProcessingAgree(false);
      setShowIOSHint(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopied(true);
      audioService.playConsentChime();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on ${t.appName}`,
          text: `Join my private circle on ${t.appName}: ${inviteUrl}`,
          url: inviteUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Join ${group.name} on ${t.appName}: ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Triggered when someone connects via QR code or link and presses "I Agree"
  const handleAgreeAndAutoDownload = async () => {
    setIsProcessingAgree(true);
    audioService.playConsentChime();

    try {
      // 1. Automatically initiate WebApp download / native install without needing to press an install button
      const result = await triggerAutoMemberInstall();

      if (result.method === 'native_prompt') {
        setDownloadSuccessToast('📱 Web App install prompt opened! App is being added to your device.');
      } else if (result.method === 'auto_download') {
        setDownloadSuccessToast('📥 Web App package downloaded automatically to your device! Offline launcher ready.');
      } else if (result.method === 'ios_guide') {
        setShowIOSHint(true);
        setDownloadSuccessToast('📲 ConsentKey cached for offline use! Follow the 1-tap Home Screen step.');
      }
    } catch {
      setDownloadSuccessToast('✅ Web App cached locally and ready on your device!');
    }

    // Complete joining workflow and activate sharing
    setTimeout(() => {
      setIsProcessingAgree(false);
      onAgreeToJoin();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className={`relative w-full max-w-xl rounded-3xl border p-5 sm:p-7 shadow-2xl max-h-[94vh] overflow-y-auto transition ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Top Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border shadow-2xs ${
              isDark ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.appName}</h2>
              <p className="text-[11px] text-emerald-500 font-semibold">
                {t.explicitConsentRequired}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Invite (QR & Link) vs Join Consent Screen */}
        <div className={`mt-4 flex items-center p-1 rounded-2xl border text-xs font-semibold ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'invite'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCodeIcon className="w-3.5 h-3.5" />
            <span>{t.tabInvite}</span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.tabJoin}</span>
          </button>
        </div>

        {/* TAB 1: INVITE VIA QR CODE AND JOINING LINK */}
        {activeTab === 'invite' && (
          <div className="mt-4 space-y-4">
            {/* Automatic Download Notice Badge */}
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-slate-900">{t.frictionlessTitle}</strong> {t.frictionlessDesc}
              </div>
            </div>

            {/* QR Code and Details Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-2xl border transition ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              {/* QR Code display */}
              <div className={`sm:col-span-5 flex flex-col items-center justify-center p-3.5 rounded-2xl shadow-2xs border ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Joining QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR Code...
                  </div>
                )}
                <div className="mt-2 text-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {t.scanWithCamera}
                  </span>
                </div>
              </div>

              {/* Group Metadata & Joining Link Section */}
              <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      {t.groupCircle}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark ? 'bg-emerald-950/70 border-emerald-800 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}>
                      Public Mobile Ready
                    </span>
                  </div>
                  <h3 className={`text-lg font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.name}</h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.circleAdmin}: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{group.adminName}</span>
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.inviteCode}: <span className="font-mono text-emerald-500 font-bold">{group.inviteCode}</span>
                  </p>
                </div>

                {/* Direct Joining Link */}
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.directJoiningLink}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono select-all focus:outline-none focus:border-emerald-500 shadow-2xs ${
                        isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer flex-shrink-0"
                      title="Copy Joining Link"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t.copied : t.copy}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Share Triggers */}
                <div className={`pt-2 border-t flex items-center gap-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    onClick={handleNativeShare}
                    className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{t.shareLink}</span>
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-800 text-emerald-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.whatsApp}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* How to activate for external mobile phones hint */}
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
              isDark
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Opening on an external phone:</span> To open this link on your mobile, click the <strong>"Share"</strong> button in the top-right corner of Google AI Studio to publish the live URL.
                <div className="mt-1">
                  You can also test the Member mobile experience right on your screen by clicking <strong>"{t.testJoinBtn}"</strong> below!
                </div>
              </div>
            </div>

            {/* Test Recipient View Button */}
            <div className={`pt-1 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>{t.testJoinPrompt}</span>
              <button
                onClick={() => setActiveTab('join')}
                className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>{t.testJoinBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: JOIN & "I AGREE" AUTO-DOWNLOAD EXPERIENCE */}
        {activeTab === 'join' && (
          <div className="mt-4 space-y-4">
            {/* Download Success Banner when triggered */}
            {downloadSuccessToast && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="font-semibold">{downloadSuccessToast}</div>
              </div>
            )}

            {/* iOS Safari Home Screen Helper if relevant */}
            {showIOSHint && (
              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 text-xs text-slate-700 dark:text-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-cyan-800 dark:text-cyan-400">
                  <Smartphone className="w-4 h-4" />
                  <span>iOS Safari Auto-Ready:</span>
                </div>
                <p>
                  To keep ConsentKey on your iPhone Home Screen: tap Safari's <strong>Share</strong> button (⎋), then tap <strong>"Add to Home Screen"</strong> (+).
                </p>
              </div>
            )}

            {/* Group Details Summary */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  {t.connectingToCircle}
                </span>
                <h3 className={`text-lg font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.name}</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.circleAdmin}: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{group.adminName}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t.inviteCode}</span>
                <div className="font-mono text-sm text-emerald-500 font-bold">{group.inviteCode}</div>
              </div>
            </div>

            {/* Consent Clauses */}
            <div className="space-y-2.5">
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.zeroKnowledgeTerms}</span>
              </div>

              <div className={`grid gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>{t.termAdminOnlyTitle}</strong> {t.termAdminOnlyDesc}
                  </span>
                </div>

                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <EyeOff className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>{t.termExplicitSwitchTitle}</strong> {t.termExplicitSwitchDesc}
                  </span>
                </div>

                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>{t.term24hPurgeTitle}</strong> {t.term24hPurgeDesc}
                  </span>
                </div>

                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <Download className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>{t.termAutoDownloadTitle}</strong> {t.termAutoDownloadDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: "I Agree" triggers automatic app download */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-agree-join-group"
                onClick={handleAgreeAndAutoDownload}
                disabled={isProcessingAgree}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isProcessingAgree ? (
                  <>
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>{t.downloadingApp}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t.iAgreeToJoin} {t.autoDownloadAppSuffix}</span>
                  </>
                )}
              </button>

              <button
                id="btn-decline-join-group"
                onClick={onClose}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                {t.decline}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
