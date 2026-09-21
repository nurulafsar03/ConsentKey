import { ChatMessage, LocationBreadcrumb, DirectShareLink, SafeZone, AdCampaign, AdPlacement } from '../types';
import { generateHtmlFrameEmbedCode } from '../utils/adGenerator';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const DEFAULT_SAMPLE_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'campaign_drag_demo',
    name: 'Sample Visual Ad Frame (Draggable)',
    enabled: true,
    type: 'rich_media',
    placement: 'draggable_float',
    size: 'responsive',
    embedCode: generateHtmlFrameEmbedCode({
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=80',
      headline: 'Next-Gen Fleet & Family Location Safety',
      body: 'Live GPS telemetry, instant geofence boundaries, and private zero-server breadcrumbs.',
      ctaText: 'Try ConsentKey Pro',
      ctaUrl: '#',
      badge: 'SPONSORED',
      themeColor: '#06b6d4',
      bgColor: '#020617',
      textColor: '#f8fafc',
    }),
    displayIntervalSeconds: 0,
    durationSeconds: 0,
    timingMode: 'always',
    startDate: Date.now(),
    durationPeriod: 'unlimited',
    floatPosition: { x: 20, y: 110 },
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=80',
    headlineText: 'Next-Gen Fleet & Family Location Safety',
    bodyText: 'Live GPS telemetry, instant geofence boundaries, and private zero-server breadcrumbs.',
    ctaText: 'Try ConsentKey Pro',
    ctaUrl: '#',
    badgeText: 'SPONSORED',
    themeColor: '#06b6d4',
    createdAt: Date.now(),
  },
];

const KEYS = {
  MESSAGES: 'safeloc_chat_history_24h',
  BREADCRUMBS: 'safeloc_breadcrumbs_24h',
  DIRECT_SHARES: 'safeloc_direct_shares_24h',
  SAFE_ZONES: 'safeloc_safe_zones',
  AUTH: 'safeloc_auth_state',
  ACTIVE_GROUP: 'safeloc_active_group',
  CONSENT: 'safeloc_member_consent',
  AD_CAMPAIGNS: 'safeloc_ad_campaigns_master',
};

const DEFAULT_SAFE_ZONES: SafeZone[] = [
  {
    id: 'zone_home',
    name: 'Family Base / Home',
    category: 'home',
    lat: 51.5074,
    lng: -0.1278,
    radiusMeters: 180,
    color: '#10b981',
    iconName: 'home',
    notifyOnEntry: true,
    notifyOnExit: true,
  },
  {
    id: 'zone_school',
    name: 'St. Mary Academy (School)',
    category: 'school',
    lat: 51.5124,
    lng: -0.1218,
    radiusMeters: 220,
    color: '#3b82f6',
    iconName: 'school',
    notifyOnEntry: true,
    notifyOnExit: true,
  },
  {
    id: 'zone_hub',
    name: 'Central Logistics Depot',
    category: 'hub',
    lat: 51.5024,
    lng: -0.1338,
    radiusMeters: 250,
    color: '#f59e0b',
    iconName: 'hub',
    notifyOnEntry: true,
    notifyOnExit: true,
  },
];

