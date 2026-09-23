import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck, PlusCircle, LogIn, Users, Sparkles, MapPin, X, MailCheck, Loader2, RotateCcw } from 'lucide-react';
import { UserRole, GroupCategory, Group, Member } from '../types';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onRegistered: (user: { id: string; name: string; email: string; role: UserRole }, group: Group, member: Member) => void;
  defaultInviteCode?: string;
  isInitialRequired?: boolean;
}

export const UserRegistrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRegistered,
  defaultInviteCode = '',
  isInitialRequired = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [action, setAction] = useState<'create' | 'join'>(defaultInviteCode ? 'join' : 'create');
  const [groupName, setGroupName] = useState('');
  const [groupCategory, setGroupCategory] = useState<GroupCategory>('family');
  const [inviteCode, setInviteCode] = useState(defaultInviteCode);
  const [agreedConsent, setAgreedConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set only when a real, unverified ADMIN account was just created — the
  // app stays locked out of that account until the magic link is clicked.
  const [pendingVerification, setPendingVerification] = useState<null | {
    user: { id: string; name: string; email: string; role: UserRole };
    group: Group;
    member: Member;
  }>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Poll the backend every few seconds — the moment the user clicks the
  // link in their inbox (any tab, any device), this unlocks automatically.
  useEffect(() => {
    if (!pendingVerification) return;
    const email = pendingVerification.user.email;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/users/status?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.emailVerified) {
            clearInterval(interval);
            const { user, group, member } = pendingVerification;
            onRegistered(user, group, member);
            if (onClose) onClose();
          }
        }
      } catch {
        // keep polling silently — a transient network blip shouldn't interrupt this
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pendingVerification]);

  const handleResend = async () => {
    if (!pendingVerification) return;
    setIsResending(true);
    setResendSent(false);
    try {
      await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerification.user.email }),
      });
    } catch {
      // best effort
    } finally {
      setIsResending(false);
      setResendSent(true);
    }
  };

  if (!isOpen) return null;

  if (pendingVerification) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white my-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MailCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Verify Your Email to Continue</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              A verification link was sent to <span className="text-emerald-400 font-semibold">{pendingVerification.user.email}</span>.
              As the circle admin, you must click it before your workspace unlocks. This window will continue automatically once verified.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Waiting for verification…</span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Resend Verification Email</span>
          </button>
          {resendSent && (
            <p className="text-[11px] text-emerald-400">A new link has been sent (if it hasn't arrived, check your spam folder).</p>
          )}

          {!isInitialRequired && onClose && (
            <button
              type="button"
              onClick={() => {
                setPendingVerification(null);
                onClose();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              Cancel and close
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your real full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (action === 'create' && !groupName.trim()) {
      setError('Please enter a name for your circle or team.');
      return;
    }
    if (action === 'join' && !inviteCode.trim()) {
      setError('Please enter the invite code for the circle you want to join.');
      return;
    }
    if (!agreedConsent) {
      setError('You must confirm consent for privacy and temporary 24h retention.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Send real registration to backend
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          groupAction: action,
          groupName: groupName.trim(),
          groupCategory,
          inviteCode: inviteCode.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      const { user, group, member } = await res.json();

      // Persist locally
      StorageService.saveRegisteredUser(user);
      const existingGroups = StorageService.getSavedGroups();
      if (!existingGroups.some((g) => g.id === group.id)) {
        StorageService.saveGroups([...existingGroups, group]);
      }
      const existingMembers = StorageService.getSavedMembers();
      if (!existingMembers.some((m) => m.id === member.id)) {
        StorageService.saveMembers([...existingMembers, member]);
      }

      // Circle admins must verify their email before the app unlocks. A
      // returning admin who already verified previously skips straight in.
      const needsVerification = member.role === 'admin' && !user.emailVerified;
      if (needsVerification) {
        setPendingVerification({ user, group, member });
      } else {
        onRegistered(user, group, member);
        if (onClose) onClose();
      }
    } catch (err: any) {
      console.warn('Backend registration failed, using client storage:', err);
      // Fallback: create locally with real data
      const userId = `usr_${Date.now()}`;
      const user = {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      };
      const groupId = `grp_${Date.now()}`;
      const code = inviteCode.trim() || `SAFE-${Math.floor(1000 + Math.random() * 9000)}`;
      const group: Group = {
        id: groupId,
        name: groupName.trim() || `${user.name}'s Circle`,
        category: groupCategory,
        adminId: user.id,
        adminName: user.name,
        adminEmail: user.email,
        inviteCode: code,
        createdAt: Date.now(),
      };
      const member: Member = {
        id: `mem_${user.id}`,
        name: user.name,
        email: user.email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=0284c7,0d9488,059669`,
        role,
        groupId: group.id,
        isConsentGiven: true,
        isSharingLocation: true,
        lastConsentTimestamp: Date.now(),
        isOnline: true,
      };

      StorageService.saveRegisteredUser(user);
      StorageService.saveGroups([group]);
      StorageService.saveMembers([member]);

      onRegistered(user, group, member);
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white my-8">
        {!isInitialRequired && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Real User Registration</h2>
            <p className="text-xs text-slate-400">
              Set up your profile to start real live location sharing and private comms.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Real Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nurul Afsar"
              required
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Real Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@domain.com"
              required
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-left ${
                  role === 'admin'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <div>
                  <div className="font-bold">Circle Admin</div>
                  <div className="text-[10px] text-slate-400">Can create & manage circle</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-left ${
                  role === 'member'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-cyan-400" />
                <div>
                  <div className="font-bold">Member</div>
                  <div className="text-[10px] text-slate-400">Shares location with consent</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Tabs: Create Circle vs Join Circle */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex rounded-xl bg-slate-800/80 p-1 mb-3">
              <button
                type="button"
                onClick={() => setAction('create')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                  action === 'create' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create New Circle
              </button>
              <button
                type="button"
                onClick={() => setAction('join')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                  action === 'join' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Join Existing Circle
              </button>
            </div>

            {action === 'create' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Circle Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Afsar Family, London Dispatch, Field Unit"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={groupCategory}
                    onChange={(e) => setGroupCategory(e.target.value as GroupCategory)}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="family">Family Circle</option>
                    <option value="delivery">Delivery & Fleet</option>
                    <option value="team">Company / Work Team</option>
                    <option value="friends">Friends & Travel</option>
                    <option value="business">Business Operations</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invite Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAFE-8492"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase tracking-wider font-mono placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={agreedConsent}
                onChange={(e) => setAgreedConsent(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I agree to the ConsentKey protocol: my live location will only be shared when I activate consent, and all location telemetry and messages automatically purge within 24 hours.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving Real Profile...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{action === 'create' ? 'Create Circle & Launch Workspace' : 'Join Circle & Launch Workspace'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
