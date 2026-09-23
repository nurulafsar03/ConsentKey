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
  userId?: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
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
    userId: row.user_id ?? undefined,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    role: row.role,
    groupId: row.group_id,
    groupName: row.group_name ?? undefined,
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

function userRowToObj(row: any): RealUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: !!row.email_verified,
    createdAt: row.created_at,
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

function makeAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name
  )}&backgroundColor=0284c7,0d9488,059669`;
}

async function insertMember(
  DB: D1Database,
  user: RealUser,
  groupId: string,
  role: 'admin' | 'member',
  now: number
): Promise<RealMember> {
  const member: RealMember = {
    id: randomId('mem'),
    userId: user.id,
    name: user.name,
    email: user.email,
    avatar: makeAvatar(user.name),
    role,
    groupId,
    isConsentGiven: true,
    isSharingLocation: true,
    lastConsentTimestamp: now,
    isOnline: true,
  };

  await DB.prepare(
    `INSERT INTO members (id, user_id, name, email, avatar, role, group_id, is_consent_given, is_sharing_location, last_consent_timestamp, is_online)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 1)`
  )
    .bind(member.id, member.userId, member.name, member.email, member.avatar, member.role, member.groupId, now)
    .run();

  return member;
}

async function createGroupForUser(
  DB: D1Database,
  user: RealUser,
  groupName: string | undefined,
  groupCategory: string | undefined,
  now: number
): Promise<RealGroup> {
  const groupId = randomId('grp');
  const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
  const codePrefix = (groupName || 'TEAM').slice(0, 4).toUpperCase();
  const inviteCode = `${codePrefix}-${randomCode}`;

  const group: RealGroup = {
    id: groupId,
    name: groupName?.trim() || `${user.name}'s Circle`,
    category: groupCategory || (user.role === 'admin' ? 'family' : 'friends'),
    adminId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    inviteCode,
    createdAt: now,
  };

  await DB.prepare(
    `INSERT INTO groups (id, name, category, admin_id, admin_name, admin_email, invite_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(group.id, group.name, group.category, group.adminId, group.adminName, group.adminEmail, group.inviteCode, now)
    .run();

  return group;
}

/**
 * Registers a real user, or — if the email already has an account — logs
 * them back into their existing circle instead of creating a duplicate
 * admin/user/circle. This prevents the same email + name from piling up
 * repeat "admin" accounts every time the registration form is submitted.
 */
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
): Promise<{ user: RealUser; group: RealGroup; member: RealMember; isReturningUser: boolean }> {
  const now = Date.now();
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();

  const existingUserRow: any = await DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();

  // ---- JOIN an existing circle by invite code ----
  if (params.groupAction === 'join' && params.inviteCode) {
    const code = params.inviteCode.trim().toUpperCase();
    const groupRow: any = await DB.prepare(`SELECT * FROM groups WHERE UPPER(invite_code) = ?`).bind(code).first();
    if (!groupRow) throw new Error('Invite code not found');
    const group = groupRowToObj(groupRow);

    // Already a member of this exact circle? -> auto-login, no duplicate row.
    const existingMemberRow: any = await DB.prepare(
      `SELECT * FROM members WHERE group_id = ? AND LOWER(email) = ?`
    )
      .bind(group.id, email)
      .first();

    if (existingMemberRow) {
      const user = existingUserRow
        ? userRowToObj(existingUserRow)
        : { id: existingMemberRow.user_id || randomId('usr'), name: existingMemberRow.name, email, role: existingMemberRow.role, emailVerified: false, createdAt: now };
      return { user, group, member: memberRowToObj(existingMemberRow), isReturningUser: true };
    }

    const user: RealUser = existingUserRow
      ? userRowToObj(existingUserRow)
      : { id: randomId('usr'), name, email, role: 'member', emailVerified: false, createdAt: now };

    if (!existingUserRow) {
      await DB.prepare(`INSERT INTO users (id, name, email, role, email_verified, created_at) VALUES (?, ?, ?, ?, 0, ?)`)
        .bind(user.id, user.name, user.email, user.role, now)
        .run();
    }

    const member = await insertMember(DB, user, group.id, 'member', now);
    return { user, group, member, isReturningUser: false };
  }

  // ---- CREATE a new circle, or auto-login a returning user to their circle ----
  if (existingUserRow) {
    const user = userRowToObj(existingUserRow);

    // Prefer a circle where they're the admin; otherwise any circle they belong to.
    const memberRow: any = await DB.prepare(
      `SELECT * FROM members WHERE LOWER(email) = ? ORDER BY (role = 'admin') DESC LIMIT 1`
    )
      .bind(email)
      .first();

    if (memberRow) {
      const groupRow: any = await DB.prepare(`SELECT * FROM groups WHERE id = ?`).bind(memberRow.group_id).first();
      if (groupRow) {
        return { user, group: groupRowToObj(groupRow), member: memberRowToObj(memberRow), isReturningUser: true };
      }
    }

    // Existing account but no circle yet (edge case) — create one now.
    const group = await createGroupForUser(DB, user, params.groupName, params.groupCategory, now);
    const member = await insertMember(DB, user, group.id, 'admin', now);
    return { user, group, member, isReturningUser: false };
  }

  // ---- Brand-new user ----
  const user: RealUser = { id: randomId('usr'), name, email, role: params.role || 'member', emailVerified: false, createdAt: now };
  await DB.prepare(`INSERT INTO users (id, name, email, role, email_verified, created_at) VALUES (?, ?, ?, ?, 0, ?)`)
    .bind(user.id, user.name, user.email, user.role, now)
    .run();

  const group = await createGroupForUser(DB, user, params.groupName, params.groupCategory, now);
  const member = await insertMember(DB, user, group.id, 'admin', now);
  return { user, group, member, isReturningUser: false };
}

/**
 * Full member/user directory across every circle, for the Super Admin panel.
 * Includes the circle name so the panel doesn't need a separate groups fetch.
 */
export async function getAllMembersForAdmin(DB: D1Database): Promise<RealMember[]> {
  const { results } = await DB.prepare(
    `SELECT m.*, g.name as group_name
     FROM members m
     LEFT JOIN groups g ON g.id = m.group_id
     ORDER BY m.id DESC`
  ).all();
  return (results || []).map(memberRowToObj);
}

/**
 * Updates a member's profile. If this member row is linked to a real user
 * account (user_id set), the users table and — if they're a circle admin —
 * the circle's displayed admin name/email are kept in sync too.
 */
export async function updateMemberAndUser(
  DB: D1Database,
  memberId: string,
  updates: { name?: string; email?: string; role?: 'admin' | 'member' }
): Promise<RealMember | undefined> {
  const memberRow: any = await DB.prepare(`SELECT * FROM members WHERE id = ?`).bind(memberId).first();
  if (!memberRow) return undefined;

  const name = updates.name?.trim() || memberRow.name;
  const email = updates.email?.trim().toLowerCase() || memberRow.email;
  const role = updates.role || memberRow.role;

  await DB.prepare(`UPDATE members SET name = ?, email = ?, role = ? WHERE id = ?`)
    .bind(name, email, role, memberId)
    .run();

  if (memberRow.user_id) {
    await DB.prepare(`UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`)
      .bind(name, email, role, memberRow.user_id)
      .run();
    await DB.prepare(`UPDATE groups SET admin_name = ?, admin_email = ? WHERE admin_id = ?`)
      .bind(name, email, memberRow.user_id)
      .run();
  }

  const updatedRow: any = await DB.prepare(
    `SELECT m.*, g.name as group_name FROM members m LEFT JOIN groups g ON g.id = m.group_id WHERE m.id = ?`
  )
    .bind(memberId)
    .first();
  return updatedRow ? memberRowToObj(updatedRow) : undefined;
}

/**
 * Deletes a member from the Super Admin panel. If the member was the
 * admin of their circle, the whole circle (its members + messages) is
 * removed too, since a circle can't meaningfully exist without its admin.
 * If the underlying user has no other memberships left anywhere, their
 * account and any pending magic links are removed as well — this is what
 * lets a super admin fully clean up duplicate/test accounts.
 */
export async function deleteMemberCascade(DB: D1Database, memberId: string): Promise<{ ok: boolean; reason?: string }> {
  const memberRow: any = await DB.prepare(`SELECT * FROM members WHERE id = ?`).bind(memberId).first();
  if (!memberRow) return { ok: false, reason: 'Member not found' };

  await DB.prepare(`DELETE FROM members WHERE id = ?`).bind(memberId).run();

  const userId = memberRow.user_id;

  const groupRow: any = await DB.prepare(`SELECT * FROM groups WHERE id = ?`).bind(memberRow.group_id).first();
  if (groupRow && userId && groupRow.admin_id === userId) {
    await DB.prepare(`DELETE FROM messages WHERE group_id = ?`).bind(groupRow.id).run();
    await DB.prepare(`DELETE FROM members WHERE group_id = ?`).bind(groupRow.id).run();
    await DB.prepare(`DELETE FROM groups WHERE id = ?`).bind(groupRow.id).run();
  }

  if (userId) {
    const remaining: any = await DB.prepare(`SELECT COUNT(*) as c FROM members WHERE user_id = ?`).bind(userId).first();
    if (!remaining || remaining.c === 0) {
      await DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run();
      await DB.prepare(`DELETE FROM magic_links WHERE user_id = ?`).bind(userId).run();
    }
  }

  return { ok: true };
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
