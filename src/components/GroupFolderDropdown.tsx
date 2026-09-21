import React, { useState, useRef, useEffect } from 'react';
import { Group, GroupCategory } from '../types';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  Plus,
  Users,
  Building,
  Heart,
  Truck,
  Sparkles,
  Check,
  ShieldCheck,
  Sparkle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  groups: Group[];
  currentGroup: Group;
  onSelectGroup: (group: Group) => void;
  onOpenCreateGroup: () => void;
  memberCountsByGroupId: Record<string, number>;
}

const getCategoryIcon = (category: GroupCategory) => {
  switch (category) {
    case 'family':
      return Heart;
    case 'business':
      return Building;
    case 'delivery':
      return Truck;
    case 'friends':
    default:
      return Users;
  }
};

export const GroupFolderDropdown: React.FC<Props> = ({
  groups,
  currentGroup,
  onSelectGroup,
  onOpenCreateGroup,
  memberCountsByGroupId,
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CurrentIcon = getCategoryIcon(currentGroup.category);

  return (
    <div ref={dropdownRef} className="relative z-30 inline-block text-left w-full sm:w-auto">
      {/* Trigger Button: Folder style */}
      <div className="flex items-center gap-2">
        <button
          id="btn-group-folder-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer ${
            isOpen
              ? isDark
                ? 'bg-slate-800 border-emerald-500/60 text-white ring-2 ring-emerald-500/20'
                : 'bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/20'
              : isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-100 hover:border-slate-600'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl border flex items-center justify-center transition ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              {isOpen ? <FolderOpen className="w-4 h-4 text-emerald-500" /> : <Folder className="w-4 h-4 text-emerald-500" />}
            </span>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 leading-none mb-0.5">
                Room Folder
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold truncate max-w-[160px] sm:max-w-[220px]">
                  {currentGroup.name}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {memberCountsByGroupId[currentGroup.id] || 0} members
                </span>
              </div>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 ml-1 transition-transform duration-200 text-slate-400 ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </button>

        {/* Create Room Button next to folder */}
        <button
          id="btn-admin-create-group-direct"
          onClick={onOpenCreateGroup}
          className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/25 cursor-pointer whitespace-nowrap"
          title="Create a new isolated room"
        >
          <Plus className="w-4 h-4" />
          <span>Create a Room</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-3xl border shadow-2xl p-2.5 backdrop-blur-xl animate-fadeIn ${
            isDark
              ? 'bg-slate-900/98 border-slate-700 text-white shadow-slate-950/80'
              : 'bg-white/98 border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Header info */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Folder className="w-3.5 h-3.5 text-emerald-500" />
              <span>Your Admin Rooms ({groups.length})</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              Strictly Isolated
            </span>
          </div>

          {/* List of Groups / Rooms inside folder */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {groups.map((g) => {
              const isSelected = g.id === currentGroup.id;
              const Icon = getCategoryIcon(g.category);
              const count = memberCountsByGroupId[g.id] || 0;

              return (
                <button
                  key={g.id}
                  onClick={() => {
                    onSelectGroup(g);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                      : isDark
                        ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-800/60 text-slate-200 hover:border-slate-700'
                        : 'bg-slate-50/60 hover:bg-slate-100 border-slate-100 text-slate-700 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isDark
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="font-bold text-xs sm:text-sm truncate">{g.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize">{g.category}</span>
                        <span>•</span>
                        <span>Code: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{g.inviteCode}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {count} {count === 1 ? 'member' : 'members'}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer inside dropdown: Create New Group */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateGroup();
              }}
              className={`w-full py-2.5 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60 text-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>+ Create a Room</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
