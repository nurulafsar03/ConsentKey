/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Radio,
  Share2,
  Smartphone,
  Cloud,
  CheckCircle,
  Users,
  MapPin,
  RefreshCw,
  Phone,
  MessageSquare,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Navigation,
  Plus,
  Building,
  Heart,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { Header } from './components/Header';
import { ConsentKeyLogo } from './components/ConsentKeyLogo';
import { TopHeroSection } from './components/TopHeroSection';
import { BottomShowcaseSection } from './components/BottomShowcaseSection';
import { useTheme } from './context/ThemeContext';
import { ConsentMap } from './components/ConsentMap';
import { AdminMembersList } from './components/AdminMembersList';
import { MemberMobileControls } from './components/MemberMobileControls';
import { ChatCommsPanel } from './components/ChatCommsPanel';
import { RetentionStatusBanner } from './components/RetentionStatusBanner';
import { GroupJoinModal } from './components/GroupJoinModal';
import { DirectShareModal } from './components/DirectShareModal';
import { P2PTransferModal } from './components/P2PTransferModal';
import { InfoModal, InfoModalTab } from './components/InfoModal';
import { GoogleMapsIntelligenceModal } from './components/GoogleMapsIntelligenceModal';
import { VoiceCallModal } from './components/VoiceCallModal';
import { LockScreenAlertModal } from './components/LockScreenAlertModal';
import { MagicLinkModal } from './components/MagicLinkModal';
import { CloudflareModal } from './components/CloudflareModal';
import { SafeZonesModal } from './components/SafeZonesModal';
import { SosAlertModal } from './components/SosAlertModal';
import { DirectChatModal } from './components/DirectChatModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { AddMemberModal } from './components/AddMemberModal';
import { MemberTrackingPage } from './components/MemberTrackingPage';
import { GroupSelectorBar } from './components/GroupSelectorBar';
import { GroupFolderDropdown } from './components/GroupFolderDropdown';
import { MemberPortalView } from './components/MemberPortalView';
import { AdSlot } from './components/AdSlot';
import { AdminPanelModal } from './components/AdminPanelModal';
import { StorageService } from './services/storage';
import { audioService } from './services/audio';
import { calculateDistanceKm, estimateTravelTimeMinutes, isInsideGeofence } from './utils/geo';
import { TRANSLATIONS, detectBrowserLanguage, SUPPORTED_LANGUAGES, Language } from './i18n/translations';
import {
  Group,
  Member,
  UserRole,
  VoiceCallState,
  DirectShareLink,
  SafeZone,
  NavigationRoute,
  EmergencyAlert,
  LocationBreadcrumb,
  AdCampaign,
} from './types';

