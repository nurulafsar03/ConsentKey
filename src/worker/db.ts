// D1-backed data store for ConsentKey. Replaces the old local-JSON-file
// realDataStore.ts, which cannot work on Cloudflare Workers (no persistent
// filesystem). All functions take the D1 binding (env.DB) as first arg.

export interface RealUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  emailVerified: boolean;
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

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function memberRowToObj(row: any): RealMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    role: row.role,
    groupId: row.group_id,
    isConsentGiven: !!row.is_consent_given,
    isSharingLocation: !!row.is_sharing_location,
    lastConsentTimestamp: row.last_consent_timestamp,
    lastLocationUpdate: row.last_location_update ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    speed: row.speed ?? undefined,
    battery: row.battery ?? undefined,
    accuracy: row.accuracy ?? undefined,
    isOnline: !!row.is_online,
  };
}

function groupRowToObj(row: any): RealGroup {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    adminId: row.admin_id,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
  };
}

function messageRowToObj(row: any): RealChatMessage {
  return {
    id: row.id,
    groupId: row.group_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    type: row.type,
    text: row.text ?? undefined,
    audioBlobUrl: row.audio_blob_url ?? undefined,
    audioDurationSeconds: row.audio_duration_seconds ?? undefined,
    timestamp: row.timestamp,
    expiresAt: row.expires_at,
  };
}

export async function registerUser(
  DB: D1Database,
  params: {
    name: string;
    email: string;
    role: 'admin' | 'member';
    groupAction: 'create' | 'join';
    groupName?: string;
    groupCategory?: string;
    inviteCode?: string;
  }
): Promise<{ user: RealUser; group: RealGroup; member: RealMember }> {
  const now = Date.now();
  const userId = randomId('usr');
  const email = params.name ? params.email.trim().toLowerCase() : '';

  const user: RealUser = {
    id: userId,
    name: params.name.trim(),
    email,
    role: params.role || 'member',
    emailVerified: false,
    createdAt: now,
  };

  await DB.prepare(
    `INSERT INTO users (id, name, email, role, email_verified, created_at) VALUES (?, ?, ?, ?, 0, ?)`
  )
    .bind(user.id, user.name, user.email, user.role, now)
    .run();

  let targetGroup: RealGroup | undefined;

  if (params.groupAction === 'join' && params.inviteCode) {
    const code = params.inviteCode.trim().toUpperCase();
    const row = await DB.prepare(`SELECT * FROM groups WHERE UPPER(invite_code) = ?`)
      .bind(code)
      .first();
    if (row) targetGroup = groupRowToObj(row);
  }

  if (!targetGroup) {
    const groupId = randomId('grp');
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
      createdAt: now,
    };

    await DB.prepare(
      `INSERT INTO groups (id, name, category, admin_id, admin_name, admin_email, invite_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        targetGroup.id,
        targetGroup.name,
        targetGroup.category,
        targetGroup.adminId,
        targetGroup.adminName,
        targetGroup.adminEmail,
        targetGroup.inviteCode,
        now
      )
      .run();
  }

  const memberId = `mem_${user.id}`;
  const member: RealMember = {
    id: memberId,
    name: user.name,
    email: user.email,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user.name
    )}&backgroundColor=0284c7,0d9488,059669`,
    role: targetGroup.adminId === user.id ? 'admin' : user.role,
    groupId: targetGroup.id,
    isConsentGiven: true,
    isSharingLocation: true,
    lastConsentTimestamp: now,
    isOnline: true,
  };

  await DB.prepare(
    `INSERT INTO members (id, name, email, avatar, role, group_id, is_consent_given, is_sharing_location, last_consent_timestamp, is_online)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, 1)`
  )
    .bind(member.id, member.name, member.email, member.avatar, member.role, member.groupId, now)
    .run();

  return { user, group: targetGroup, member };
}

export async function getGroupByInviteCode(DB: D1Database, code: string): Promise<RealGroup | undefined> {
  const row = await DB.prepare(`SELECT * FROM groups WHERE UPPER(invite_code) = ?`)
    .bind(code.trim().toUpperCase())
    .first();
  return row ? groupRowToObj(row) : undefined;
}

