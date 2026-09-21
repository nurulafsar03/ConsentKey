import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { DirectShareLink } from '../types';
import { TranslationDict } from '../i18n/translations';
import { QrCode, Copy, Check, Trash2, Clock, Shield, Share2, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { getPublicAppBaseUrl } from '../utils/url';
import { copyToClipboard as safeCopyToClipboard } from '../utils/clipboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  currentLat: number;
  currentLng: number;
  t: TranslationDict;
  onShareCreated?: (share: DirectShareLink) => void;
}

export const DirectShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserEmail,
  currentLat,
  currentLng,
  t,
  onShareCreated,
}) => {
  const [label, setLabel] = useState<string>('Live Location (1-to-1)');
  const [durationHours, setDurationHours] = useState<number>(4);
  const [generatedShare, setGeneratedShare] = useState<DirectShareLink | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [existingShares, setExistingShares] = useState<DirectShareLink[]>([]);

  useEffect(() => {
    if (isOpen) {
      setExistingShares(StorageService.getDirectShares());
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    const shareId = 'share_' + Math.random().toString(36).substring(2, 9);
    const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;

    const newShare: DirectShareLink = {
      id: shareId,
      ownerId: currentUserId,
      ownerName: currentUserName,
      ownerEmail: currentUserEmail,
      label,
      lat: currentLat,
      lng: currentLng,
      createdAt: Date.now(),
      expiresAt,
      isRevoked: false,
      accuracy: 12,
      battery: 92,
    };

    StorageService.saveDirectShare(newShare);
    setExistingShares(StorageService.getDirectShares());
    setGeneratedShare(newShare);

    const publicBase = getPublicAppBaseUrl();
    const shareUrl = `${publicBase}/?direct_share=${shareId}`;
    try {
      const qr = await QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrCodeUrl(qr);
    } catch {}

    if (onShareCreated) {
      onShareCreated(newShare);
    }
  };

  const handleRevoke = (id: string) => {
    StorageService.revokeDirectShare(id);
    setExistingShares(StorageService.getDirectShares());
    if (generatedShare?.id === id) {
      setGeneratedShare(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    const ok = await safeCopyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-cyan-600 font-bold text-base">
            <div className="w-9 h-9 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-slate-900">{t.directShareTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {t.directShareDesc}
        </p>

        {/* Generator Form */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">{t.shareLabelPrompt}</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t.shareLabelPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-cyan-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">{t.expirationPrompt}</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 4, 12, 24].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDurationHours(hours)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    durationHours === hours
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {hours} {hours > 1 ? t.hoursSuffix : t.hourSuffix}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-sm transition cursor-pointer"
          >
            {t.createShareLink}
          </button>
        </div>

        {/* Generated Share Display */}
        {generatedShare && (
          <div className="mt-5 p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-center animate-in fade-in">
            <div className="text-xs font-bold text-cyan-800 uppercase tracking-wider mb-2">{t.liveShareActiveBadge}</div>
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="Direct Share QR"
                className="w-40 h-40 mx-auto rounded-xl bg-white p-2 shadow-sm mb-3 border border-slate-200"
              />
            )}
            <p className="text-xs text-slate-600 mb-3">{t.scanQRCode}</p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${getPublicAppBaseUrl()}/?direct_share=${generatedShare.id}`}
                className="flex-1 px-3 py-2 rounded-xl bg-white text-xs text-slate-700 border border-slate-200 font-mono truncate"
              />
              <button
                onClick={() => copyToClipboard(`${getPublicAppBaseUrl()}/?direct_share=${generatedShare.id}`)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copy}</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Active Shares */}
        {existingShares.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Active Direct Shares</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{share.label}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan-600" />
                      <span>Expires in {Math.max(1, Math.round((share.expiresAt - Date.now()) / (60 * 60 * 1000)))}h</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(share.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200"
                    title={t.revokeLink}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
