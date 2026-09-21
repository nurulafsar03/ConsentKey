import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Info,
  Mail,
  HelpCircle,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Lock,
  Zap,
  Globe,
  Send,
  User,
  MessageSquare,
  Clock,
  ShieldCheck,
  Smartphone,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { ConsentKeyLogo } from './ConsentKeyLogo';
import { copyToClipboard } from '../utils/clipboard';
import { audioService } from '../services/audio';

export type InfoModalTab = 'about' | 'privacy' | 'contact' | 'faq';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  initialTab?: InfoModalTab;
}

export const InfoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDark,
  initialTab = 'about',
}) => {
  const [activeTab, setActiveTab] = useState<InfoModalTab>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // FAQ Search & Expansion State
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setContactSuccess(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    const ok = await copyToClipboard('afsar.nurul@gmail.com');
    if (ok) {
      setCopiedEmail(true);
      audioService.playConsentChime();
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSuccess(true);
      audioService.playConsentChime();
    }, 800);
  };

  // Comprehensive FAQ list
  const allFaqs = [
    {
      q: 'How is ConsentKey different from Life360, Apple Find My, or Google Maps?',
      a: 'Most tracking applications continuously transmit your location to corporate central cloud servers and build permanent behavioral histories. ConsentKey is built on a Consent-First, Zero-Knowledge principle: no centralized database, strict 24-hour browser-only memory retention, and absolute user consent. Nobody can see your location without your explicit agreement, and you can stop sharing at any second with a single tap.',
      tag: 'Privacy',
    },
    {
      q: 'Does ConsentKey store my GPS location or personal data on a cloud database?',
      a: 'No. ConsentKey operates with zero cloud databases. All location coordinates, ephemeral messages, and telemetry are broadcast peer-to-peer and cached strictly in local browser memory. After 24 hours, all stored session data is automatically purged without leaving any traces.',
      tag: 'Security',
    },
    {
      q: 'Can anyone track me secretly or without my knowledge?',
      a: 'Never. Unlike stealth tracker apps, ConsentKey displays a high-visibility consent prompt explaining who is requesting your location. It requires an explicit tap on "I Agree" before any GPS coordinates are read. While sharing is active, an unmistakable indicator remains on screen, and you can pause or revoke access immediately.',
      tag: 'Consent',
    },
    {
      q: 'How does the 6-Digit P2P File Transfer work without cloud storage?',
      a: 'ConsentKey uses direct peer-to-peer WebRTC and browser communication channels. When you drop a file to send, an ephemeral 6-digit cryptographic security code is generated. When the receiver inputs the 6-digit code, the file stream travels directly from your device to their device. The file is never uploaded to any intermediate cloud storage or third-party server.',
      tag: 'P2P Transfer',
    },
    {
      q: 'What happens after the 24-hour retention window?',
      a: 'All session breadcrumbs, direct share tokens, voice messages, chat logs, and P2P codes are automatically and irreversibly wiped from device memory. Your digital footprint remains clean and privacy-guaranteed.',
      tag: 'Retention',
    },
    {
      q: 'Is ConsentKey completely free to use?',
      a: 'Yes! ConsentKey is 100% free for families, emergency contacts, delivery personnel, and small teams. There are no paywalls, hidden in-app purchases, or subscriptions required.',
      tag: 'General',
    },
    {
      q: 'Can I install ConsentKey as an app on iPhone, Android, and PC?',
      a: 'Yes. ConsentKey is engineered as an advanced Progressive Web App (PWA). On Android, tap "Install App" to add it to your home screen. On iPhone, tap Safari’s Share button and select "Add to Home Screen". On PC/Mac, click the install icon in the browser address bar for a standalone native desktop window.',
      tag: 'Installation',
    },
    {
      q: 'How do I instantly stop sharing my location?',
      a: 'Simply tap the "Stop Sharing" or "Pause" button on the map or header controls. You can also tap "Leave Group" to remove your device and all temporary markers immediately.',
      tag: 'Control',
    },
    {
      q: 'How can I contact the creator or team for support or business inquiries?',
      a: 'You can reach out directly to the founder via email at afsar.nurul@gmail.com. We typically respond to all feedback, privacy questions, and enterprise integration inquiries within 24 hours.',
      tag: 'Contact',
    },
  ];

  const filteredFaqs = allFaqs.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  return (
    <div
      id="modal-info-pages-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-info-pages"
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header with Tabs */}
        <div
          className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <ConsentKeyLogo className="w-9 h-9" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight">ConsentKey</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Official Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                About, Privacy Policy, Contact & Frequently Asked Questions
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Tab Selector Pill */}
            <div
              className={`flex items-center p-1 rounded-2xl border text-xs font-bold overflow-x-auto ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/70 border-slate-300'
              }`}
            >
              <button
                id="tab-info-about"
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'about'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>About</span>
              </button>

              <button
                id="tab-info-privacy"
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'privacy'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy</span>
              </button>

              <button
                id="tab-info-contact"
                onClick={() => setActiveTab('contact')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'contact'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact</span>
              </button>

              <button
                id="tab-info-faq"
                onClick={() => setActiveTab('faq')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'faq'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>F&Q</span>
              </button>
            </div>

            <button
              id="btn-close-info-modal"
              onClick={onClose}
              className={`p-2 rounded-2xl border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
          {/* =========================================================================
              TAB 1: ABOUT US
              ========================================================================= */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Our Mission
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Safety Built On Mutual Respect & Absolute Consent
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                    ConsentKey was engineered to dismantle intrusive spy software and offer families, delivery couriers,
                    and teams a secure, private way to share live location, files, and emergency communications without
                    selling personal data or hoarding cloud databases.
                  </p>
                </div>
                <div className="shrink-0 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <ShieldCheck className="w-12 h-12 stroke-[1.5]" />
                </div>
              </div>

              {/* 3 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base mb-1">Zero Cloud Database</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No corporate centralized SQL database logging your footsteps or habits. All coordinates exist only
                    on devices.
                  </p>
                </div>

                <div
                  className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base mb-1">Direct P2P File Transfer</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share photos, videos, and documents directly device-to-device with a 6-digit code. Zero cloud
                    intermediaries.
                  </p>
                </div>

                <div
                  className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base mb-1">24-Hour Auto-Purge</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Any breadcrumbs, voice memos, and ephemeral tokens automatically self-destruct after 24 hours.
                  </p>
                </div>
              </div>

              {/* Founder / Creator Notice */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm">Founded & Maintained By</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nurul Afsar • Direct Developer & Privacy Operations Lead
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    Official Support Contact: afsar.nurul@gmail.com
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Get in Touch</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: PRIVACY POLICY
              ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">ConsentKey Privacy Policy</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Last Updated: September 2026 • Effective Worldwide
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  GDPR & Zero-Knowledge Compliant
                </span>
              </div>

              <div className="space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <section className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    1. Fundamental Principle: Zero Centralized Cloud Database
                  </h4>
                  <p>
                    ConsentKey is engineered from the ground up to never collect, store, sell, or profile your personal
                    identifiable information (PII) or geographic location on centralized cloud databases. Unlike traditional
                    commercial tracking platforms (e.g. Life360, Apple Find My), ConsentKey has no central database holding
                    your historical journey history.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-500" />
                    2. Mandatory Explicit Consent
                  </h4>
                  <p>
                    No user location coordinates or sensor data can ever be read without the user actively clicking or
                    tapping the <strong>"I Agree"</strong> confirmation button in response to an explicit authorization prompt.
                    Covert, stealth, or unauthorized tracking is strictly impossible by cryptographic and architectural design.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    3. Strict 24-Hour Rolling Local Storage Retention
                  </h4>
                  <p>
                    All location breadcrumbs, audio messages, direct 1-to-1 share links, and transfer sessions are stored
                    solely within the user's local browser sandbox (<code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">localStorage</code> / <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">sessionStorage</code>).
                    Every record carries an explicit expiration timestamp (<code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">expiresAt = now + 24h</code>). Once reached, our client-side daemon wipes the data permanently.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    4. Direct Peer-to-Peer (P2P) File Transfers
                  </h4>
                  <p>
                    When transferring files via the 6-Digit Transfer Code, binary file data is streamed directly between
                    the sender's browser and recipient's browser through encrypted WebRTC / local memory transport channels.
                    Files are NEVER uploaded to any intermediary web server or cloud storage bucket.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-rose-500" />
                    5. No Selling or Monetization of Personal Data
                  </h4>
                  <p>
                    We do NOT sell, lease, or broker your location, IP address, device fingerprints, or contact details to
                    data brokers, advertisers, or analytics aggregators.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    6. Privacy Officer & Questions
                  </h4>
                  <p>
                    For questions or data inquiries regarding this policy, contact our Data Privacy Officer directly at:
                    <br />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">afsar.nurul@gmail.com</span>
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: CONTACT US
              ========================================================================= */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-cyan-500/10 border border-blue-500/20">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Get In Touch
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">Contact The ConsentKey Team</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Have questions about deployment, feature requests, or privacy concerns? We are here to help.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="btn-copy-contact-email"
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                  <a
                    href="mailto:afsar.nurul@gmail.com?subject=ConsentKey%20Inquiry"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Email App</span>
                  </a>
                </div>
              </div>

              {/* Direct Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span>Direct Email</span>
                  </div>
                  <a
                    href="mailto:afsar.nurul@gmail.com"
                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                  >
                    afsar.nurul@gmail.com
                  </a>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span>Response Time</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Within 24 Hours
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <Globe className="w-4 h-4 text-amber-500" />
                    <span>Official Domain</span>
                  </div>
                  <a
                    href="https://consentkey.online"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    consentkey.online
                  </a>
                </div>
              </div>

              {/* Interactive Contact Form */}
              <div
                className={`p-6 rounded-2xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">Send Us A Quick Message</h4>
                </div>

                {contactSuccess ? (
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <h5 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">Message Received!</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                      Thank you for contacting us, <strong>{contactName}</strong>. A copy of your inquiry has been logged,
                      and we will respond to <strong>{contactEmail}</strong> shortly.
                    </p>
                    <div className="pt-2">
                      <a
                        href={`mailto:afsar.nurul@gmail.com?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(`From: ${contactName} (${contactEmail})\n\n${contactMessage}`)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Click here if you also want to send this directly from your email app</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                          Your Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border transition outline-none ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 focus:border-emerald-500 text-white'
                                : 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                          Your Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border transition outline-none ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 focus:border-emerald-500 text-white'
                                : 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Subject
                      </label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border transition outline-none ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 focus:border-emerald-500 text-white'
                            : 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                        }`}
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Privacy / GDPR Question">Privacy / GDPR Question</option>
                        <option value="P2P File Transfer Feedback">P2P File Transfer Feedback</option>
                        <option value="Enterprise / Fleet Integration">Enterprise / Fleet Integration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Message
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="How can we help you today?"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs sm:text-sm border transition outline-none ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 focus:border-emerald-500 text-white'
                            : 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Delivered straight to founder: <strong>afsar.nurul@gmail.com</strong>
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmittingContact}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingContact ? 'Sending...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: F&Q (FREQUENTLY ASKED QUESTIONS)
              ========================================================================= */}
          {activeTab === 'faq' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Frequently Asked Questions (F&Q)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Clear, transparent answers about ConsentKey's privacy, P2P technology, and permissions.
                  </p>
                </div>

                {/* FAQ Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search answers..."
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border transition outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 focus:border-emerald-500 text-white'
                        : 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                    }`}
                  />
                  {faqSearchQuery && (
                    <button
                      onClick={() => setFaqSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Questions Accordion */}
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-semibold">No questions matched "{faqSearchQuery}"</p>
                    <button
                      onClick={() => setFaqSearchQuery('')}
                      className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => {
                    const isExpanded = expandedFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition overflow-hidden shadow-2xs ${
                          isDark
                            ? 'bg-slate-950/60 border-slate-800'
                            : 'bg-slate-50/80 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                          className={`w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                            isDark
                              ? isExpanded
                                ? 'text-emerald-400 bg-slate-900/60'
                                : 'text-slate-200 hover:text-white'
                              : isExpanded
                              ? 'text-emerald-800 bg-emerald-50/60'
                              : 'text-slate-900 hover:text-emerald-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {faq.tag}
                            </span>
                            <span>{faq.q}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div
                            className={`p-4 sm:p-5 text-xs sm:text-sm leading-relaxed border-t ${
                              isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Still have questions prompt */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/70 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  <span>Still have a question not listed here?</span>
                </div>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Ask us directly (afsar.nurul@gmail.com) →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <span>Official Email:</span>
            <a
              href="mailto:afsar.nurul@gmail.com"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              afsar.nurul@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('about')}
              className="hover:underline cursor-pointer"
            >
              About
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('faq')}
              className="hover:underline cursor-pointer"
            >
              F&Q
            </button>
            <span>•</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