export class StorageService {
  /**
   * Save a chat message with 24h expiration
   */
  static saveMessage(message: ChatMessage): void {
    const existing = this.getMessages();
    const now = Date.now();
    const updated = [
      ...existing.filter(m => m.expiresAt > now),
      { ...message, expiresAt: now + TWENTY_FOUR_HOURS_MS },
    ];
    try {
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(updated));
    } catch {
      // Storage full or quota exceeded
    }
  }

  /**
   * Get non-expired messages (<= 24h)
   */
  static getMessages(
    groupId?: string,
    directShareId?: string,
    directPair?: { userA: string; userB: string }
  ): ChatMessage[] {
    try {
      const raw = localStorage.getItem(KEYS.MESSAGES);
      let parsed: ChatMessage[] = raw ? JSON.parse(raw) : [];

      // Seed initial welcoming/realistic messages if empty
      if (parsed.length === 0) {
        const now = Date.now();
        parsed = [
          {
            id: 'msg_init_1',
            groupId: 'grp_family_01',
            senderId: 'mem_sarah',
            senderName: 'Sarah Jenkins (Admin)',
            senderRole: 'admin',
            type: 'text',
            text: 'ConsentKey session initiated. All location telemetry will auto-purge after 24h.',
            timestamp: now - 3600000,
            expiresAt: now + TWENTY_FOUR_HOURS_MS,
          },
          {
            id: 'msg_init_2',
            groupId: 'grp_family_01',
            senderId: 'mem_leo',
            senderName: 'Leo (Teen / Field Member)',
            senderRole: 'member',
            type: 'text',
            text: 'Reached campus library safely. Location sharing active!',
            timestamp: now - 2400000,
            expiresAt: now + TWENTY_FOUR_HOURS_MS,
          },
          {
            id: 'msg_init_3',
            senderId: 'mem_leo',
            senderName: 'Leo (Teen / Field Member)',
            recipientId: 'mem_sarah',
            recipientName: 'Sarah Jenkins (Admin)',
            senderRole: 'member',
            type: 'text',
            text: 'Hey Sarah, battery is at 78%. Let me know when you need me to head back.',
            timestamp: now - 1800000,
            expiresAt: now + TWENTY_FOUR_HOURS_MS,
          },
          {
            id: 'msg_init_4',
            senderId: 'mem_david',
            senderName: 'David (Member)',
            recipientId: 'mem_sarah',
            recipientName: 'Sarah Jenkins (Admin)',
            senderRole: 'member',
            type: 'text',
            text: 'Dispatch package #849 is out for delivery. ETA is 15 minutes.',
            timestamp: now - 1200000,
            expiresAt: now + TWENTY_FOUR_HOURS_MS,
          },
        ];
        localStorage.setItem(KEYS.MESSAGES, JSON.stringify(parsed));
      }

      const now = Date.now();
      const valid = parsed.filter((m) => m.expiresAt > now);

      if (valid.length !== parsed.length) {
        localStorage.setItem(KEYS.MESSAGES, JSON.stringify(valid));
      }

      // If direct 1-to-1 conversation pair requested
      if (directPair) {
        return valid.filter(
          (m) =>
            (m.senderId === directPair.userA && m.recipientId === directPair.userB) ||
            (m.senderId === directPair.userB && m.recipientId === directPair.userA)
        );
      }

      if (groupId) {
        return valid.filter((m) => m.groupId === groupId && !m.recipientId);
      }
      if (directShareId) {
        return valid.filter((m) => m.directShareId === directShareId);
      }
      return valid;
    } catch {
      return [];
    }
  }

  /**
   * Save breadcrumb with 24h expiration
   */
  static saveBreadcrumb(breadcrumb: LocationBreadcrumb): void {
    const existing = this.getBreadcrumbs(breadcrumb.memberId);
    const now = Date.now();
    const updated = [
      ...existing.filter(b => b.expiresAt > now),
      { ...breadcrumb, expiresAt: now + TWENTY_FOUR_HOURS_MS },
    ].slice(-120);
    try {
      localStorage.setItem(
        `${KEYS.BREADCRUMBS}_${breadcrumb.memberId}`,
        JSON.stringify(updated)
      );
    } catch {
      // Storage quota safety fallback: keep only last 40 items if storage is full
      try {
        localStorage.setItem(
          `${KEYS.BREADCRUMBS}_${breadcrumb.memberId}`,
          JSON.stringify(updated.slice(-40))
        );
      } catch {
        // Silent recovery
      }
    }
  }

  /**
   * Get breadcrumbs for a member (strictly <= 24h)
   */
  static getBreadcrumbs(memberId: string): LocationBreadcrumb[] {
    try {
      const raw = localStorage.getItem(`${KEYS.BREADCRUMBS}_${memberId}`);
      if (!raw) return [];
      const parsed: LocationBreadcrumb[] = JSON.parse(raw);
      const now = Date.now();
      const valid = parsed.filter(b => b.expiresAt > now);

      if (valid.length !== parsed.length) {
        localStorage.setItem(
          `${KEYS.BREADCRUMBS}_${memberId}`,
          JSON.stringify(valid)
        );
      }
      return valid;
    } catch {
      return [];
    }
  }

  /**
   * Save a Direct 1-to-1 share
   */
  static saveDirectShare(share: DirectShareLink): void {
    try {
      const existing = this.getDirectShares();
      const updated = [share, ...existing.filter(s => s.id !== share.id)];
      localStorage.setItem(KEYS.DIRECT_SHARES, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Get Direct shares
   */
  static getDirectShares(): DirectShareLink[] {
    try {
      const raw = localStorage.getItem(KEYS.DIRECT_SHARES);
      if (!raw) return [];
      const parsed: DirectShareLink[] = JSON.parse(raw);
      const now = Date.now();
      return parsed.filter(s => s.expiresAt > now && !s.isRevoked);
    } catch {
      return [];
    }
  }

  /**
   * Revoke Direct Share
   */
  static revokeDirectShare(id: string): void {
    try {
      const existing = this.getDirectShares();
      const updated = existing.map(s => s.id === id ? { ...s, isRevoked: true } : s);
      localStorage.setItem(KEYS.DIRECT_SHARES, JSON.stringify(updated.filter(s => !s.isRevoked)));
    } catch {}
  }

  /**
   * Purge all items older than 24 hours
   */
  static purgeExpired(): number {
    let purgedCount = 0;
    const now = Date.now();

    // Purge messages
    try {
      const rawMsg = localStorage.getItem(KEYS.MESSAGES);
      if (rawMsg) {
        const msgs: ChatMessage[] = JSON.parse(rawMsg);
        const valid = msgs.filter(m => m.expiresAt > now);
        purgedCount += msgs.length - valid.length;
        localStorage.setItem(KEYS.MESSAGES, JSON.stringify(valid));
      }
    } catch {}

    // Purge breadcrumbs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.BREADCRUMBS)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const crumbs: LocationBreadcrumb[] = JSON.parse(raw);
            const valid = crumbs.filter(c => c.expiresAt > now);
            purgedCount += crumbs.length - valid.length;
            localStorage.setItem(key, JSON.stringify(valid));
          }
        } catch {}
      }
    }

    return purgedCount;
  }

  /**
   * Purge all local data immediately on demand
   */
  static clearEverything(): void {
    localStorage.removeItem(KEYS.MESSAGES);
    localStorage.removeItem(KEYS.DIRECT_SHARES);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.BREADCRUMBS)) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Get stats about stored items in local browser
   */
  static getStats(): { messageCount: number; breadcrumbCount: number; oldestAgeMinutes: number } {
    let messageCount = 0;
    let breadcrumbCount = 0;
    let oldestTimestamp = Date.now();

    try {
      const rawMsg = localStorage.getItem(KEYS.MESSAGES);
      if (rawMsg) {
        const msgs: ChatMessage[] = JSON.parse(rawMsg);
        messageCount = msgs.length;
        msgs.forEach(m => {
          if (m.timestamp < oldestTimestamp) oldestTimestamp = m.timestamp;
        });
      }
    } catch {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.BREADCRUMBS)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const crumbs: LocationBreadcrumb[] = JSON.parse(raw);
            breadcrumbCount += crumbs.length;
            crumbs.forEach(c => {
              if (c.timestamp < oldestTimestamp) oldestTimestamp = c.timestamp;
            });
          }
        } catch {}
      }
    }

    const oldestAgeMinutes = Math.max(0, Math.floor((Date.now() - oldestTimestamp) / (60 * 1000)));

    return {
      messageCount,
      breadcrumbCount,
      oldestAgeMinutes,
    };
  }

  /**
   * Get configured safe zones / geofences
   */
  static getSafeZones(): SafeZone[] {
    try {
      const raw = localStorage.getItem(KEYS.SAFE_ZONES);
      if (!raw) {
        localStorage.setItem(KEYS.SAFE_ZONES, JSON.stringify(DEFAULT_SAFE_ZONES));
        return DEFAULT_SAFE_ZONES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SAFE_ZONES;
    }
  }

  /**
   * Save or update a safe zone
   */
  static saveSafeZone(zone: SafeZone): void {
    try {
      const current = this.getSafeZones();
      const exists = current.some(z => z.id === zone.id);
      const updated = exists ? current.map(z => (z.id === zone.id ? zone : z)) : [...current, zone];
      localStorage.setItem(KEYS.SAFE_ZONES, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Delete a safe zone
   */
  static deleteSafeZone(id: string): void {
    try {
      const current = this.getSafeZones();
      const updated = current.filter(z => z.id !== id);
      localStorage.setItem(KEYS.SAFE_ZONES, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Get configured ad campaigns (Google AdSense & custom embed placements)
   */
  static getAdCampaigns(): AdCampaign[] {
    try {
      const raw = localStorage.getItem(KEYS.AD_CAMPAIGNS);
      if (!raw) {
        localStorage.setItem(KEYS.AD_CAMPAIGNS, JSON.stringify(DEFAULT_SAMPLE_CAMPAIGNS));
        return DEFAULT_SAMPLE_CAMPAIGNS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SAMPLE_CAMPAIGNS;
    }
  }

  /**
   * Save configured ad campaigns
   */
  static saveAdCampaigns(campaigns: AdCampaign[]): void {
    try {
      localStorage.setItem(KEYS.AD_CAMPAIGNS, JSON.stringify(campaigns));
    } catch {}
  }

  /**
   * Update the draggable on-screen (x, y) coordinates of a floating ad campaign
   */
  static updateAdCampaignPosition(id: string, pos: { x: number; y: number }): void {
    try {
      const current = this.getAdCampaigns();
      const updated = current.map((c) => (c.id === id ? { ...c, floatPosition: pos } : c));
      this.saveAdCampaigns(updated);
    } catch {}
  }

  /**
   * Move an ad campaign to a different slot (top_banner, sidebar, bottom_bar, popup_interstitial, draggable_float)
   */
  static updateAdCampaignPlacement(id: string, placement: AdPlacement): void {
    try {
      const current = this.getAdCampaigns();
      const updated = current.map((c) => (c.id === id ? { ...c, placement } : c));
      this.saveAdCampaigns(updated);
    } catch {}
  }
}

