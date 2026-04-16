import { useState, useEffect, useRef } from 'react';
import { User as UserIcon, LogOut, ChevronDown, Shield, Mail } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface UserMenuProps {
  user: User;
  onSignOut: () => void;
  isAdmin?: boolean;
  onAdminPanelToggle?: () => void;
}

export function UserMenu({ user, onSignOut, isAdmin = false, onAdminPanelToggle }: UserMenuProps) {
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
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>

          {isAdmin && onAdminPanelToggle && (
            <button
              onClick={() => {
                onAdminPanelToggle();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 text-green-700"
            >
              <Shield className="w-4 h-4" />
              <span className="font-medium">Admin Panel</span>
            </button>
          )}

          <div className="border-t border-gray-200 mt-1 pt-1">
            <a
              href="mailto:support@farmcastweather.com"
              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-600 block"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <div>
                <span className="font-medium text-sm block">Contact Us</span>
                <span className="text-xs text-gray-400">support@farmcastweather.com</span>
              </div>
            </a>
          </div>

          <div className="border-t border-gray-100">
            <button
              onClick={onSignOut}
              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
