import React from 'react';
import { Group, GroupCategory } from '../types';
import {
  Users,
  Plus,
  Heart,
  Building,
  Truck,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  groups: Group[];
  currentGroup: Group;
  onSelectGroup: (group: Group) => void;
  onOpenCreateGroup: () => void;
  onOpenAddMember: () => void;
  memberCountsByGroupId: Record<string, number>;
  isAdmin: boolean;
}

const getCategoryBadge = (category: GroupCategory) => {
  switch (category) {
    case 'family':
      return {
        label: 'Family Circle',
        icon: Heart,
        color: 'text-rose-500 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
        activePill: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
      };
    case 'business':
      return {
        label: 'Business / Corp',
        icon: Building,
        color: 'text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300',
        activePill: 'bg-blue-600 text-white border-blue-600 shadow-sm',
      };
    case 'delivery':
      return {
        label: 'Delivery Fleet',
        icon: Truck,
        color: 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
        activePill: 'bg-amber-600 text-white border-amber-600 shadow-sm',
      };
    case 'friends':
    default:
      return {
        label: 'Friends & Social',
        icon: Sparkles,
        color: 'text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-300',
        activePill: 'bg-purple-600 text-white border-purple-600 shadow-sm',
      };
  }
};

export const GroupSelectorBar: React.FC<Props> = ({
  groups,
  currentGroup,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenAddMember,
  memberCountsByGroupId,
  isAdmin,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-colors mb-6 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white border-slate-200/90'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl border ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Users className="w-4 h-4" />
            </span>
            <h3
              className={`text-sm font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Select Room (Isolated Environments)
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Strict No-Mixing
            </span>
          </div>
          <p
            className={`text-xs mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Family, business, and team members remain completely isolated.
            Choose a room or create a new room.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-quick-create-group"
              onClick={onOpenCreateGroup}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create a Room</span>
            </button>
            <button
              id="btn-quick-add-member"
              onClick={onOpenAddMember}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Group / Room Pills Grid */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {groups.map((grp) => {
          const isSelected = grp.id === currentGroup.id;
          const badge = getCategoryBadge(grp.category);
          const Icon = badge.icon;
          const count = memberCountsByGroupId[grp.id] || 0;

          return (
            <button
              key={grp.id}
              id={`btn-select-group-${grp.id}`}
              onClick={() => onSelectGroup(grp)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                  : isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : isDark
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="leading-snug truncate max-w-[140px] sm:max-w-[170px]">
                  {grp.name}
                </div>
                <div
                  className={`text-[10px] font-medium flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-emerald-100'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  <span className="capitalize">{grp.category}</span>
                  <span>•</span>
                  <span>
                    {count} {count === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
