import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  LayoutGrid,
  Code2,
  Image as ImageIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Layers,
  MapPin,
  Activity,
  Battery,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Copy,
  Check,
  Video,
  Play,
  Move,
  Palette,
  Film,
  Type,
  GripVertical,
} from 'lucide-react';
import { AdCampaign, AdDurationPeriod, AdPlacement, AdSize, AdType, Member, Group } from '../types';
import { TranslationDict } from '../i18n/translations';
import { generateHtmlFrameEmbedCode } from '../utils/adGenerator';
import { copyToClipboard } from '../utils/clipboard';
import { getPublicAppBaseUrl } from '../utils/url';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  groups: Group[];
  campaigns: AdCampaign[];
  onSaveCampaigns: (campaigns: AdCampaign[]) => void;
  isDark?: boolean;
  t: TranslationDict;
}

export const AdminPanelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  members,
  groups,
  campaigns: initialCampaigns,
  onSaveCampaigns,
  isDark = true,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'creative_studio' | 'ads' | 'new_ad'>('creative_studio');
  const [campaignList, setCampaignList] = useState<AdCampaign[]>(initialCampaigns);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Creative Studio Builder State (Images, Videos, YouTube, Rich Text Cards, Auto Embed Generator)
  const [studioMediaType, setStudioMediaType] = useState<'image' | 'video' | 'youtube' | 'text_card'>('image');
  const [studioMediaUrl, setStudioMediaUrl] = useState('https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80');
  const [studioHeadline, setStudioHeadline] = useState('Wilderness Navigation & Emergency GPS');
  const [studioBody, setStudioBody] = useState('Certified satellite rescue beacons and family tracking gear. Get 20% off your seasonal safety kit.');
  const [studioBadge, setStudioBadge] = useState('PREMIUM SPONSOR');
  const [studioCtaText, setStudioCtaText] = useState('Explore Partner Gear');
  const [studioCtaUrl, setStudioCtaUrl] = useState('https://google.com');
  const [studioThemeColor, setStudioThemeColor] = useState('#06b6d4');
  const [studioBgColor, setStudioBgColor] = useState('#0f172a');
  const [studioTextColor, setStudioTextColor] = useState('#f8fafc');
  const [studioAutoplay, setStudioAutoplay] = useState(true);
  const [studioMuted, setStudioMuted] = useState(true);
  const [studioLoop, setStudioLoop] = useState(true);
  const [studioShowControls, setStudioShowControls] = useState(true);
  const [studioPlacement, setStudioPlacement] = useState<AdPlacement>('draggable_float');
  const [studioPeriod, setStudioPeriod] = useState<AdDurationPeriod>('3_months');
  const [studioCustomEndDate, setStudioCustomEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);
  const [studioSaveSuccess, setStudioSaveSuccess] = useState(false);

  // New Ad Form State
  const [newAdName, setNewAdName] = useState('');
  const [newAdType, setNewAdType] = useState<AdType>('adsense');
  const [newAdPlacement, setNewAdPlacement] = useState<AdPlacement>('top_banner');
  const [newAdSize, setNewAdSize] = useState<AdSize>('responsive');
  const [newAdEmbedCode, setNewAdEmbedCode] = useState('');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdTargetUrl, setNewAdTargetUrl] = useState('');
  const [newAdTimingMode, setNewAdTimingMode] = useState<'always' | 'interval' | 'delay_seconds'>('always');
  const [newAdInterval, setNewAdInterval] = useState<number>(30);
  const [newAdDuration, setNewAdDuration] = useState<number>(10);

  // Calendar Validity / Expiration Period (1, 2, 3, 4, 6 months, 1 year, or custom)
  const [newAdPeriod, setNewAdPeriod] = useState<AdDurationPeriod>('unlimited');
  const [newAdCustomEndDate, setNewAdCustomEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  // Helper to compute end timestamp in milliseconds
  const computeEndDate = (startDate: number, period: AdDurationPeriod, customDateStr?: string): number | undefined => {
    if (period === 'unlimited') return undefined;
    if (period === 'custom') {
      if (!customDateStr) return undefined;
      const end = new Date(customDateStr);
      end.setHours(23, 59, 59, 999);
      return end.getTime();
    }
    const d = new Date(startDate);
    switch (period) {
      case '1_month':
        d.setMonth(d.getMonth() + 1);
        return d.getTime();
      case '2_months':
        d.setMonth(d.getMonth() + 2);
        return d.getTime();
      case '3_months':
        d.setMonth(d.getMonth() + 3);
        return d.getTime();
      case '4_months':
        d.setMonth(d.getMonth() + 4);
        return d.getTime();
      case '6_months':
        d.setMonth(d.getMonth() + 6);
        return d.getTime();
      case '1_year':
        d.setFullYear(d.getFullYear() + 1);
        return d.getTime();
      default:
        return undefined;
    }
  };

  const handleToggleCampaign = (id: string) => {
    const updated = campaignList.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setCampaignList(updated);
    onSaveCampaigns(updated);
  };

  const handleDeleteCampaign = (id: string) => {
    const updated = campaignList.filter((c) => c.id !== id);
    setCampaignList(updated);
    onSaveCampaigns(updated);
  };

  // Quick Extend Ad Duration by X Months
  const handleExtendCampaign = (id: string, monthsToAdd: number) => {
    const now = Date.now();
    const updated = campaignList.map((c) => {
      if (c.id !== id) return c;
      const baseTime = c.endDate && c.endDate > now ? c.endDate : now;
      const d = new Date(baseTime);
      d.setMonth(d.getMonth() + monthsToAdd);
      return {
        ...c,
        enabled: true,
        endDate: d.getTime(),
        durationPeriod: (monthsToAdd === 1
          ? '1_month'
          : monthsToAdd === 2
          ? '2_months'
          : monthsToAdd === 3
          ? '3_months'
          : monthsToAdd === 6
          ? '6_months'
          : '1_year') as AdDurationPeriod,
      };
    });
    setCampaignList(updated);
    onSaveCampaigns(updated);
  };

  // Set Ad to Permanent / Indefinite
  const handleSetPermanent = (id: string) => {
    const updated = campaignList.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        enabled: true,
        endDate: undefined,
        durationPeriod: 'unlimited' as AdDurationPeriod,
      };
    });
    setCampaignList(updated);
    onSaveCampaigns(updated);
  };

  // Change Campaign Placement (Top Banner, Sidebar, Bottom Bar, Popup, Draggable Float)
  const handleChangeCampaignPlacement = (id: string, placement: AdPlacement) => {
    const updated = campaignList.map((c) =>
      c.id === id
        ? {
            ...c,
            placement,
            floatPosition: placement === 'draggable_float' ? (c.floatPosition || { x: 30, y: 120 }) : c.floatPosition,
          }
        : c
    );
    setCampaignList(updated);
    onSaveCampaigns(updated);
  };

  // Reset Draggable Float Position
  const handleResetCampaignPosition = (id: string) => {
    const updated = campaignList.map((c) =>
      c.id === id ? { ...c, floatPosition: { x: 30, y: 120 } } : c
    );
    setCampaignList(updated);
    onSaveCampaigns(updated);
  };

  // Live Auto-Generated Embed Code
  const generatedEmbedCode = useMemo(() => {
    return generateHtmlFrameEmbedCode({
      mediaType: studioMediaType,
      mediaUrl: studioMediaUrl,
      headline: studioHeadline,
      body: studioBody,
      badge: studioBadge,
      ctaText: studioCtaText,
      ctaUrl: studioCtaUrl,
      themeColor: studioThemeColor,
      bgColor: studioBgColor,
      textColor: studioTextColor,
      autoplay: studioAutoplay,
      muted: studioMuted,
      loop: studioLoop,
      showControls: studioShowControls,
    });
  }, [
    studioMediaType,
    studioMediaUrl,
    studioHeadline,
    studioBody,
    studioBadge,
    studioCtaText,
    studioCtaUrl,
    studioThemeColor,
    studioBgColor,
    studioTextColor,
    studioAutoplay,
    studioMuted,
    studioLoop,
    studioShowControls,
  ]);

  const applyStudioPreset = (preset: 'image' | 'video' | 'youtube' | 'text_card') => {
    setStudioMediaType(preset);
    if (preset === 'image') {
      setStudioMediaUrl('https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80');
      setStudioHeadline('Wilderness Gear & Emergency Tracker');
      setStudioBody('Equip your family with top-rated satellite rescue beacons and durable outdoor safety tools.');
      setStudioBadge('PREMIUM SPONSOR');
      setStudioCtaText('Explore Gear');
      setStudioCtaUrl('https://google.com');
      setStudioThemeColor('#06b6d4');
    } else if (preset === 'video') {
      setStudioMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setStudioHeadline('Live Admin Video Showcase');
      setStudioBody('Experience continuous GPS trail tracking, geofence alerts, and instant direct SOS dispatch.');
      setStudioBadge('PROMO VIDEO');
      setStudioCtaText('Watch Full Story');
      setStudioCtaUrl('https://google.com');
      setStudioThemeColor('#10b981');
    } else if (preset === 'youtube') {
      setStudioMediaUrl('https://www.youtube.com/watch?v=ScMzIvxBSi4');
      setStudioHeadline('Family Location Safety Guide');
      setStudioBody('Full video breakdown on creating geofence perimeters and managing family consent.');
      setStudioBadge('YOUTUBE GUIDE');
      setStudioCtaText('View Video Channel');
      setStudioCtaUrl('https://youtube.com');
      setStudioThemeColor('#f59e0b');
    } else if (preset === 'text_card') {
      setStudioMediaUrl('');
      setStudioHeadline('Special Offer: 50% Off Fleet Upgrade');
      setStudioBody('Get multi-admin roles, 30-day location history retention, and priority emergency response.');
      setStudioBadge('LIMITED OFFER');
      setStudioCtaText('Claim 50% Discount');
      setStudioCtaUrl('https://google.com');
      setStudioThemeColor('#ec4899');
    }
  };

  const handleCopyEmbedCode = async () => {
    const ok = await copyToClipboard(generatedEmbedCode);
    if (ok) {
      setCopiedEmbedCode(true);
      setTimeout(() => setCopiedEmbedCode(false), 2500);
    }
  };

  const handleSaveStudioAd = () => {
    const now = Date.now();
    const endMs = computeEndDate(now, studioPeriod, studioCustomEndDate);
    const newCampaign: AdCampaign = {
      id: `ad_creative_${Date.now()}`,
      name: studioHeadline.trim() || 'Interactive Frame Ad',
      enabled: true,
      type: 'embed_html',
      placement: studioPlacement,
      size: 'responsive',
      embedCode: generatedEmbedCode,
      timingMode: 'always',
      displayIntervalSeconds: 30,
      durationSeconds: 0,
      durationPeriod: studioPeriod,
      startDate: now,
      endDate: endMs,
      floatPosition: studioPlacement === 'draggable_float' ? { x: 30, y: 120 } : undefined,
      createdAt: now,
    };

    const updated = [newCampaign, ...campaignList];
    setCampaignList(updated);
    onSaveCampaigns(updated);
    setStudioSaveSuccess(true);
    setTimeout(() => {
      setStudioSaveSuccess(false);
      setActiveTab('ads');
    }, 1500);
  };

  const handleCopyAdminUrl = async () => {
    const adminUrl = `${getPublicAppBaseUrl()}/admin`;
    const ok = await copyToClipboard(adminUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCreateNewAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdName.trim()) return;

    const startDate = Date.now();
    const endDate = computeEndDate(startDate, newAdPeriod, newAdCustomEndDate);

    const newCampaign: AdCampaign = {
      id: `ad_${Date.now()}`,
      name: newAdName.trim(),
      enabled: true,
      type: newAdType,
      placement: newAdPlacement,
      size: newAdSize,
      embedCode: newAdEmbedCode.trim(),
      bannerImageUrl: newAdImageUrl.trim(),
      bannerTargetUrl: newAdTargetUrl.trim(),
      timingMode: newAdTimingMode,
      displayIntervalSeconds: Number(newAdInterval) || 30,
      durationSeconds: Number(newAdDuration) || 0,
      durationPeriod: newAdPeriod,
      startDate,
      endDate,
      createdAt: Date.now(),
    };

    const updated = [newCampaign, ...campaignList];
    setCampaignList(updated);
    onSaveCampaigns(updated);

    // Reset Form
    setNewAdName('');
    setNewAdEmbedCode('');
    setNewAdImageUrl('');
    setNewAdTargetUrl('');
    setNewAdPeriod('unlimited');
    setActiveTab('ads');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Sample quick templates
  const loadAdSenseTemplate = () => {
    setNewAdName('Google AdSense Display Leaderboard');
    setNewAdType('adsense');
    setNewAdPlacement('top_banner');
    setNewAdSize('responsive');
    setNewAdTimingMode('always');
    setNewAdEmbedCode(
      `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<!-- Responsive ConsentKey Banner -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`
    );
  };

  const loadCustomBannerTemplate = () => {
    setNewAdName('Special Partner Promotion');
    setNewAdType('custom_banner');
    setNewAdPlacement('popup_interstitial');
    setNewAdSize('300x250');
    setNewAdImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80');
    setNewAdTargetUrl('https://example.com/promo');
    setNewAdTimingMode('delay_seconds');
    setNewAdInterval(5); // show after 5s
    setNewAdDuration(12); // auto close after 12s
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-cyan-500 text-slate-950 shadow-md">
              <ShieldAlert className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <span>Master Admin & Ad Management</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                View real-time active users & configure Google AdSense or custom embed codes with timing control
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-2 px-6 py-2 border-b text-xs font-bold overflow-x-auto ${
          isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-100/50'
        }`}>
          <button
            onClick={() => setActiveTab('creative_studio')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'creative_studio'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🎨 Ad Creative Studio & Drag Placement</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'ads'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Active Slots & Placements ({campaignList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('new_ad')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'new_ad'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Raw Embed / AdSense Form</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Fleet & Users ({members.length})</span>
          </button>
        </div>

        {/* Master Admin URL & Custom Domain Notice Banner */}
        <div className={`mx-6 mt-4 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-base">🌐</span>
            <div>
              <p className="font-bold text-slate-200">
                Direct Master Admin Link: <span className="font-mono text-cyan-400 font-normal">{typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin'}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Works on this preview and remains identical after connecting your custom domain (e.g. <code className="text-amber-300">https://yourdomain.com/admin</code> or <code className="text-amber-300">?admin=true</code>).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyAdminUrl}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0 ${
              copiedLink
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Admin Link</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* =========================================================================
              TAB 1: USERS & ACTIVE MEMBERS DIRECTORY
              ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Connected Users & Field Devices</h3>
                  <p className="text-xs text-slate-400">
                    Live GPS telemetry, role assignments, consent state, and battery status.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-semibold">
                  {members.filter((m) => m.isSharingLocation).length} Sharing GPS Now
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-700"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            member.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{member.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              member.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{member.email}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {member.isSharingLocation
                              ? `${member.lat?.toFixed(4)}, ${member.lng?.toFixed(4)}`
                              : 'Location Hidden'}
                          </span>
                          {member.battery !== undefined && (
                            <span className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-cyan-400" />
                              {member.battery}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          member.isConsentGiven
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {member.isConsentGiven ? 'Consent Active' : 'Consent Revoked'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Room: {groups.find((g) => g.id === member.groupId)?.name || 'Default Circle'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: CREATIVE STUDIO & DRAG-AND-DROP PLACEMENT GENERATOR
              ========================================================================= */}
          {activeTab === 'creative_studio' && (
            <div className="space-y-6">
              {/* Feature Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-black text-white">Visual Ad Frame Builder & Code Generator</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Drag & Drop Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Build high-impact custom image banners, MP4 videos, YouTube embeds, or rich text announcements. Automatically generate clean HTML frame embed code and drag & drop placement anywhere on the website.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyStudioPreset('image')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Image Banner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStudioPreset('video')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MP4 Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStudioPreset('youtube')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>YouTube</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStudioPreset('text_card')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-rose-400" />
                    <span>Text Card</span>
                  </button>
                </div>
              </div>

              {/* Two Column Workspace: Form on Left, Live Preview & Code on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Creative Options Form */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Media Format Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Select Creative Format</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setStudioMediaType('image')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          studioMediaType === 'image'
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-[11px]">Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioMediaType('video')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          studioMediaType === 'video'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-[11px]">MP4 Video</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioMediaType('youtube')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          studioMediaType === 'youtube'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        <span className="text-[11px]">YouTube</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioMediaType('text_card')}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          studioMediaType === 'text_card'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Type className="w-4 h-4" />
                        <span className="text-[11px]">Text Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Media Source Input */}
                  {studioMediaType !== 'text_card' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>
                          {studioMediaType === 'image'
                            ? 'Image URL (JPG, PNG, WebP, GIF)'
                            : studioMediaType === 'video'
                            ? 'Video Direct URL (MP4, WebM)'
                            : 'YouTube Video Link or ID'}
                        </span>
                        <span className="text-[10px] text-slate-500">Live preview below</span>
                      </label>
                      <input
                        type="url"
                        value={studioMediaUrl}
                        onChange={(e) => setStudioMediaUrl(e.target.value)}
                        placeholder={
                          studioMediaType === 'image'
                            ? 'https://example.com/banner.jpg'
                            : studioMediaType === 'video'
                            ? 'https://example.com/promo.mp4'
                            : 'https://www.youtube.com/watch?v=...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Video Options if Video / YouTube */}
                  {(studioMediaType === 'video' || studioMediaType === 'youtube') && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioAutoplay}
                          onChange={(e) => setStudioAutoplay(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>Autoplay</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioMuted}
                          onChange={(e) => setStudioMuted(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>Muted</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioLoop}
                          onChange={(e) => setStudioLoop(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>Loop</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioShowControls}
                          onChange={(e) => setStudioShowControls(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>Controls</span>
                      </label>
                    </div>
                  )}

                  {/* Copywriting & Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Badge Label</label>
                      <input
                        type="text"
                        value={studioBadge}
                        onChange={(e) => setStudioBadge(e.target.value)}
                        placeholder="SPONSORED, PARTNER, PROMO"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none font-bold uppercase tracking-wider"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Theme Accent Color</label>
                      <div className="flex items-center gap-1.5">
                        {['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setStudioThemeColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                              studioThemeColor === color ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={studioThemeColor}
                          onChange={(e) => setStudioThemeColor(e.target.value)}
                          className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer ml-1"
                          title="Custom Color"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Headline / Ad Title</label>
                    <input
                      type="text"
                      value={studioHeadline}
                      onChange={(e) => setStudioHeadline(e.target.value)}
                      placeholder="Catchy ad title or promotional offer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Description / Supporting Copy</label>
                    <textarea
                      rows={2}
                      value={studioBody}
                      onChange={(e) => setStudioBody(e.target.value)}
                      placeholder="Brief description of the product, offer, or service..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Call To Action (CTA) Button</label>
                      <input
                        type="text"
                        value={studioCtaText}
                        onChange={(e) => setStudioCtaText(e.target.value)}
                        placeholder="Visit Website, Shop Now, Get 20% Off"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Target Destination URL</label>
                      <input
                        type="url"
                        value={studioCtaUrl}
                        onChange={(e) => setStudioCtaUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Placement & Validity Options */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
                        <Move className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Website Placement Mode</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            studioPlacement === 'draggable_float'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="studio_placement"
                            value="draggable_float"
                            checked={studioPlacement === 'draggable_float'}
                            onChange={() => setStudioPlacement('draggable_float')}
                            className="text-cyan-500 focus:ring-0"
                          />
                          <div>
                            <p className="text-xs font-black text-cyan-300">📍 Free-Float Draggable</p>
                            <p className="text-[10px] text-slate-400">Drag & drop anywhere on the website!</p>
                          </div>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            studioPlacement === 'top_banner'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="studio_placement"
                            value="top_banner"
                            checked={studioPlacement === 'top_banner'}
                            onChange={() => setStudioPlacement('top_banner')}
                            className="text-cyan-500 focus:ring-0"
                          />
                          <div>
                            <p className="text-xs font-black">⬆️ Top Header Banner</p>
                            <p className="text-[10px] text-slate-400">Standard prominent top slot</p>
                          </div>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            studioPlacement === 'bottom_bar'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="studio_placement"
                            value="bottom_bar"
                            checked={studioPlacement === 'bottom_bar'}
                            onChange={() => setStudioPlacement('bottom_bar')}
                            className="text-cyan-500 focus:ring-0"
                          />
                          <div>
                            <p className="text-xs font-black">⬇️ Floating Bottom Bar</p>
                            <p className="text-[10px] text-slate-400">Fixed dock at the foot of page</p>
                          </div>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            studioPlacement === 'popup_interstitial'
                              ? 'bg-cyan-950/60 border-cyan-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="studio_placement"
                            value="popup_interstitial"
                            checked={studioPlacement === 'popup_interstitial'}
                            onChange={() => setStudioPlacement('popup_interstitial')}
                            className="text-cyan-500 focus:ring-0"
                          />
                          <div>
                            <p className="text-xs font-black">🪟 Popup Interstitial</p>
                            <p className="text-[10px] text-slate-400">Modal card with close button</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Validity Period Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Campaign Validity Period</span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: '1_month', label: '1 Month' },
                          { id: '2_months', label: '2 Months' },
                          { id: '3_months', label: '3 Months' },
                          { id: '4_months', label: '4 Months' },
                          { id: '6_months', label: '6 Months' },
                          { id: '1_year', label: '1 Year' },
                          { id: 'unlimited', label: 'Permanent' },
                          { id: 'custom', label: 'Custom Date' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setStudioPeriod(p.id as AdDurationPeriod)}
                            className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer text-xs font-bold ${
                              studioPeriod === p.id
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {studioPeriod === 'custom' && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Expiration Date:</span>
                          <input
                            type="date"
                            value={studioCustomEndDate}
                            onChange={(e) => setStudioCustomEndDate(e.target.value)}
                            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Interactive Frame Preview & Generated Embed Code */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Card 1: Real-Time Live Render Preview */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-slate-200">Interactive Frame Live Preview</h4>
                      </div>
                      {studioPlacement === 'draggable_float' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <GripVertical className="w-3 h-3" />
                          <span>Draggable Float Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {studioPlacement.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Preview Box Container */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center min-h-[220px]">
                      <div
                        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border transition-all"
                        style={{
                          backgroundColor: studioBgColor,
                          borderColor: studioThemeColor,
                          color: studioTextColor,
                        }}
                      >
                        {/* If draggable_float selected, show the drag handle preview bar */}
                        {studioPlacement === 'draggable_float' && (
                          <div className="px-3 py-1.5 bg-black/60 border-b border-white/10 flex items-center justify-between text-[10px] font-bold text-slate-300 select-none">
                            <span className="flex items-center gap-1 text-cyan-300">
                              <GripVertical className="w-3.5 h-3.5" />
                              <span>Drag anywhere on website</span>
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                              Ad Widget
                            </span>
                          </div>
                        )}

                        {/* Media Section */}
                        {studioMediaType === 'image' && studioMediaUrl && (
                          <div className="relative w-full h-40 bg-black overflow-hidden">
                            <img
                              src={studioMediaUrl}
                              alt={studioHeadline}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            {studioBadge && (
                              <div
                                className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-black shadow-md"
                                style={{ backgroundColor: studioThemeColor }}
                              >
                                {studioBadge}
                              </div>
                            )}
                          </div>
                        )}

                        {studioMediaType === 'video' && studioMediaUrl && (
                          <div className="relative w-full h-40 bg-black overflow-hidden">
                            <video
                              src={studioMediaUrl}
                              autoPlay={studioAutoplay}
                              muted={studioMuted}
                              loop={studioLoop}
                              controls={studioShowControls}
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            {studioBadge && (
                              <div
                                className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-black shadow-md pointer-events-none"
                                style={{ backgroundColor: studioThemeColor }}
                              >
                                {studioBadge}
                              </div>
                            )}
                          </div>
                        )}

                        {studioMediaType === 'youtube' && studioMediaUrl && (
                          <div className="relative w-full h-40 bg-black overflow-hidden">
                            {(() => {
                              const match = studioMediaUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                              const id = match ? match[1] : '';
                              return id ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${id}?autoplay=${studioAutoplay ? 1 : 0}&mute=${studioMuted ? 1 : 0}&loop=${studioLoop ? 1 : 0}`}
                                  title="Ad Preview"
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                                  Provide valid YouTube link
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {studioMediaType === 'text_card' && studioBadge && (
                          <div className="pt-3 px-4">
                            <span
                              className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-black"
                              style={{ backgroundColor: studioThemeColor }}
                            >
                              {studioBadge}
                            </span>
                          </div>
                        )}

                        {/* Content Body */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-black text-sm leading-snug line-clamp-2">
                            {studioHeadline || 'Headline preview...'}
                          </h4>
                          <p className="text-xs opacity-80 leading-relaxed line-clamp-3">
                            {studioBody || 'Ad description text will appear here...'}
                          </p>

                          {studioCtaText && (
                            <div className="pt-2">
                              <a
                                href={studioCtaUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full py-2 px-3 text-center rounded-xl font-black text-xs transition uppercase tracking-wider shadow-lg"
                                style={{
                                  backgroundColor: studioThemeColor,
                                  color: '#020617',
                                }}
                              >
                                {studioCtaText} →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Auto-Generated HTML Embed Code & Placement Button */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-200">Automatically Generated HTML Embed Code</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyEmbedCode}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedEmbedCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/70 border border-slate-800 font-mono text-[10px] text-emerald-400 max-h-36 overflow-y-auto leading-relaxed select-all">
                      {generatedEmbedCode}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-400">
                        {studioPlacement === 'draggable_float'
                          ? '📍 Will float on the website and can be dragged anywhere by mouse or finger touch.'
                          : `Placed in ${studioPlacement.replace('_', ' ')} with responsive layout.`}
                      </p>

                      <button
                        type="button"
                        onClick={handleSaveStudioAd}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition active:scale-98"
                      >
                        {studioSaveSuccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Activated on Website!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save & Place on Website</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: ACTIVE ADS & CAMPAIGNS LIST
              ========================================================================= */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Configured Ad Placements & Embeds</h3>
                  <p className="text-xs text-slate-400">
                    Control which ad slots show, switch between AdSense and direct embeds, and modify timing.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('new_ad')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Ad / Embed</span>
                </button>
              </div>

              {campaignList.length === 0 ? (
                <div className={`p-10 rounded-2xl border text-center space-y-3 ${
                  isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
                }`}>
                  <LayoutGrid className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold">No ads currently configured</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Your pages are currently showing completely clean with zero ads. You can add your Google AdSense snippet or embed code at any time.
                  </p>
                  <button
                    onClick={() => setActiveTab('new_ad')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Set up your first Ad
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignList.map((campaign) => (
                    <div
                      key={campaign.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleCampaign(campaign.id)}
                            className="text-2xl mt-0.5 cursor-pointer"
                            title={campaign.enabled ? 'Click to Disable' : 'Click to Enable'}
                          >
                            {campaign.enabled ? (
                              <ToggleRight className="w-7 h-7 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-slate-500" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white">{campaign.name}</h4>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                  campaign.type === 'adsense'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : campaign.type === 'custom_banner'
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                              >
                                {campaign.type.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {campaign.size}
                              </span>
                            </div>

                            {/* Placement Selector & Free-Float Controls */}
                            <div className="flex items-center gap-2 flex-wrap mt-1.5">
                              <span className="text-[11px] text-slate-400 font-medium">Placement:</span>
                              <select
                                value={campaign.placement}
                                onChange={(e) => handleChangeCampaignPlacement(campaign.id, e.target.value as AdPlacement)}
                                className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 text-[11px] font-bold outline-none cursor-pointer focus:border-cyan-500"
                              >
                                <option value="draggable_float">📍 Draggable Anywhere on Screen</option>
                                <option value="top_banner">⬆️ Top Header Banner</option>
                                <option value="sidebar">⬅️ Sidebar Slot</option>
                                <option value="bottom_bar">⬇️ Floating Bottom Bar</option>
                                <option value="popup_interstitial">🪟 Popup Interstitial</option>
                              </select>

                              {campaign.placement === 'draggable_float' && (
                                <button
                                  type="button"
                                  onClick={() => handleResetCampaignPosition(campaign.id)}
                                  className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                  title="Reset coordinates so it appears in upper area of page"
                                >
                                  <Move className="w-3 h-3" />
                                  <span>Reset Position</span>
                                </button>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 mt-1 space-y-1">
                              <p className="flex items-center gap-3">
                                <span>
                                  ⏱️ Timing:{' '}
                                  {campaign.timingMode === 'always'
                                    ? 'Always Visible'
                                    : campaign.timingMode === 'delay_seconds'
                                    ? `Show after ${campaign.displayIntervalSeconds}s`
                                    : `Every ${campaign.displayIntervalSeconds}s for ${campaign.durationSeconds}s`}
                                </span>
                                {campaign.durationSeconds > 0 && campaign.timingMode !== 'interval' && (
                                  <span>(Auto-dismiss: {campaign.durationSeconds}s)</span>
                                )}
                              </p>

                              {/* Calendar Validity & Expiration Badge */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <span className="flex items-center gap-1 text-slate-400 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Validity:</span>
                                </span>

                                {(() => {
                                  if (!campaign.endDate) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-[11px] flex items-center gap-1">
                                        <span>♾️ Permanent / Unlimited</span>
                                      </span>
                                    );
                                  }
                                  const now = Date.now();
                                  const diffMs = campaign.endDate - now;
                                  const isExpired = diffMs <= 0;
                                  const endDateFormatted = new Date(campaign.endDate).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  });
                                  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                                  return (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 border ${
                                        isExpired
                                          ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                                          : daysLeft <= 7
                                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                      }`}
                                    >
                                      {isExpired ? (
                                        <>
                                          <span>🚨 Expired on {endDateFormatted}</span>
                                        </>
                                      ) : (
                                        <>
                                          <CalendarCheck className="w-3 h-3" />
                                          <span>Active · {daysLeft} day{daysLeft === 1 ? '' : 's'} left (until {endDateFormatted})</span>
                                        </>
                                      )}
                                    </span>
                                  );
                                })()}

                                {/* Quick Renew & Extend Actions */}
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  <span className="text-[10px] text-slate-400 mr-0.5">Extend:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleExtendCampaign(campaign.id, 1)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Extend validity by 1 Month"
                                  >
                                    +1 Mo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExtendCampaign(campaign.id, 2)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Extend validity by 2 Months"
                                  >
                                    +2 Mo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExtendCampaign(campaign.id, 3)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Extend validity by 3 Months"
                                  >
                                    +3 Mo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExtendCampaign(campaign.id, 6)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Extend validity by 6 Months"
                                  >
                                    +6 Mo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExtendCampaign(campaign.id, 12)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Extend validity by 1 Year"
                                  >
                                    +1 Yr
                                  </button>
                                  {campaign.endDate && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPermanent(campaign.id)}
                                      className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-bold transition cursor-pointer"
                                      title="Make this ad permanent (no expiration date)"
                                    >
                                      Permanent
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="p-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Code preview */}
                      {campaign.embedCode && (
                        <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-slate-800 font-mono text-[11px] text-slate-400 max-h-20 overflow-hidden text-ellipsis whitespace-nowrap">
                          {campaign.embedCode}
                        </div>
                      )}

                      {campaign.bannerImageUrl && (
                        <div className="mt-3 flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-slate-800">
                          <img
                            src={campaign.bannerImageUrl}
                            alt="Preview"
                            className="w-16 h-10 object-cover rounded-lg border border-slate-700"
                          />
                          <div className="text-xs text-slate-400 truncate">
                            <p className="font-semibold text-slate-300">Target URL:</p>
                            <p className="truncate text-cyan-400">{campaign.bannerTargetUrl || 'No target link'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: CREATE NEW AD OR SUBMIT GOOGLE ADSENSE CODE
              ========================================================================= */}
          {activeTab === 'new_ad' && (
            <form onSubmit={handleCreateNewAd} className="space-y-6">
              {/* Quick Template Buttons */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-black text-amber-300">Quick Start Fillers</h4>
                    <p className="text-[11px] text-amber-200/70">
                      Instantly pre-fill a standard Google AdSense block or an interactive promotional banner.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAdSenseTemplate}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    Use AdSense Template
                  </button>
                  <button
                    type="button"
                    onClick={loadCustomBannerTemplate}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Use Custom Image Template
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ad Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Ad Campaign Name *</label>
                  <input
                    type="text"
                    required
                    value={newAdName}
                    onChange={(e) => setNewAdName(e.target.value)}
                    placeholder="e.g. Header Leaderboard, AdSense Responsive"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* Ad Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Ad Format / Engine *</label>
                  <select
                    value={newAdType}
                    onChange={(e) => setNewAdType(e.target.value as AdType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none"
                  >
                    <option value="adsense">Google AdSense Script</option>
                    <option value="embed_html">Custom HTML / Iframe / Script Embed</option>
                    <option value="custom_banner">Custom Image Banner + Click Link</option>
                  </select>
                </div>

                {/* Placement Position */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Site Placement *</label>
                  <select
                    value={newAdPlacement}
                    onChange={(e) => setNewAdPlacement(e.target.value as AdPlacement)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none"
                  >
                    <option value="draggable_float">📍 Draggable Free-Float (Move anywhere on website page)</option>
                    <option value="top_banner">Top Banner (Above Map / Navigation)</option>
                    <option value="bottom_bar">Bottom Floating Bar (Sticky Footer)</option>
                    <option value="sidebar">Sidebar / Members Column</option>
                    <option value="popup_interstitial">Popup Interstitial (Timed Modal Alert)</option>
                  </select>
                </div>

                {/* Standard Dimensions / Sizes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Dimensions / Sizing *</label>
                  <select
                    value={newAdSize}
                    onChange={(e) => setNewAdSize(e.target.value as AdSize)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-500 outline-none"
                  >
                    <option value="responsive">Responsive (Fluid Auto Width)</option>
                    <option value="728x90">728 × 90 (Leaderboard)</option>
                    <option value="300x250">300 × 250 (Medium Rectangle)</option>
                    <option value="320x50">320 × 50 (Mobile Leaderboard)</option>
                    <option value="468x60">468 × 60 (Standard Banner)</option>
                    <option value="160x600">160 × 600 (Skyscraper)</option>
                  </select>
                </div>
              </div>

              {/* TIMING & FREQUENCY CONTROLS */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold">Timing & Display Interval Controls</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Display Frequency</label>
                    <select
                      value={newAdTimingMode}
                      onChange={(e) => setNewAdTimingMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                    >
                      <option value="always">Continuous (Always visible)</option>
                      <option value="delay_seconds">Delay entry (show after X seconds)</option>
                      <option value="interval">Repeat interval (show periodically)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      {newAdTimingMode === 'delay_seconds'
                        ? 'Delay Before Showing (Sec)'
                        : 'Repeat Interval (Sec)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3600"
                      value={newAdInterval}
                      onChange={(e) => setNewAdInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      Auto-Dismiss Duration (Sec, 0 = indefinite)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="600"
                      value={newAdDuration}
                      onChange={(e) => setNewAdDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CAMPAIGN DURATION & EXPIRATION PERIOD (1, 2, 3, 4, 6 MONTHS, 1 YEAR, OR CUSTOM) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">Campaign Duration & Expiration Period</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    For Personal & Sponsor Ads
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select how long this personal ad or sponsor banner runs. Once expired, it stops showing automatically without breaking the layout.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300 font-bold">Active Validity Period *</label>
                    <select
                      value={newAdPeriod}
                      onChange={(e) => setNewAdPeriod(e.target.value as AdDurationPeriod)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-amber-500"
                    >
                      <option value="unlimited">♾️ Permanent / Indefinite (No Expiration Date)</option>
                      <option value="1_month">🗓️ 1 Month (Active for 30 Days)</option>
                      <option value="2_months">🗓️ 2 Months (Active for 60 Days)</option>
                      <option value="3_months">🗓️ 3 Months (Active for 90 Days)</option>
                      <option value="4_months">🗓️ 4 Months (Active for 120 Days)</option>
                      <option value="6_months">🗓️ 6 Months (Active for 180 Days)</option>
                      <option value="1_year">🗓️ 1 Year (Active for 365 Days)</option>
                      <option value="custom">📅 Custom Date Range (Pick End Date)</option>
                    </select>
                  </div>

                  {newAdPeriod === 'custom' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-bold">Custom Expiration End Date *</label>
                      <input
                        type="date"
                        required
                        value={newAdCustomEndDate}
                        onChange={(e) => setNewAdCustomEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                        {newAdPeriod === 'unlimited' ? (
                          <span className="text-emerald-400 font-medium">
                            ✓ This campaign will remain active continuously with no auto-expiration.
                          </span>
                        ) : (
                          <span>
                            🗓️ Will run starting today and deactivate on:{' '}
                            <strong className="text-amber-400">
                              {new Date(computeEndDate(Date.now(), newAdPeriod, newAdCustomEndDate) || Date.now()).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* EMBED CODE OR IMAGE INPUT */}
              {newAdType === 'custom_banner' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Banner Image URL *</label>
                    <input
                      type="url"
                      required
                      value={newAdImageUrl}
                      onChange={(e) => setNewAdImageUrl(e.target.value)}
                      placeholder="https://example.com/banner-728x90.jpg"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Click Target URL</label>
                    <input
                      type="url"
                      value={newAdTargetUrl}
                      onChange={(e) => setNewAdTargetUrl(e.target.value)}
                      placeholder="https://partner-website.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      Paste Embed Code (Google AdSense, Iframe, or HTML) *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Without code submitted, the page renders 100% clean as normal
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    required
                    value={newAdEmbedCode}
                    onChange={(e) => setNewAdEmbedCode(e.target.value)}
                    placeholder="<script async src='https://pagead2.googlesyndication.com/...'></script>..."
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-xs focus:border-amber-500 outline-none resize-y"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('ads')}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-90 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>Submit & Activate Ad Placement</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
