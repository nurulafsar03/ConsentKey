import fs from 'fs';
import path from 'path';

export interface RealUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: number;
}

export interface RealGroup {
  id: string;
  name: string;
  category: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  inviteCode: string;
  createdAt: number;
}

export interface RealMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
  groupId: string;
  isConsentGiven: boolean;
  isSharingLocation: boolean;
  lastConsentTimestamp: number;
  lastLocationUpdate?: number;
  lat?: number;
  lng?: number;
  speed?: number;
  battery?: number;
  accuracy?: number;
  isOnline: boolean;
}

export interface RealChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'member';
  type: 'text' | 'voice';
  text?: string;
  audioBlobUrl?: string;
  audioDurationSeconds?: number;
  timestamp: number;
  expiresAt: number;
}

interface DatabaseSchema {
  users: Record<string, RealUser>;
  groups: Record<string, RealGroup>;
  members: Record<string, RealMember>;
  messages: RealChatMessage[];
}

const DB_PATH = '/tmp/consentkey_real_db.json';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

class RealDataStore {
  private data: DatabaseSchema = {
    users: {},
    groups: {},
    members: {},
    messages: [],
  };

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          groups: parsed.groups || {},
          members: parsed.members || {},
          messages: parsed.messages || [],
        };
        this.purgeExpiredMessages();
      }
    } catch (err) {
      console.warn('Could not load database from disk, starting empty:', err);
    }
  }

  private saveToDisk() {
    try {
      this.purgeExpiredMessages();
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save real DB to disk:', err);
    }
  }

  private purgeExpiredMessages() {
    const now = Date.now();
    this.data.messages = this.data.messages.filter((m) => m.expiresAt > now);
  }

  // Register real user and optionally create or join a group
  public registerUser(params: {
    name: string;
    email: string;
    role: 'admin' | 'member';
    groupAction: 'create' | 'join';
    groupName?: string;
    groupCategory?: string;
    inviteCode?: string;
  }): { user: RealUser; group: RealGroup; member: RealMember } {
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const user: RealUser = {
      id: userId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role: params.role || 'member',
      createdAt: Date.now(),
    };
    this.data.users[userId] = user;

    let targetGroup: RealGroup | undefined;

    if (params.groupAction === 'join' && params.inviteCode) {
      const code = params.inviteCode.trim().toUpperCase();
      targetGroup = Object.values(this.data.groups).find(
        (g) => g.inviteCode.toUpperCase() === code
      );
    }

    // If no group found or action is 'create', create a new real group
    if (!targetGroup) {
      const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      const codePrefix = (params.groupName || 'TEAM').slice(0, 4).toUpperCase();
      const inviteCode = `${codePrefix}-${randomCode}`;

      targetGroup = {
        id: groupId,
        name: params.groupName?.trim() || `${user.name}'s Circle`,
        category: params.groupCategory || (user.role === 'admin' ? 'family' : 'friends'),
        adminId: user.id,
        adminName: user.name,
        adminEmail: user.email,
        inviteCode,
        createdAt: Date.now(),
      };
      this.data.groups[groupId] = targetGroup;
    }

    // Create member entry in the group
    const memberId = `mem_${user.id}`;
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const member: RealMember = {
      id: memberId,
      name: user.name,
      email: user.email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=0284c7,0d9488,059669`,
      role: targetGroup.adminId === user.id ? 'admin' : user.role,
      groupId: targetGroup.id,
      isConsentGiven: true,
      isSharingLocation: true,
      lastConsentTimestamp: Date.now(),
      isOnline: true,
    };
    this.data.members[memberId] = member;

    this.saveToDisk();
    return { user, group: targetGroup, member };
  }

  public getGroup(groupId: string): RealGroup | undefined {
    return this.data.groups[groupId];
  }

  public getGroupByInviteCode(code: string): RealGroup | undefined {
    const cleanCode = code.trim().toUpperCase();
    return Object.values(this.data.groups).find(
      (g) => g.inviteCode.toUpperCase() === cleanCode
    );
  }

  public getAllGroups(): RealGroup[] {
    return Object.values(this.data.groups);
  }

  public getGroupMembers(groupId: string): RealMember[] {
    return Object.values(this.data.members).filter((m) => m.groupId === groupId);
  }

  public updateMemberLocation(
    memberId: string,
    coords: {
      lat: number;
      lng: number;
      speed?: number;
      battery?: number;
      accuracy?: number;
      isSharingLocation?: boolean;
    }
  ): RealMember | undefined {
    const member = this.data.members[memberId];
    if (!member) return undefined;

    member.lat = coords.lat;
    member.lng = coords.lng;
    if (coords.speed !== undefined) member.speed = coords.speed;
    if (coords.battery !== undefined) member.battery = coords.battery;
    if (coords.accuracy !== undefined) member.accuracy = coords.accuracy;
    if (coords.isSharingLocation !== undefined) member.isSharingLocation = coords.isSharingLocation;
    member.lastLocationUpdate = Date.now();
    member.isOnline = true;

    this.saveToDisk();
    return member;
  }

  public addMessage(
    groupId: string,
    msg: {
      senderId: string;
      senderName: string;
      senderRole: 'admin' | 'member';
      type: 'text' | 'voice';
      text?: string;
      audioBlobUrl?: string;
      audioDurationSeconds?: number;
    }
  ): RealChatMessage {
    const now = Date.now();
    const chatMsg: RealChatMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      groupId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      type: msg.type,
      text: msg.text,
      audioBlobUrl: msg.audioBlobUrl,
      audioDurationSeconds: msg.audioDurationSeconds,
      timestamp: now,
      expiresAt: now + TWENTY_FOUR_HOURS_MS,
    };

    this.data.messages.push(chatMsg);
    this.saveToDisk();
    return chatMsg;
  }

  public getMessages(groupId: string): RealChatMessage[] {
    this.purgeExpiredMessages();
    return this.data.messages.filter((m) => m.groupId === groupId);
  }
}

export const realDataStore = new RealDataStore();