export default function App() {
  const { isDark, theme } = useTheme();
  // Language & RTL State
  const [language, setLanguage] = useState<Language>(() => detectBrowserLanguage());
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Sync document language and text direction for RTL languages (Urdu, Arabic, Persian)
  useEffect(() => {
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    const dir = langObj?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  // User Auth & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [userEmail, setUserEmail] = useState<string | null>('admin@family.org');
  const [userName, setUserName] = useState<string | null>('Sarah Jenkins (Admin)');

  // Groups / Circles State (Isolated environments so family, business, friends don't mix)
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'grp_family_01',
      name: 'SafeFamily Circle',
      category: 'family',
      adminId: 'usr_sarah',
      adminName: 'Sarah Jenkins',
      adminEmail: 'admin@family.org',
      inviteCode: 'SAFE-8492',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'grp_business_01',
      name: 'Apex London Office & Field',
      category: 'business',
      adminId: 'usr_sarah',
      adminName: 'Sarah Jenkins',
      adminEmail: 'admin@family.org',
      inviteCode: 'CORP-5520',
      createdAt: Date.now() - 43200000,
    },
    {
      id: 'grp_delivery_01',
      name: 'Speedy Delivery Fleet',
      category: 'delivery',
      adminId: 'usr_marcus',
      adminName: 'Marcus Dispatcher',
      adminEmail: 'dispatch@speedydelivery.com',
      inviteCode: 'FLEET-7731',
      createdAt: Date.now() - 21600000,
    },
    {
      id: 'grp_friends_01',
      name: 'Weekend Trip & Friends',
      category: 'friends',
      adminId: 'usr_sarah',
      adminName: 'Sarah Jenkins',
      adminEmail: 'admin@family.org',
      inviteCode: 'TRIP-3391',
      createdAt: Date.now() - 10800000,
    },
  ]);

  // Active Group State
  const [currentGroup, setCurrentGroup] = useState<Group>({
    id: 'grp_family_01',
    name: 'SafeFamily Circle',
    category: 'family',
    adminId: 'usr_sarah',
    adminName: 'Sarah Jenkins',
    adminEmail: 'admin@family.org',
    inviteCode: 'SAFE-8492',
    createdAt: Date.now() - 3600000,
  });

  // Group Members (Organized into separate groups with realistic coordinates)
  const [members, setMembers] = useState<Member[]>([
    // Family Group Members
    {
      id: 'mem_sarah',
      name: 'Sarah Jenkins',
      email: 'admin@family.org',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      groupId: 'grp_family_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 7200000,
      lat: 51.5074,
      lng: -0.1278,
      speed: 0,
      battery: 94,
      accuracy: 12,
      isOnline: true,
    },
    {
      id: 'mem_leo',
      name: 'Leo (Child / School)',
      email: 'leo@family.org',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_family_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 3600000,
      lat: 51.5135,
      lng: -0.1365,
      speed: 4,
      battery: 78,
      accuracy: 14,
      isOnline: true,
    },
    {
      id: 'mem_emma',
      name: 'Emma (Elderly Parent)',
      email: 'emma@family.org',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_family_01',
      isConsentGiven: true,
      isSharingLocation: false, // Paused by member herself
      lastConsentTimestamp: Date.now() - 5400000,
      lat: 51.5201,
      lng: -0.1198,
      speed: 0,
      battery: 88,
      accuracy: 25,
      isOnline: true,
    },
    // Business Group Members
    {
      id: 'mem_elena_biz',
      name: 'Elena Rostova (Account Exec)',
      email: 'elena@apex.co.uk',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      groupId: 'grp_business_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 4100000,
      lat: 51.5155,
      lng: -0.0922,
      speed: 0,
      battery: 82,
      accuracy: 10,
      isOnline: true,
    },
    {
      id: 'mem_james_biz',
      name: 'James Wright (Field Tech)',
      email: 'j.wright@apex.co.uk',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_business_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 2900000,
      lat: 51.5220,
      lng: -0.0880,
      speed: 18,
      battery: 67,
      accuracy: 15,
      isOnline: true,
    },
    // Delivery Fleet Members
    {
      id: 'mem_david',
      name: 'David (Member)',
      email: 'david@delivery.org',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_delivery_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 1800000,
      lat: 51.5014,
      lng: -0.1419,
      speed: 28,
      battery: 63,
      accuracy: 18,
      isOnline: true,
    },
    {
      id: 'mem_marcus_driver',
      name: 'Marcus K. (Express Van #4)',
      email: 'marcus@delivery.org',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_delivery_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 950000,
      lat: 51.4925,
      lng: -0.1220,
      speed: 34,
      battery: 58,
      accuracy: 12,
      isOnline: true,
    },
    // Friends Group Members
    {
      id: 'mem_maya_friend',
      name: 'Maya Lin',
      email: 'maya@friends.org',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_friends_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 1200000,
      lat: 51.5170,
      lng: -0.1550,
      speed: 3,
      battery: 91,
      accuracy: 11,
      isOnline: true,
    },
    {
      id: 'mem_sam_friend',
      name: 'Sam Brooks',
      email: 'sam@friends.org',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      groupId: 'grp_friends_01',
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now() - 2500000,
      lat: 51.5280,
      lng: -0.1400,
      speed: 0,
      battery: 74,
      accuracy: 16,
      isOnline: true,
    },
  ]);

  // Separate Member Tracking Page View State
  const [selectedMemberForTracking, setSelectedMemberForTracking] = useState<Member | null>(null);

  // Circle / Room Creation and Direct Member Addition Modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Current active member ID (for member mobile perspective)
  const currentMemberId = currentRole === 'admin' ? 'mem_sarah' : 'mem_leo';

  // Strictly filter members for the active group (No mixing between family, business, friends, etc.)
  const currentGroupMembers = members.filter((m) => m.groupId === currentGroup.id);

  // Active member for mobile perspective scoped to group
  const currentMember =
    members.find((m) => m.id === currentMemberId && m.groupId === currentGroup.id) ||
    currentGroupMembers[0] ||
    members[0];

  // Calculate member count per group for badge counters
  const memberCountsByGroupId = groups.reduce((acc, g) => {
    acc[g.id] = members.filter((m) => m.groupId === g.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Direct Shares
  const [directShares, setDirectShares] = useState<DirectShareLink[]>([]);

  // Safe Zones & Geofencing State
  const [safeZones, setSafeZones] = useState<SafeZone[]>(() => StorageService.getSafeZones());
  const [isSafeZonesModalOpen, setIsSafeZonesModalOpen] = useState(false);

  // Active Navigation Route & Emergency SOS State
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
  const [activeSos, setActiveSos] = useState<EmergencyAlert | null>(null);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);

  // Breadcrumbs for live trails
  const [breadcrumbs, setBreadcrumbs] = useState<LocationBreadcrumb[]>([]);

  // Geofence Arrival / Departure Toast
  const [geofenceToast, setGeofenceToast] = useState<{ message: string; type: 'entry' | 'exit' } | null>(null);

  // Modals
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinModalInitialMode, setJoinModalInitialMode] = useState<'invite' | 'join'>('invite');
  const [isDirectShareOpen, setIsDirectShareOpen] = useState(false);
  const [isP2PTransferOpen, setIsP2PTransferOpen] = useState(false);
  const [p2pInitialMode, setP2pInitialMode] = useState<'send' | 'receive'>('send');
  const [p2pInitialCode, setP2pInitialCode] = useState<string>('');
  const [isLockScreenTestOpen, setIsLockScreenTestOpen] = useState(false);
  const [isMagicLinkModalOpen, setIsMagicLinkModalOpen] = useState(false);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<InfoModalTab>('about');
  const [chatRecipient, setChatRecipient] = useState<Member | null>(null);

  // Real-Time Google Maps Intelligence (Grounding via Gemini 3.5 Flash)
  const [isMapsIntelOpen, setIsMapsIntelOpen] = useState(false);
  const [mapsIntelTarget, setMapsIntelTarget] = useState<{
    lat: number;
    lng: number;
    name?: string;
  }>({
    lat: 37.7749,
    lng: -122.4194,
    name: 'Current Live GPS Location',
  });

  const handleOpenMapsIntel = (target?: { lat: number; lng: number; name?: string }) => {
    if (target) {
      setMapsIntelTarget(target);
    } else {
      const fallback = currentGroupMembers.find((m) => m.lat && m.lng);
      if (fallback && fallback.lat && fallback.lng) {
        setMapsIntelTarget({ lat: fallback.lat, lng: fallback.lng, name: fallback.name });
      }
    }
    setIsMapsIntelOpen(true);
  };

  const handleOpenInfoModal = (tab: InfoModalTab = 'about') => {
    setInfoModalTab(tab);
    setIsInfoModalOpen(true);
  };

  // Master Admin & AdSense Campaigns State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(() => StorageService.getAdCampaigns());

  const handleSaveAdCampaigns = (updated: AdCampaign[]) => {
    setAdCampaigns(updated);
    StorageService.saveAdCampaigns(updated);
  };

  const handleUpdateAdPosition = (id: string, pos: { x: number; y: number }) => {
    setAdCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, floatPosition: pos } : c))
    );
  };

  // Voice Call State
  const [callState, setCallState] = useState<VoiceCallState>({
    isOpen: false,
    isIncoming: false,
    callerName: 'Sarah Jenkins (Admin)',
    callerRole: 'Group Admin / Dispatcher',
    callerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    connected: false,
    muted: false,
    speaker: false,
    callSeconds: 0,
  });

  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // Periodically purge expired 24h data & check deep links
  useEffect(() => {
    StorageService.purgeExpired();
    setDirectShares(StorageService.getDirectShares());

    // Check if URL has ?join= or ?magic_token= or ?admin or /admin path or #admin
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('admin') !== null ||
      window.location.pathname === '/admin' ||
      window.location.hash === '#admin'
    ) {
      setIsAdminPanelOpen(true);
    }
    if (params.get('join')) {
      setJoinModalInitialMode('join');
      setIsJoinModalOpen(true);
    }
    if (params.get('magic_token')) {
      setUserEmail('admin@family.org');
      setUserName('Sarah Jenkins (Admin)');
      setCurrentRole('admin');
    }
    const p2pCode = params.get('p2p') || params.get('transfer');
    if (p2pCode) {
      setP2pInitialMode('receive');
      setP2pInitialCode(p2pCode);
      setIsP2PTransferOpen(true);
    }
    const pageParam = params.get('page') || params.get('tab');
    if (pageParam === 'about' || pageParam === 'privacy' || pageParam === 'contact' || pageParam === 'faq') {
      setInfoModalTab(pageParam as InfoModalTab);
      setIsInfoModalOpen(true);
    } else if (params.get('about') !== null) {
      setInfoModalTab('about');
      setIsInfoModalOpen(true);
    } else if (params.get('privacy') !== null) {
      setInfoModalTab('privacy');
      setIsInfoModalOpen(true);
    } else if (params.get('contact') !== null) {
      setInfoModalTab('contact');
      setIsInfoModalOpen(true);
    } else if (params.get('faq') !== null) {
      setInfoModalTab('faq');
      setIsInfoModalOpen(true);
    }
  }, []);

  // Handle Member Toggling Location Sharing
  const handleToggleSharing = (isSharing: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === currentMemberId ? { ...m, isSharingLocation: isSharing } : m))
    );
  };

  // Handle Member Leaving Group
  const handleLeaveGroup = () => {
    setMembers((prev) => prev.filter((m) => m.id !== currentMemberId));
    StorageService.clearEverything();
    audioService.playConsentChime();
  };

  // Handle Member GPS coordinate updates & Geofence detection
  const handleUpdateCoords = (lat: number, lng: number) => {
    // Check if entered or departed any configured Safe Zone
    safeZones.forEach((zone) => {
      const previouslyInside =
        currentMember.lat &&
        currentMember.lng &&
        isInsideGeofence(currentMember.lat, currentMember.lng, zone.lat, zone.lng, zone.radiusMeters);
      const currentlyInside = isInsideGeofence(lat, lng, zone.lat, zone.lng, zone.radiusMeters);

      if (!previouslyInside && currentlyInside) {
        audioService.playGeofenceChime('entry');
        setGeofenceToast({
          message: `🟢 ${currentMember.name.split(' ')[0]} entered ${zone.name}`,
          type: 'entry',
        });
        setTimeout(() => setGeofenceToast(null), 4500);
      } else if (previouslyInside && !currentlyInside) {
        audioService.playGeofenceChime('exit');
        setGeofenceToast({
          message: `🚗 ${currentMember.name.split(' ')[0]} departed ${zone.name}`,
          type: 'exit',
        });
        setTimeout(() => setGeofenceToast(null), 4500);
      }
    });

    setMembers((prev) =>
      prev.map((m) => (m.id === currentMemberId ? { ...m, lat, lng, lastLocationUpdate: Date.now() } : m))
    );

    // Record breadcrumb
    const newCrumb = {
      id: 'crumb_' + Date.now(),
      memberId: currentMemberId,
      lat,
      lng,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    StorageService.saveBreadcrumb(newCrumb);
    setBreadcrumbs((prev) => [...prev, newCrumb]);
  };

  // Safe Zone Handlers
  const handleSaveSafeZone = (zone: SafeZone) => {
    StorageService.saveSafeZone(zone);
    setSafeZones(StorageService.getSafeZones());
  };

  const handleDeleteSafeZone = (zoneId: string) => {
    StorageService.deleteSafeZone(zoneId);
    setSafeZones(StorageService.getSafeZones());
    audioService.playConsentChime();
  };

  // Navigation Route Calculation
  const handleGetRoute = (targetMember: Member) => {
    if (!targetMember.lat || !targetMember.lng) return;
    const fromLat = currentMember.lat || 51.5074;
    const fromLng = currentMember.lng || -0.1278;
    const distanceKm = calculateDistanceKm(fromLat, fromLng, targetMember.lat, targetMember.lng);
    const estimatedMinutes = estimateTravelTimeMinutes(distanceKm, targetMember.speed || 30);

    setActiveRoute({
      targetMemberId: targetMember.id,
      targetMemberName: targetMember.name,
      distanceKm,
      estimatedMinutes,
      from: [fromLat, fromLng],
      to: [targetMember.lat, targetMember.lng],
      points: [
        [fromLat, fromLng],
        [(fromLat + targetMember.lat) / 2 + 0.001, (fromLng + targetMember.lng) / 2 - 0.001],
        [targetMember.lat, targetMember.lng],
      ],
    });
    setFocusedMemberId(targetMember.id);
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Focus Member on Map
  const handleFocusMember = (member: Member) => {
    setFocusedMemberId(member.id);
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // SOS Emergency Beacon Handlers
  const handleTriggerSos = (alert: EmergencyAlert) => {
    setActiveSos(alert);
    setIsSosModalOpen(false);
    audioService.playSosAlert();
    // Pin active distress location
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResolveSos = () => {
    setActiveSos(null);
    setIsSosModalOpen(false);
    audioService.playConsentChime();
  };

  // Start Outgoing Voice / Video Call
  const handleInitiateCall = (targetMember?: Member, isVideo: boolean = false) => {
    const target = targetMember || (currentRole === 'admin' ? members[1] : members[0]);
    setCallState({
      isOpen: true,
      isIncoming: false,
      callerName: target.name,
      callerRole: target.role === 'admin' ? 'Group Admin' : 'Group Member',
      callerAvatar: target.avatar,
      connected: false,
      muted: false,
      speaker: false,
      callSeconds: 0,
      isVideo,
    });
    // Auto-connect after 2 rings
    setTimeout(() => {
      setCallState((prev) => (prev.isOpen ? { ...prev, connected: true } : prev));
    }, 2800);
  };

  // Simulate Incoming Call (e.g. from lock-screen or admin)
  const handleSimulateIncomingCall = (isVideo: boolean = false) => {
    setCallState({
      isOpen: true,
      isIncoming: true,
      callerName: 'Sarah Jenkins (Group Admin)',
      callerRole: 'Admin & Dispatcher',
      callerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      connected: false,
      muted: false,
      speaker: false,
      callSeconds: 0,
      isVideo,
    });
  };

  // Add New Circle / Room (Admin action)
  const handleCreateGroup = (newGroup: Group) => {
    setGroups((prev) => [...prev, newGroup]);
    setCurrentGroup(newGroup);
    // Add current user as admin of new group
    const newAdminMember: Member = {
      id: `mem_admin_${Date.now()}`,
      name: newGroup.adminName,
      email: newGroup.adminEmail,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      groupId: newGroup.id,
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now(),
      lat: 51.5074,
      lng: -0.1278,
      speed: 0,
      battery: 95,
      accuracy: 12,
      isOnline: true,
    };
    setMembers((prev) => [...prev, newAdminMember]);
  };

  // Add Member Directly / Randomly to Circle (Admin action)
  const handleAddMemberDirectly = (newMember: Member) => {
    setMembers((prev) => [...prev, newMember]);
  };

  // Select Group / Room
  const handleSelectGroup = (group: Group) => {
    setCurrentGroup(group);
    // Clear active route if any
    setActiveRoute(null);
    setFocusedMemberId(null);
    // If tracking a member from a different group, reset
    if (selectedMemberForTracking && selectedMemberForTracking.groupId !== group.id) {
      setSelectedMemberForTracking(null);
    }
  };

  // Switch Group Presets (Family vs Delivery vs Team)
  const handleSelectGroupPreset = (category: 'family' | 'delivery' | 'team') => {
    const existing = groups.find((g) => g.category === category);
    if (existing) {
      handleSelectGroup(existing);
    } else {
      const fallbackGroup: Group = {
        id: `grp_${category}_01`,
        name: category === 'family' ? 'SafeFamily Circle' : category === 'delivery' ? 'Express Delivery Fleet' : 'Apex Field Technicians',
        category,
        adminId: 'usr_sarah',
        adminName: 'Sarah Jenkins',
        adminEmail: 'admin@family.org',
        inviteCode: `${category.substring(0, 4).toUpperCase()}-1001`,
        createdAt: Date.now(),
      };
      setGroups((prev) => [...prev, fallbackGroup]);
      handleSelectGroup(fallbackGroup);
    }
  };

  const handleLogout = () => {
    setUserEmail(null);
    setUserName(null);
    setCurrentRole('member');
  };

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-emerald-500/20 ${
      isDark ? 'bg-slate-950 text-slate-100 selection:text-emerald-300' : 'bg-slate-50 text-slate-800 selection:text-emerald-900'
    }`}>
      {/* Top Application Header */}
      <Header
        currentLanguage={language}
        onSelectLanguage={setLanguage}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        userEmail={userEmail}
        userName={userName}
        onOpenMagicLink={() => setIsMagicLinkModalOpen(true)}
        onLogout={handleLogout}
        onOpenDirectShare={() => setIsDirectShareOpen(true)}
        onOpenP2PTransfer={(mode) => {
          setP2pInitialMode(mode || 'send');
          setIsP2PTransferOpen(true);
        }}
        onOpenLockScreenTest={() => setIsLockScreenTestOpen(true)}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onOpenJoinModal={() => {
          setJoinModalInitialMode(currentRole === 'admin' ? 'invite' : 'join');
          setIsJoinModalOpen(true);
        }}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenInfoModal={handleOpenInfoModal}
        t={t}
      />

      {/* Top Banner AdSlot (Shows if an enabled top_banner campaign with embed code exists) */}
      <AdSlot placement="top_banner" campaigns={adCampaigns} isDark={isDark} />

      {/* =========================================================================
          IF TRACKING A SPECIFIC MEMBER: SEPARATE DEDICATED TRACKING PAGE
          "when you are tracking someone, when you click on the name of that member,
           a separate page will open and there the live location and route of that
           specific member will be shown."
          ========================================================================= */}
      {selectedMemberForTracking ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
          <MemberTrackingPage
            member={selectedMemberForTracking}
            group={currentGroup}
            safeZones={safeZones}
            breadcrumbs={breadcrumbs}
            activeRoute={activeRoute}
            activeSos={activeSos}
            t={t}
            onBack={() => {
              setSelectedMemberForTracking(null);
              setActiveRoute(null);
            }}
            onCallMember={(m, isVideo) => handleInitiateCall(m, isVideo)}
            onChatMember={(m) => setChatRecipient(m)}
            onGetRoute={(m) => handleGetRoute(m)}
            onClearRoute={() => setActiveRoute(null)}
            onManageSafeZones={() => setIsSafeZonesModalOpen(true)}
            onTriggerSos={() => setIsSosModalOpen(true)}
            onOpenMapsIntelligence={handleOpenMapsIntel}
          />
        </main>
      ) : (
        <>
          {/* =========================================================================
              TOP OF THE PAGE: Hero Title, Subtitle, Direct Action Triggers & Stats
              ========================================================================= */}
          <TopHeroSection
            t={t}
            onScrollToLiveMap={scrollToWorkspace}
            onOpenJoinModal={() => {
              setJoinModalInitialMode('join');
              setIsJoinModalOpen(true);
            }}
            onOpenDirectShare={() => setIsDirectShareOpen(true)}
            onOpenP2PTransfer={(mode) => {
              setP2pInitialMode(mode || 'send');
              setIsP2PTransferOpen(true);
            }}
          />

          {/* =========================================================================
              MIDDLE OF THE PAGE — GROUP / ROOM SELECTION & MEMBERS ROSTER
              (Map is not shown on the home page; clicking a member navigates to their
               isolated separate tracking page)
              ========================================================================= */}
          <main
            id="middle-live-map"
            ref={workspaceRef}
            className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 sm:pb-14"
          >
            {/* Middle Section Operational Status Header */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition ${
                isDark
                  ? 'bg-slate-900 border border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">
                  LIVE
                </span>
                <span className="text-slate-400 dark:text-slate-600">|</span>
                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>Isolated Room & Dispatch Hub</span>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
                <span className={`inline-flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Strict Room Privacy Enforced</span>
                </span>
              </div>
            </div>

            {/* Mode-Specific Workspace Render: Admin View vs Member View */}
            {currentRole === 'admin' ? (
              <>
                {/* Admin Mode Controls: Dropdown Folder & Create Room */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <GroupFolderDropdown
                    groups={groups}
                    currentGroup={currentGroup}
                    onSelectGroup={handleSelectGroup}
                    onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
                    memberCountsByGroupId={memberCountsByGroupId}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-switch-to-member"
                      onClick={() => setCurrentRole('member')}
                      className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                        isDark
                          ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t.switchToMember}</span>
                    </button>
                  </div>
                </div>

                {/* Admin Grid: Live Map on the Left, Members on the Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Live Map of the Current Group/Room */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    <div className={`p-4 rounded-3xl border shadow-sm ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Live Room Map: {currentGroup.name}
                          </h3>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {currentGroupMembers.filter(m => m.isSharingLocation).length} active
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">
                          Click any member to see route & full tracking
                        </span>
                      </div>

                      <ConsentMap
                        members={currentGroupMembers}
                        directShares={directShares}
                        currentUserId={currentMemberId}
                        isAdminView={true}
                        t={t}
                        safeZones={safeZones}
                        breadcrumbs={breadcrumbs}
                        activeRoute={activeRoute}
                        activeSos={activeSos}
                        focusedMemberId={focusedMemberId}
                        onCallMember={(m, isVideo) => handleInitiateCall(m, isVideo)}
                        onChatMember={(m) => setChatRecipient(m)}
                        onSelectMember={(m) => {
                          setSelectedMemberForTracking(m);
                          handleGetRoute(m);
                        }}
                        onClearRoute={() => setActiveRoute(null)}
                        onTriggerSos={() => setIsSosModalOpen(true)}
                        onManageSafeZones={() => setIsSafeZonesModalOpen(true)}
                        onOpenMapsIntelligence={handleOpenMapsIntel}
                      />
                    </div>

                    {/* Room Chat & Comms */}
                    <ChatCommsPanel
                      groupId={currentGroup.id}
                      currentUserId={currentMemberId}
                      currentUserName="Sarah Jenkins (Admin)"
                      currentUserRole="admin"
                      members={currentGroupMembers}
                      onSelectMemberForDirectChat={(m) => setChatRecipient(m)}
                      t={t}
                      onInitiateCall={() => handleInitiateCall()}
                    />
                  </div>

                  {/* Right Column: Room Members List with Online/Offline tags */}
                  <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <AdminMembersList
                      members={currentGroupMembers}
                      safeZones={safeZones}
                      onCallMember={(m, isVideo) => handleInitiateCall(m, isVideo)}
                      onChatMember={(m) => setChatRecipient(m)}
                      onOpenInvite={() => {
                        setJoinModalInitialMode('invite');
                        setIsJoinModalOpen(true);
                      }}
                      onOpenAddDirectly={() => setIsAddMemberModalOpen(true)}
                      onSelectMember={(m) => {
                        setSelectedMemberForTracking(m);
                        handleGetRoute(m);
                        if (workspaceRef.current) {
                          workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      onFocusMember={(m) => setFocusedMemberId(m.id)}
                      onGetRoute={(m) => {
                        setSelectedMemberForTracking(m);
                        handleGetRoute(m);
                      }}
                      onOpenMapsIntelligence={handleOpenMapsIntel}
                      t={t}
                    />

                    {/* Sidebar Ad Placement */}
                    <AdSlot placement="sidebar" campaigns={adCampaigns} isDark={isDark} />
                  </div>
                </div>
              </>
            ) : (
              /* =========================================================================
                 MEMBER MODE PAGE:
                 "In member mode, you will only get instructions from the admin and can
                  share your live location with any person. Each mode will show a different page."
                 ========================================================================= */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Member Field Portal
                    </h2>
                  </div>

                  <button
                    id="btn-switch-to-admin"
                    onClick={() => setCurrentRole('admin')}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.switchToAdmin}</span>
                  </button>
                </div>

                <MemberPortalView
                  currentMember={currentMember}
                  currentGroup={currentGroup}
                  onToggleSharing={handleToggleSharing}
                  onUpdateCoords={handleUpdateCoords}
                  onTriggerSos={() => setIsSosModalOpen(true)}
                  onOpenDirectShare={() => setIsDirectShareOpen(true)}
                  onOpenChatWithAdmin={() => {
                    const adminMember = currentGroupMembers.find((m) => m.role === 'admin') || members[0];
                    setChatRecipient(adminMember);
                  }}
                  onCallAdmin={(isVideo) => {
                    const adminMember = currentGroupMembers.find((m) => m.role === 'admin') || members[0];
                    handleInitiateCall(adminMember, isVideo);
                  }}
                  t={t}
                />
              </div>
            )}
          </main>

          {/* =========================================================================
              OTHERS DOWN OF THE PAGE: Edge Infrastructure, Trust Pillars,
              Use Cases, Comparison Matrix, and FAQ Accordion
              ========================================================================= */}
          <BottomShowcaseSection
            t={t}
            onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
            onOpenInfoModal={handleOpenInfoModal}
          />
        </>
      )}

      {/* Footer with links to About, Privacy Policy, Contact and FAQ */}
      <footer className={`border-t py-8 px-4 text-xs transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <ConsentKeyLogo className="w-5 h-5" />
              <span>{t.footerTitle}</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 dark:text-slate-400">{t.footerSub}</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-semibold">
            <button
              id="footer-btn-about"
              onClick={() => handleOpenInfoModal('about')}
              className="hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              About
            </button>
            <button
              id="footer-btn-privacy"
              onClick={() => handleOpenInfoModal('privacy')}
              className="hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              id="footer-btn-contact"
              onClick={() => handleOpenInfoModal('contact')}
              className="hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
              title="afsar.nurul@gmail.com"
            >
              Contact
            </button>
            <button
              id="footer-btn-faq"
              onClick={() => handleOpenInfoModal('faq')}
              className="hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              F&Q
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GroupJoinModal
        group={currentGroup}
        isOpen={isJoinModalOpen}
        initialMode={joinModalInitialMode}
        onClose={() => setIsJoinModalOpen(false)}
        onAgreeToJoin={() => {
          setIsJoinModalOpen(false);
          // Mark current member as consent given
          handleToggleSharing(true);
        }}
        t={t}
      />

      <DirectShareModal
        isOpen={isDirectShareOpen}
        onClose={() => setIsDirectShareOpen(false)}
        currentUserId={currentMemberId}
        currentUserName={currentMember.name}
        currentUserEmail={currentMember.email}
        currentLat={currentMember.lat || 51.5074}
        currentLng={currentMember.lng || -0.1278}
        t={t}
        onShareCreated={(newShare) => setDirectShares((prev) => [newShare, ...prev])}
      />

      <VoiceCallModal
        callState={callState}
        onAnswer={() => setCallState((prev) => ({ ...prev, connected: true }))}
        onEndCall={() => setCallState((prev) => ({ ...prev, isOpen: false, connected: false }))}
        onToggleMute={() => setCallState((prev) => ({ ...prev, muted: !prev.muted }))}
        onToggleSpeaker={() => setCallState((prev) => ({ ...prev, speaker: !prev.speaker }))}
        t={t}
      />

      <LockScreenAlertModal
        isOpen={isLockScreenTestOpen}
        onClose={() => setIsLockScreenTestOpen(false)}
        t={t}
        onSimulateIncomingCall={handleSimulateIncomingCall}
      />

      <MagicLinkModal
        isOpen={isMagicLinkModalOpen}
        onClose={() => setIsMagicLinkModalOpen(false)}
        onLoginSuccess={(email, name, role) => {
          setUserEmail(email);
          setUserName(name);
          setCurrentRole(role);
        }}
        t={t}
      />

      <CloudflareModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        t={t}
      />

      <SafeZonesModal
        isOpen={isSafeZonesModalOpen}
        onClose={() => setIsSafeZonesModalOpen(false)}
        safeZones={safeZones}
        members={members}
        onSaveZone={handleSaveSafeZone}
        onDeleteZone={handleDeleteSafeZone}
        t={t}
      />

      <SosAlertModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        activeSos={activeSos}
        currentUser={currentMember}
        onTriggerSos={handleTriggerSos}
        onResolveSos={handleResolveSos}
        t={t}
      />

      <DirectChatModal
        isOpen={chatRecipient !== null}
        onClose={() => setChatRecipient(null)}
        recipient={chatRecipient}
        currentUser={currentMember}
        currentUserRole={currentRole}
        onStartVoiceCall={(target, isVideo) => handleInitiateCall(target, isVideo)}
        t={t}
      />

      {/* Admin Circle / Room Creation Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        adminName={userName || 'Sarah Jenkins'}
        adminEmail={userEmail || 'admin@family.org'}
      />

      {/* Admin Direct Member Addition Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMemberDirectly}
        currentGroup={currentGroup}
      />

      {/* Master Admin Panel & Ad Engine Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        members={members}
        groups={groups}
        campaigns={adCampaigns}
        onSaveCampaigns={handleSaveAdCampaigns}
        isDark={isDark}
        t={t}
      />

      {/* Direct P2P File Transfer Modal (No upload required, 6-digit code) */}
      <P2PTransferModal
        isOpen={isP2PTransferOpen}
        onClose={() => setIsP2PTransferOpen(false)}
        isDark={isDark}
        initialMode={p2pInitialMode}
        initialCode={p2pInitialCode}
      />

      {/* Comprehensive Info Modal: About, Privacy, Contact & F&Q */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        isDark={isDark}
        initialTab={infoModalTab}
      />

      {/* Real-Time Google Maps Intelligence Grounding Modal */}
      <GoogleMapsIntelligenceModal
        isOpen={isMapsIntelOpen}
        onClose={() => setIsMapsIntelOpen(false)}
        theme={theme}
        targetLocation={mapsIntelTarget}
      />

      {/* Floating Bottom Bar Ad Slot */}
      <AdSlot placement="bottom_bar" campaigns={adCampaigns} isDark={isDark} />

      {/* Timed Interstitial / Popup Ad Slot */}
      <AdSlot placement="popup_interstitial" campaigns={adCampaigns} isDark={isDark} />

      {/* Free-Floating Draggable Ad Slot (Move anywhere on the website page) */}
      <AdSlot
        placement="draggable_float"
        campaigns={adCampaigns}
        isDark={isDark}
        onUpdatePosition={handleUpdateAdPosition}
      />

      {/* Mobile Floating Quick Dock (visible on mobile viewport) */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-2 sm:px-4 py-2 flex items-center justify-around shadow-lg transition-colors ${
        isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <button
          onClick={scrollToWorkspace}
          className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-700'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-semibold">{t.dockMap}</span>
        </button>
        <button
          onClick={() => {
            setP2pInitialMode('send');
            setIsP2PTransferOpen(true);
          }}
          className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
            isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
          }`}
          title="Direct P2P File Transfer"
        >
          <Zap className="w-4 h-4 text-cyan-500 fill-current" />
          <span className="text-[10px] font-bold">P2P File</span>
        </button>
        <button
          onClick={() => setIsSosModalOpen(true)}
          className="flex flex-col items-center gap-0.5 text-rose-500 transition cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center -mt-2 shadow-md shadow-rose-900/30">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black text-rose-500">{t.dockSos}</span>
        </button>
        <button
          onClick={() => handleInitiateCall()}
          className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-cyan-700'
          }`}
        >
          <Phone className="w-4 h-4 text-cyan-500" />
          <span className="text-[10px] font-semibold">{t.dockVoice}</span>
        </button>
        <button
          onClick={() => handleOpenInfoModal('about')}
          className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
          }`}
          title="About, Privacy & FAQ"
        >
          <Info className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-semibold">About</span>
        </button>
        <button
          onClick={() => setIsDirectShareOpen(true)}
          className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          <span className="text-[10px] font-semibold">{t.dockShare}</span>
        </button>
      </div>
    </div>
  );
}
