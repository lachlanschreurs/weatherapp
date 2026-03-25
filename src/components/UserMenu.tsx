import { useState, useEffect, useRef } from 'react';
import { User as UserIcon, LogOut, Settings, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserMenuProps {
  user: User;
  onSignOut: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-gray-800 hidden sm:block">{userName}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-800">{userName}</p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
          </div>

          <button
            onClick={onSignOut}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
