'use client';

import React from 'react';
import {
  Layers,
  ShieldCheck,
  Coins,
  Bell,
  Database,
  Building2,
  LogOut,
  Globe2,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  mode: 'member' | 'operator';
  setMode: (mode: 'member' | 'operator') => void;
  activeView: string;
  setActiveView: (view: string) => void;
  creditBalance: number;
  cloudConnected: boolean;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onViewBrochure: () => void;
}

export function Header({
  mode,
  setMode,
  creditBalance,
  cloudConnected,
  unreadCount,
  onOpenNotifications,
  onLogout,
  onViewBrochure
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-4">
            <div
              onClick={onViewBrochure}
              className="flex items-center space-x-2 cursor-pointer group"
              title="Return to Public Overview"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-black tracking-widest text-white text-lg shadow-sm group-hover:bg-blue-500 transition-colors">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-white">MAQE</span>
                  <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">v1.1</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Engineering Intelligence Platform</p>
              </div>
            </div>

            {/* Cloud Database Status Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <Database className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              <span>{cloudConnected ? 'Cloud MariaDB Live' : 'Local Standby'}</span>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('member')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'member'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Member Platform</span>
              </div>
            </button>
            <button
              onClick={() => setMode('operator')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'operator'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Operator Console</span>
              </div>
            </button>
          </div>

          {/* Right Org / Credits / Alerts / Logout */}
          <div className="flex items-center space-x-3">
            {/* Credit Allowance Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg">
              <Coins className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">{creditBalance} Credits</div>
                <div className="text-[10px] text-slate-400">Premium Tier</div>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>

            {/* View Brochure Link */}
            <button
              onClick={onViewBrochure}
              className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Platform Overview"
            >
              <Globe2 className="w-3.5 h-3.5 mr-1" />
              Overview
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 border border-rose-900/60 rounded-lg transition-colors"
              title="Lock and Log Out"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Lock
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
