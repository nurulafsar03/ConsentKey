import React, { useState } from 'react';
import { Cloud, Check, Copy, ExternalLink, ShieldCheck, Zap, Globe, X } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDict;
}

export const CloudflareModal: React.FC<Props> = ({ isOpen, onClose, t }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const wranglerConfig = `name = "consentkey-app"
compatibility_date = "2024-09-01"
pages_build_output_dir = "./dist"

# Production environment configuration for consentkey.online
[vars]
ENVIRONMENT = "production"
APP_NAME = "ConsentKey"
PRIMARY_DOMAIN = "consentkey.online"`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(wranglerConfig);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-amber-200 p-6 md:p-8 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <Cloud className="w-5 h-5 text-amber-600" />
            <span>{t.cloudflareHostingTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          {t.cloudflareHostingDesc}
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <Globe className="w-4 h-4 text-amber-600 mb-1.5" />
            <h4 className="text-xs font-bold text-slate-900">{t.globalEdgeNetwork}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.globalEdgeDesc}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <Zap className="w-4 h-4 text-amber-600 mb-1.5" />
            <h4 className="text-xs font-bold text-slate-900">{t.zeroColdStarts}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.zeroColdStartsDesc}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 mb-1.5" />
            <h4 className="text-xs font-bold text-slate-900">{t.freeTierFriendly}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.freeTierDesc}</p>
          </div>
        </div>

        {/* Build Specs */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.wranglerConfigLabel}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.configCopied : t.copyWranglerConfig}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 mb-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div><strong>Framework:</strong> Vite (React + TS)</div>
            <div><strong>Build Command:</strong> <code className="text-amber-700 font-mono font-semibold">npm run build</code></div>
            <div><strong>Build Output Directory:</strong> <code className="text-amber-700 font-mono font-semibold">dist</code></div>
            <div><strong>Root Directory:</strong> <code className="text-amber-700 font-mono font-semibold">/</code></div>
          </div>

          <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-xl overflow-x-auto border border-slate-200 shadow-2xs">
            {wranglerConfig}
          </pre>
        </div>

        {/* Custom Domain Section for consentkey.online */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1.5">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Custom Domain Setup: <code className="font-mono text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-300">consentkey.online</code></span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed mb-3">
            To connect your domain <strong>consentkey.online</strong> to your Cloudflare Pages project:
          </p>
          <div className="space-y-2 text-[11px] text-slate-700 bg-white/90 p-3 rounded-xl border border-emerald-200 shadow-2xs font-mono">
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">1.</span>
              <span>In Cloudflare Dashboard: go to <strong>Pages</strong> &gt; your project &gt; <strong>Custom Domains</strong> &gt; click <strong>Set up a custom domain</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">2.</span>
              <span>Enter <strong className="text-emerald-700">consentkey.online</strong> (and optionally <strong className="text-emerald-700">www.consentkey.online</strong>).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">3.</span>
              <span>DNS CNAME record: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">@ (root) -&gt; consentkey-app.pages.dev</code> (Proxied / Orange Cloud).</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition cursor-pointer"
        >
          {t.dismiss}
        </button>
      </div>
    </div>
  );
};
