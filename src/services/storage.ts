import {
  ChatMessage,
  LocationBreadcrumb,
  DirectShareLink,
  SafeZone,
  AdCampaign,
  AdPlacement,
  Group,
  Member,
  UserRole,
} from '../types';
import { generateHtmlFrameEmbedCode } from '../utils/adGenerator';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const DEFAULT_SAMPLE_CAMPAIGNS: AdCampaign[] = [];

const KEYS = {
  MESSAGES: 'safeloc_chat_history_24h',
  BREADCRUMBS: 'safeloc_breadcrumbs_24h',
  DIRECT_SHARES: 'safeloc_direct_shares_24h',
  SAFE_ZONES: 'safeloc_safe_zones',
  AUTH: 'safeloc_auth_state',
  ACTIVE_GROUP: 'safeloc_active_group',
  SAVED_GROUPS: 'safeloc_saved_groups',
  REGISTERED_USER: 'consentkey_user_profile',
  MEMBERS: 'safeloc_real_members',
  CONSENT: 'safeloc_member_consent',
  AD_CAMPAIGNS: 'safeloc_ad_campaigns_master',
};

const DEFAULT_SAFE_ZONES: SafeZone[] = [];

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

      // Strictly return real messages, no seeded dummy or sample messages
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

  /**
   * Get registered real user profile
   */
  static getRegisteredUser(): { id: string; name: string; email: string; role: UserRole } | null {
    try {
      const raw = localStorage.getItem(KEYS.REGISTERED_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save registered real user profile
   */
  static saveRegisteredUser(user: { id: string; name: string; email: string; role: UserRole }): void {
    try {
      localStorage.setItem(KEYS.REGISTERED_USER, JSON.stringify(user));
    } catch {}
  }

  /**
   * Clear registered real user profile
   */
  static clearRegisteredUser(): void {
    try {
      localStorage.removeItem(KEYS.REGISTERED_USER);
    } catch {}
  }

  /**
   * Get saved real groups
   */
  static getSavedGroups(): Group[] {
    try {
      const raw = localStorage.getItem(KEYS.SAVED_GROUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save real groups
   */
  static saveGroups(groups: Group[]): void {
    try {
      localStorage.setItem(KEYS.SAVED_GROUPS, JSON.stringify(groups));
    } catch {}
  }

  /**
   * Get saved real members
   */
  static getSavedMembers(): Member[] {
    try {
      const raw = localStorage.getItem(KEYS.MEMBERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save real members
   */
  static saveMembers(members: Member[]): void {
    try {
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
    } catch {}
  }
}

