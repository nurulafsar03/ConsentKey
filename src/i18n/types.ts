import { Language, LanguageInfo } from '../types';
export type { Language, LanguageInfo };

export interface TranslationDict {
  appName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  launchApp: string;
  viewDemo: string;
  installApp: string;
  installPWA: string;
  features: string;
  howConsentWorks: string;
  liveWorkspace: string;
  useCases: string;
  privacy24h: string;
  cloudflareReady: string;
  magicLinkLogin: string;
  loginAsAdmin: string;
  loginAsGuardian: string;
  logout: string;
  adminPortal: string;
  memberView: string;

  // Consent banners & modal
  explicitConsentRequired: string;
  consentExplanation: string;
  iAgreeToJoin: string;
  decline: string;
  onlyAdminCanSee: string;
  sharingStatusActive: string;
  sharingStatusPaused: string;
  stopSharingLocation: string;
  resumeSharingLocation: string;
  leaveGroup: string;
  leaveGroupConfirm: string;
  noQuestionsAsked: string;

  // Map & live features
  liveMap: string;
  activeMembers: string;
  sharingCount: string;
  accuracy: string;
  battery: string;
  speed: string;
  lastUpdated: string;
  voiceCall: string;
  voiceNote: string;
  textChat: string;
  callRinging: string;
  incomingCall: string;
  answerCall: string;
  endCall: string;
  mute: string;
  speaker: string;

  // 1-to-1 share
  directShareTitle: string;
  directShareDesc: string;
  createShareLink: string;
  scanQRCode: string;
  copyLink: string;
  linkCopied: string;
  revokeLink: string;

  // 24 hour storage
  storage24hTitle: string;
  storage24hBadge: string;
  storage24hDesc: string;
  purgeNow: string;
  purgedSuccess: string;

  // Mobile lock screen notification
  lockScreenTest: string;
  lockScreenAlertTitle: string;
  lockScreenAlertDesc: string;
  simulateLockScreen: string;

  // Magic link login
  enterEmail: string;
  sendMagicLink: string;
  magicLinkSent: string;
  clickToSimulateLogin: string;
  passwordlessNotice: string;

  // Use cases
  familiesTitle: string;
  familiesDesc: string;
  deliveryTitle: string;
  deliveryDesc: string;
  teamsTitle: string;
  teamsDesc: string;

  // Chat
  typeMessagePlaceholder: string;
  holdToRecord: string;
  recordingAudio: string;
  sendVoiceMessage: string;
  cancel: string;
  send: string;
  chatTTLNotice: string;

  // Cloudflare
  cloudflareHostingTitle: string;
  cloudflareHostingDesc: string;
  deployToCloudflare: string;

  // Header & Navigation
  zeroKnowledge: string;
  roleAdmin: string;
  roleMember: string;
  qrJoinFlow: string;
  directShareNav: string;
  lockAlertNav: string;
  cloudflareNav: string;
  langSelectorTitle: string;
  appReady: string;
  downloadApp: string;

  // Workspace & Perspective
  adminDesc: string;
  memberDesc: string;
  categoryFamily: string;
  categoryDelivery: string;
  categoryTeam: string;
  switchToMember: string;
  switchToAdmin: string;

  // SaaSHeroSection
  heroBadge: string;
  testQrJoin: string;
  directShareBtn: string;
  statPrivacy: string;
  statPurge: string;
  statZeroCloud: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  pillar4Title: string;
  pillar4Desc: string;
  useCasesSub: string;
  compareHeader: string;
  compareTitle: string;
  compareSub: string;
  compareColFeature: string;
  compareColConsentKey: string;
  yes: string;
  no: string;
  featExplicitConsent: string;
  feat24hRetention: string;
  featZeroCloudDb: string;
  featGeofenceZones: string;
  featVoiceComms: string;
  featInstantJoin: string;
  featSosAlarm: string;
  faqHeader: string;
  faqTitle: string;
  faq1Q: string;
  faq1A: string;
  faq2Q: string;
  faq2A: string;
  faq3Q: string;
  faq3A: string;
  faq4Q: string;
  faq4A: string;
  faq5Q: string;
  faq5A: string;

