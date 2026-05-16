import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Bell, User, Settings, LogOut, 
  Menu, Moon, Sun, Sparkles, Command
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

/**
 * 🖥️ Retro Desktop Topbar
 * Global navigation and utility bar for desktop views.
 */
export default function RetroDesktopTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  return (
    <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-base-cream/50 backdrop-blur-md border-b-4 border-base-black sticky top-0 z-40">
      {/* Left Side: Search / Breadcrumb Placeholder */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-sm group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 h-4 text-base-black/40 group-focus-within:text-retro-orange transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-12 py-2 bg-base-white border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none focus:ring-4 focus:ring-retro-orange/20 focus:border-retro-orange transition-all placeholder:text-base-black/30"
            placeholder="Quick search... (Ctrl + /)"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black text-[8px] font-retro-mono text-base-black/50">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Center: System Status / Branding */}
      <div className="flex items-center gap-2">
        <motion.div 
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="p-1.5 rounded-retro bg-retro-orange/10 border-2 border-retro-orange"
        >
          <Sparkles className="w-4 h-4 text-retro-orange" />
        </motion.div>
        <span className="font-retro-display font-black text-xs uppercase tracking-widest text-base-black">
          RPL Smart <span className="text-retro-orange">System</span>
        </span>
      </div>

      {/* Right Side: Utilities & Profile */}
      <div className="flex items-center gap-4 w-1/3 justify-end">
        {/* Notifications */}
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 rounded-retro border-2 border-base-black bg-base-white hover:bg-retro-yellow/20 transition-all"
        >
          <Bell className="w-4 h-4 text-base-black" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-danger border-2 border-base-black rounded-full" />
        </motion.button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Vertical Divider */}
        <div className="h-8 w-1 bg-base-black/10 rounded-full mx-1" />

        {/* User Profile Dropdown Placeholder */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden xl:block">
            <p className="font-retro-display font-black text-xs text-base-black uppercase leading-tight">
              {user?.name || 'Admin User'}
            </p>
            <p className="font-retro-mono text-[9px] text-base-black/50 uppercase tracking-tighter">
              {user?.role || 'Administrator'}
            </p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -3 }}
            className="w-10 h-10 retro-card bg-retro-blue border-2 border-base-black flex items-center justify-center shadow-[2px_2px_0px_0px_#111111] cursor-pointer"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-base-white" />
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
}
