import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  X,
  Check,
  Copy,
  Share2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { Group } from '../types';
import { TranslationDict } from '../i18n/translations';
import { audioService } from '../services/audio';
import { useTheme } from '../context/ThemeContext';
import { getPublicAppBaseUrl } from '../utils/url';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDict;
}

// Invite modal: shows the real QR code and joining link for this circle.
// Anyone scanning the code or opening the link is sent to the real
// registration form (pre-filled with this circle's invite code), which
// actually registers them on the server as a Member — see App.tsx's
// joinInviteCode handling. This modal used to also have a "Test Join" tab
// that simulated what a joiner sees without ever calling the backend; it
// was removed since it was demo-only clutter and could confuse people
// into thinking they'd added a real member.
export const GroupJoinModal: React.FC<Props> = ({ group, isOpen, onClose, t }) => {
  const { isDark } = useTheme();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

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

        {/* INVITE VIA QR CODE AND JOINING LINK */}
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

          </div>
      </div>
    </div>
  );
};
