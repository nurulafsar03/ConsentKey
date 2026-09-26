import React, { useEffect, useState } from 'react';
import { UserCheck, X, Save, Copy, Check, ShieldCheck, Users } from 'lucide-react';
import { Group, GroupCategory, UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string; email: string; role: UserRole };
  group: Group;
  onSaved: (updates: { name: string; group?: Group }) => void;
}

const CATEGORY_OPTIONS: { value: GroupCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'team', label: 'Team' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'business', label: 'Business' },
  { value: 'custom', label: 'Custom' },
];

// "My Circle" — opens PRE-FILLED with the signed-in person's own real
// profile and circle details (never blank), and lets them edit their name
// and — only if they are the circle's admin — the circle's name/category,
// then save the changes back to the server via /api/profile/update.
export const MyCircleModal: React.FC<Props> = ({ isOpen, onClose, user, group, onSaved }) => {
  const { isDark } = useTheme();
  const isAdminOfThisCircle = group.adminId === user.id;

  const [name, setName] = useState(user.name);
  const [groupName, setGroupName] = useState(group.name);
  const [groupCategory, setGroupCategory] = useState<GroupCategory>(group.category);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Re-fill from the latest real data every time the modal is (re)opened,
  // so it never shows stale or blank fields.
  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setGroupName(group.name);
      setGroupCategory(group.category);
      setError(null);
      setSaved(false);
    }
  }, [isOpen, user, group]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(group.inviteCode);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: name.trim(),
          ...(isAdminOfThisCircle
            ? { groupId: group.id, groupName: groupName.trim(), groupCategory }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not save your changes. Please try again.');
        setIsSaving(false);
        return;
      }
      const updatedGroup: Group | undefined = data.group
        ? { ...group, ...data.group }
        : undefined;
      onSaved({ name: name.trim(), group: updatedGroup });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err?.message || 'Network error — please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all max-h-[92vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">My Circle</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your real profile & circle details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Your Profile */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Email
            </label>
            <input
              type="text"
              value={user.email}
              readOnly
              disabled
              className={`w-full px-4 py-2.5 rounded-xl border text-sm cursor-not-allowed opacity-70 ${
                isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Your role:{' '}
              <span className={isAdminOfThisCircle ? 'text-emerald-500' : 'text-cyan-500'}>
                {isAdminOfThisCircle ? 'Admin' : 'Member'}
              </span>{' '}
              of {group.name}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Circle Details
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Circle Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={!isAdminOfThisCircle}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  !isAdminOfThisCircle ? 'cursor-not-allowed opacity-70' : ''
                } ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              {!isAdminOfThisCircle && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Only {group.adminName} (this circle's admin) can rename it.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!isAdminOfThisCircle}
                    onClick={() => setGroupCategory(opt.value)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition ${
                      !isAdminOfThisCircle ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    } ${
                      groupCategory === opt.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Invite Code
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={group.inviteCode}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono ${
                    isDark ? 'bg-slate-800/60 border-slate-700 text-emerald-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Copy invite code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
