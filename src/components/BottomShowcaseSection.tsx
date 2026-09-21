import React, { useState } from 'react';
import {
  QrCode,
  EyeOff,
  Smartphone,
  Lock,
  Heart,
  Truck,
  Users,
  Check,
  X,
  ChevronDown,
  HelpCircle,
  Flame,
  Cloud,
  ChevronRight,
  ShieldCheck,
  Zap,
  Download,
} from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';

interface Props {
  t: TranslationDict;
  onOpenCloudflareModal: () => void;
  onOpenInfoModal?: (tab?: 'about' | 'privacy' | 'contact' | 'faq') => void;
}

export const BottomShowcaseSection: React.FC<Props> = ({
  t,
  onOpenCloudflareModal,
  onOpenInfoModal,
}) => {
  const { isDark } = useTheme();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  const faqItems = [
    { question: t.faq1Q, answer: t.faq1A },
    { question: t.faq2Q, answer: t.faq2A },
    { question: t.faq3Q, answer: t.faq3A },
    { question: t.faq4Q, answer: t.faq4A },
    { question: t.faq5Q, answer: t.faq5A },
  ];

  const comparisonRows = [
    {
      feature: t.featExplicitConsent,
      safeConsent: true,
      life360: false,
      appleFindMy: false,
      googleMaps: false,
    },
    {
      feature: t.feat24hRetention,
      safeConsent: true,
      life360: false,
      appleFindMy: false,
      googleMaps: false,
    },
    {
      feature: t.featZeroCloudDb,
      safeConsent: true,
      life360: false,
      appleFindMy: false,
      googleMaps: false,
    },
    {
      feature: t.featGeofenceZones,
      safeConsent: true,
      life360: true,
      appleFindMy: true,
      googleMaps: false,
    },
    {
      feature: t.featVoiceComms,
      safeConsent: true,
      life360: false,
      appleFindMy: false,
      googleMaps: false,
    },
    {
      feature: t.featInstantJoin,
      safeConsent: true,
      life360: false,
      appleFindMy: false,
      googleMaps: false,
    },
    {
      feature: t.featSosAlarm,
      safeConsent: true,
      life360: true,
      appleFindMy: true,
      googleMaps: false,
    },
  ];

  return (
    <section id="down-of-the-page-showcase" className={`pt-6 lg:pt-14 pb-12 lg:pb-20 px-4 sm:px-6 lg:px-8 border-t transition-colors ${
      isDark
        ? 'bg-slate-950/80 border-slate-800'
        : 'bg-gradient-to-b from-slate-50/60 via-white to-slate-50/80 border-slate-200'
    }`}>
      {/* Mobile & Tablet Collapsible Switcher */}
      <div className="lg:hidden max-w-5xl mx-auto mb-4">
        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition cursor-pointer shadow-2xs ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Platform Specs & Privacy FAQ (Optional)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>{isMobileExpanded ? 'Hide Specs' : 'View Specs'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      <div className={`max-w-5xl mx-auto space-y-16 ${isMobileExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* 1. Cloudflare Edge Hosting Summary Box */}
        <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 transition ${
          isDark
            ? 'bg-slate-900 border-amber-900/50'
            : 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border-amber-200 shadow-amber-100/40'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl border shadow-2xs ${
              isDark
                ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                : 'bg-amber-100 border-amber-300 text-amber-700'
            }`}>
              <Cloud className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t.cloudflareHostingTitle}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isDark
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-amber-200/90 text-amber-900 border border-amber-300'
                }`}>
                  Free Tier Ready
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.cloudflareHostingDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCloudflareModal}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs flex-shrink-0 ${
              isDark
                ? 'bg-amber-950/50 hover:bg-amber-900/50 border-amber-800/80 text-amber-300'
                : 'bg-amber-100 hover:bg-amber-200/90 border-amber-300 text-amber-900'
            }`}
          >
            <span>{t.viewCloudflareSpecs}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Four Core Trust Pillars */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Core Architectural Pillars</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Engineered for Complete Consent
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className={`p-5 rounded-2xl border shadow-2xs transition ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:border-emerald-600'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-emerald-50'
            }`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3.5 shadow-2xs ${
                isDark ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.pillar1Title}</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.pillar1Desc}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-2xs transition ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:border-teal-600'
                : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-teal-50'
            }`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3.5 shadow-2xs ${
                isDark ? 'bg-teal-950 border-teal-800 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.pillar2Title}</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.pillar2Desc}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-2xs transition ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:border-cyan-600'
                : 'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-cyan-50'
            }`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3.5 shadow-2xs ${
                isDark ? 'bg-cyan-950 border-cyan-800 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.pillar3Title}</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.pillar3Desc}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-2xs transition ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:border-indigo-600'
                : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-indigo-50'
            }`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3.5 shadow-2xs ${
                isDark ? 'bg-indigo-950 border-indigo-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.pillar4Title}</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.pillar4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Real-World Use Cases */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <Zap className="w-4 h-4" />
              <span>Real-World Operations</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.useCasesSub}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className={`p-6 rounded-2xl border shadow-xs transition ${
              isDark
                ? 'bg-slate-900 border-rose-900/60'
                : 'bg-gradient-to-br from-white to-rose-50/60 border-rose-200 shadow-rose-100/40'
            }`}>
              <div className="flex items-center gap-2.5 text-rose-500 mb-3">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.familiesTitle}</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.familiesDesc}</p>
            </div>

            <div className={`p-6 rounded-2xl border shadow-xs transition ${
              isDark
                ? 'bg-slate-900 border-amber-900/60'
                : 'bg-gradient-to-br from-white to-amber-50/60 border-amber-200 shadow-amber-100/40'
            }`}>
              <div className="flex items-center gap-2.5 text-amber-500 mb-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.deliveryTitle}</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.deliveryDesc}</p>
            </div>

            <div className={`p-6 rounded-2xl border shadow-xs transition ${
              isDark
                ? 'bg-slate-900 border-cyan-900/60'
                : 'bg-gradient-to-br from-white to-cyan-50/60 border-cyan-200 shadow-cyan-100/40'
            }`}>
              <div className="flex items-center gap-2.5 text-cyan-500 mb-3">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.teamsTitle}</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.teamsDesc}</p>
            </div>
          </div>
        </div>

        {/* 4. Direct Feature Comparison Matrix */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <Flame className="w-4 h-4" />
              <span>{t.compareHeader}</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.compareTitle}
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.compareSub}
            </p>
          </div>

          <div className={`overflow-x-auto rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <table className="w-full text-xs text-left">
              <thead className={`border-b font-bold uppercase text-[10px] tracking-wider ${
                isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="p-4 sm:px-6">{t.compareColFeature}</th>
                  <th className="p-4 text-emerald-600 dark:text-emerald-400 font-black">{t.compareColConsentKey}</th>
                  <th className="p-4 text-slate-500">Life360</th>
                  <th className="p-4 text-slate-500">Apple Find My</th>
                  <th className="p-4 text-slate-500">Google Maps</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className={`p-4 sm:px-6 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {row.feature}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                        </div>
                        <span>{t.yes}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {row.life360 ? (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.yes}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                            <X className="w-3 h-3 text-rose-600 stroke-[3]" />
                          </div>
                          <span>{t.no}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {row.appleFindMy ? (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.yes}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                            <X className="w-3 h-3 text-rose-600 stroke-[3]" />
                          </div>
                          <span>{t.no}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {row.googleMaps ? (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.yes}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                            <X className="w-3 h-3 text-rose-600 stroke-[3]" />
                          </div>
                          <span>{t.no}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Interactive FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>{t.faqHeader}</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.faqTitle}
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border overflow-hidden shadow-2xs transition ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className={`w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-sm font-bold transition cursor-pointer ${
                    isDark
                      ? 'text-white hover:text-emerald-400'
                      : 'text-slate-900 hover:text-emerald-700'
                  }`}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                      openFaqIndex === idx ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className={`px-4 sm:px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3.5 ${
                    isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'
                  }`}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick links to Full F&Q, Privacy & Direct Contact */}
          {onOpenInfoModal && (
            <div className={`mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  Have questions about zero-cloud privacy, WebRTC or P2P transfers?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-showcase-view-faqs"
                  onClick={() => onOpenInfoModal('faq')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  View All F&Q
                </button>
                <button
                  id="btn-showcase-contact-founder"
                  onClick={() => onOpenInfoModal('contact')}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Contact Founder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