export async function getAllGroups(DB: D1Database): Promise<RealGroup[]> {
  const { results } = await DB.prepare(`SELECT * FROM groups ORDER BY created_at DESC`).all();
  return (results || []).map(groupRowToObj);
}

export async function getGroupMembers(DB: D1Database, groupId: string): Promise<RealMember[]> {
  const { results } = await DB.prepare(`SELECT * FROM members WHERE group_id = ?`).bind(groupId).all();
  return (results || []).map(memberRowToObj);
}

export async function updateMemberLocation(
  DB: D1Database,
  memberId: string,
  coords: {
    lat: number;
    lng: number;
    speed?: number;
    battery?: number;
    accuracy?: number;
    isSharingLocation?: boolean;
  }
): Promise<RealMember | undefined> {
  const now = Date.now();
  await DB.prepare(
    `UPDATE members SET lat = ?, lng = ?, speed = COALESCE(?, speed), battery = COALESCE(?, battery),
     accuracy = COALESCE(?, accuracy), is_sharing_location = COALESCE(?, is_sharing_location),
     last_location_update = ?, is_online = 1 WHERE id = ?`
  )
    .bind(
      coords.lat,
      coords.lng,
      coords.speed ?? null,
      coords.battery ?? null,
      coords.accuracy ?? null,
      coords.isSharingLocation === undefined ? null : coords.isSharingLocation ? 1 : 0,
      now,
      memberId
    )
    .run();

  const row = await DB.prepare(`SELECT * FROM members WHERE id = ?`).bind(memberId).first();
  return row ? memberRowToObj(row) : undefined;
}

export async function addMessage(
  DB: D1Database,
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
): Promise<RealChatMessage> {
  const now = Date.now();
  const chatMsg: RealChatMessage = {
    id: randomId('msg'),
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

  await DB.prepare(
    `INSERT INTO messages (id, group_id, sender_id, sender_name, sender_role, type, text, audio_blob_url, audio_duration_seconds, timestamp, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      chatMsg.id,
      chatMsg.groupId,
      chatMsg.senderId,
      chatMsg.senderName,
      chatMsg.senderRole,
      chatMsg.type,
      chatMsg.text ?? null,
      chatMsg.audioBlobUrl ?? null,
      chatMsg.audioDurationSeconds ?? null,
      chatMsg.timestamp,
      chatMsg.expiresAt
    )
    .run();

  return chatMsg;
}

export async function getMessages(DB: D1Database, groupId: string): Promise<RealChatMessage[]> {
  const now = Date.now();
  // Purge expired messages for this group, then return what's left.
  await DB.prepare(`DELETE FROM messages WHERE group_id = ? AND expires_at <= ?`).bind(groupId, now).run();
  const { results } = await DB.prepare(`SELECT * FROM messages WHERE group_id = ? ORDER BY timestamp ASC`)
    .bind(groupId)
    .all();
  return (results || []).map(messageRowToObj);
}

// --- Magic link (email verification) ---

export async function createMagicLink(
  DB: D1Database,
  userId: string,
  email: string
): Promise<string> {
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 30 * 60 * 1000; // 30 minutes
  await DB.prepare(
    `INSERT INTO magic_links (token, user_id, email, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)`
  )
    .bind(token, userId, email, expiresAt, now)
    .run();
  return token;
}

export async function verifyMagicLink(DB: D1Database, token: string): Promise<{ ok: boolean; reason?: string }> {
  const row: any = await DB.prepare(`SELECT * FROM magic_links WHERE token = ?`).bind(token).first();
  if (!row) return { ok: false, reason: 'Invalid or unknown link.' };
  if (row.used) return { ok: false, reason: 'This link has already been used.' };
  if (row.expires_at < Date.now()) return { ok: false, reason: 'This link has expired.' };

  await DB.prepare(`UPDATE magic_links SET used = 1 WHERE token = ?`).bind(token).run();
  await DB.prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`).bind(row.user_id).run();
  return { ok: true };
}
