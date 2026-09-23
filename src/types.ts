export type Language = 'en' | 'de' | 'bn' | 'hi' | 'ur' | 'ar' | 'fa' | 'tr';

export type AppTheme = 'clean' | 'dark';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export type UserRole = 'admin' | 'member';

export type GroupCategory = 'family' | 'delivery' | 'team' | 'friends' | 'business' | 'custom';

export interface Group {
  id: string;
  name: string;
  category: GroupCategory;
  adminId: string;
  adminName: string;
  adminEmail: string;
  inviteCode: string;
  createdAt: number;
}

export interface Member {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  groupId: string;
  groupName?: string;
  isConsentGiven: boolean;
  isSharingLocation: boolean;
  lastConsentTimestamp: number;
  lastLocationUpdate?: number;
  lat?: number;
  lng?: number;
  speed?: number;
  battery?: number;
  accuracy?: number;
  statusNote?: string;
  isOnline: boolean;
}

export interface LocationBreadcrumb {
  id: string;
  memberId: string;
  lat: number;
  lng: number;
  timestamp: number;
  expiresAt: number; // 24 hours TTL
}

export interface ChatMessage {
  id: string;
  groupId?: string;
  directShareId?: string;
  recipientId?: string;
  recipientName?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  type: 'text' | 'voice';
  text?: string;
  audioBlobUrl?: string;
  audioDurationSeconds?: number;
  timestamp: number;
  expiresAt: number; // 24 hours TTL
}

export interface DirectShareLink {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  label: string;
  lat: number;
  lng: number;
  createdAt: number;
  expiresAt: number;
  isRevoked: boolean;
  accuracy: number;
  battery: number;
}

export interface VoiceCallState {
  isOpen: boolean;
  isIncoming: boolean;
  callerName: string;
  callerRole: string;
  callerAvatar: string;
  connected: boolean;
  muted: boolean;
  speaker: boolean;
  callSeconds: number;
  isVideo?: boolean;
}

export interface MagicLinkAuth {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  role: UserRole;
  magicToken?: string;
}

export type MapLayerStyle = 'dark' | 'streets' | 'satellite';

export interface SafeZone {
  id: string;
  name: string;
  category: 'home' | 'work' | 'school' | 'hub' | 'custom';
  lat: number;
  lng: number;
  radiusMeters: number;
  color: string;
  iconName?: string;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
}

export interface EmergencyAlert {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: number;
  lat: number;
  lng: number;
  message: string;
  status: 'active' | 'resolved';
}

export interface NavigationRoute {
  targetMemberId: string;
  targetMemberName: string;
  distanceKm: number;
  estimatedMinutes: number;
  from: [number, number];
  to: [number, number];
  points: [number, number][];
}

export type AdType = 'adsense' | 'embed_html' | 'custom_banner' | 'rich_media';
export type AdPlacement = 'top_banner' | 'bottom_bar' | 'sidebar' | 'popup_interstitial' | 'draggable_float';
export type AdSize = 'responsive' | '728x90' | '300x250' | '320x50' | '468x60' | '160x600';
export type AdDurationPeriod =
  | 'unlimited'
  | '1_month'
  | '2_months'
  | '3_months'
  | '4_months'
  | '6_months'
  | '1_year'
  | 'custom';

export type CreativeMediaType = 'image' | 'video' | 'youtube' | 'text_card';

export interface AdCampaign {
  id: string;
  name: string;
  enabled: boolean;
  type: AdType;
  placement: AdPlacement;
  size: AdSize;
  // Code or custom content
  embedCode: string; // AdSense script tag, HTML snippet, or iframe embed
  bannerImageUrl?: string;
  bannerTargetUrl?: string;
  bannerAltText?: string;
  // Rich media creative builder fields
  mediaType?: CreativeMediaType;
  mediaUrl?: string;
  videoUrl?: string;
  headlineText?: string;
  bodyText?: string;
  ctaText?: string;
  ctaUrl?: string;
  badgeText?: string;
  themeColor?: string;
  autoplayVideo?: boolean;
  mutedVideo?: boolean;
  videoLoop?: boolean;
  // Free-floating draggable coordinates on screen
  floatPosition?: { x: number; y: number };
  // Timing & frequency controls
  timingMode: 'always' | 'interval' | 'delay_seconds';
  displayIntervalSeconds: number; // e.g. repeat every 30s or show after 10s
  durationSeconds: number; // e.g. dismiss after 15s (0 = indefinitely until closed)
  // Calendar validity & expiration period
  durationPeriod?: AdDurationPeriod;
  startDate?: number; // ms timestamp
  endDate?: number; // ms timestamp (undefined = run indefinitely)
  lastShownAt?: number;
  createdAt: number;
}

export type P2PTransferMode = 'send' | 'receive';
export type P2PTransferStatus = 'idle' | 'waiting' | 'connecting' | 'transferring' | 'completed' | 'error';

export interface P2PTransferMetadata {
  transferCode: string; // 6-character code e.g. "849201"
  fileName: string;
  fileSize: number;
  fileType: string;
  senderName: string;
  createdAt: number;
  expiresAt: number; // short-lived code validity (e.g., 10 minutes)
}

export interface P2PFilePayload {
  code: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderName: string;
  dataUrl?: string; // in-memory/data URL payload for instant zero-server device-to-device transport
  blob?: Blob;
  downloadUrl?: string;
  receivedAt?: number;
}

export interface MapsGroundingPlace {
  title: string;
  uri: string;
  snippet?: string;
  address?: string;
}

export interface MapsGroundingResponse {
  text: string;
  places: MapsGroundingPlace[];
  groundingMetadata?: any;
  isQuotaLimited?: boolean;
  directMapsUrl?: string;
}