  // Admin Members List
  filterAll: string;
  filterActive: string;
  filterLowBatt: string;
  searchMember: string;
  invite: string;
  noMembersMatch: string;
  statusDriving: string;
  statusWalking: string;
  statusStationary: string;
  statusPaused: string;
  statusInside: string;
  badgeAdmin: string;

  // Consent Map
  safeZonesChip: string;
  mapDark: string;
  mapStreets: string;
  mapSatellite: string;
  liveGpsActive: string;
  directionsTo: string;
  minDriveTransit: string;
  clearRoute: string;
  sosDistressActive: string;
  recenterMap: string;
  zoomIn: string;
  zoomOut: string;

  // Member Mobile Controls
  yourProfile: string;
  memberSharingActive: string;
  memberSharingPaused: string;
  simulateMove: string;
  realDeviceGps: string;
  broadcastSos: string;
  messageDispatcher: string;
  confirmLeave: string;

  // Group Join Modal
  tabInvite: string;
  tabJoin: string;
  frictionlessTitle: string;
  frictionlessDesc: string;
  scanWithCamera: string;
  groupCircle: string;
  circleAdmin: string;
  inviteCode: string;
  directJoiningLink: string;
  copy: string;
  copied: string;
  shareLink: string;
  whatsApp: string;
  testJoinPrompt: string;
  testJoinBtn: string;
  connectingToCircle: string;
  zeroKnowledgeTerms: string;
  termAdminOnlyTitle: string;
  termAdminOnlyDesc: string;
  termExplicitSwitchTitle: string;
  termExplicitSwitchDesc: string;
  term24hPurgeTitle: string;
  term24hPurgeDesc: string;
  termAutoDownloadTitle: string;
  termAutoDownloadDesc: string;
  downloadingApp: string;
  autoDownloadAppSuffix: string;

  // Safe Zones Modal
  safeZonesTitle: string;
  safeZonesDesc: string;
  addSafeZone: string;
  zoneNameLabel: string;
  zoneNamePlaceholder: string;
  categoryLabel: string;
  radiusLabel: string;
  notifyEntry: string;
  notifyExit: string;
  saveZone: string;
  deleteZone: string;
  noSafeZones: string;
  catHome: string;
  catSchool: string;
  catWork: string;
  catHub: string;
  catCustom: string;

  // SOS Distress Modal
  sosModalTitle: string;
  sosModalDesc: string;
  sosHoldToTrigger: string;
  sosCancelCountdown: string;
  sosActiveAlert: string;
  sosResolveAlert: string;
  sosDefaultMessage: string;
  sosDistressPrompt: string;

  // Direct Chat Modal
  directChatWith: string;
  quickPrompts: string;
  promptEta: string;
  promptSafe: string;
  promptBattery: string;
  promptHeading: string;
  promptZone: string;

  // Lock Screen Modal
  lockScreenTitle: string;
  pushNotificationTitle: string;
  pushEnable: string;
  incomingCallFrom: string;
  incomingCallSub: string;
  swipeUpToOpen: string;
  testPhoneRingtone: string;
  stopPhoneRingtone: string;
  simulateCallNow: string;

  // Cloudflare Modal
  globalEdgeNetwork: string;
  globalEdgeDesc: string;
  zeroColdStarts: string;
  zeroColdStartsDesc: string;
  freeTierFriendly: string;
  freeTierDesc: string;
  wranglerConfigLabel: string;
  copyWranglerConfig: string;
  configCopied: string;

  // Direct Share Modal
  shareLabelPrompt: string;
  shareLabelPlaceholder: string;
  expirationPrompt: string;
  hoursSuffix: string;
  hourSuffix: string;
  liveShareActiveBadge: string;

  // Magic Link Modal
  quickDemoProfiles: string;
  familyGuardianProfile: string;
  deliveryDispatcherProfile: string;
  yourNameLabel: string;
  rolePortalLabel: string;
  adminLocalDownloadLabel: string;
  adminLocalDownloadSub: string;
  downloadBtn: string;
  downloadedBtn: string;

  // Banners, Footer & Mobile Dock
  dismiss: string;
  priorityDistress: string;
  viewSosDetails: string;
  markResolved: string;
  viewCloudflareSpecs: string;
  footerTitle: string;
  footerSub: string;
  dockMap: string;
  dockZones: string;
  dockSos: string;
  dockVoice: string;
  dockShare: string;
}
