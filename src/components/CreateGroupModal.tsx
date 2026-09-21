import React, { useState } from 'react';
import { Group, GroupCategory } from '../types';
import { Users, X, Plus, Shield, Sparkles, Building, Heart, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: Group) => void;
  adminName: string;
  adminEmail: string;
}

export const CreateGroupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreateGroup,
  adminName,
  adminEmail,
}) => {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroupCategory>('family');
  const [customInviteCode, setCustomInviteCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedCode =
      customInviteCode.trim().toUpperCase() ||
      `${category.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      name: name.trim(),
      category,
      adminId: 'admin_user',
      adminName: adminName || 'Sarah Jenkins',
      adminEmail: adminEmail || 'admin@family.org',
      inviteCode: generatedCode,
      createdAt: Date.now(),
    };

    onCreateGroup(newGroup);
    setName('');
    setCustomInviteCode('');
    onClose();
  };

  const categories: { key: GroupCategory; label: string; icon: any; desc: string }[] = [
    { key: 'family', label: 'Family Circle', icon: Heart, desc: 'For parents, children, and elderly relatives' },
    { key: 'business', label: 'Business & Office', icon: Building, desc: 'Corporate teams, branches, and client escorts' },
    { key: 'delivery', label: 'Field & Logistics', icon: Sparkles, desc: 'Drivers, dispatchers, and mobile staff' },
    { key: 'friends', label: 'Friends & Travel', icon: Users, desc: 'Weekend trips, gatherings, and festivals' },
    { key: 'team', label: 'Field Technicians', icon: UserCheck, desc: 'Engineers, surveyors, and onsite workers' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Create a Room</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Independent room with its own isolated members
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. London Operations, Family Lounge, Field Team..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Category (Prevents Mix)
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-950/50 border-emerald-500 text-white'
                          : 'bg-emerald-50 border-emerald-500 text-slate-900'
                        : isDark
                          ? 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : isDark
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">{cat.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Custom Invite Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. SAFE-9921 (Leave blank to auto-generate)"
              value={customInviteCode}
              onChange={(e) => setCustomInviteCode(e.target.value.toUpperCase())}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

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
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
