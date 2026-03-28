"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "萬象儀表板", icon: "◈" },
  { href: "/trend", label: "趨勢分析", icon: "◇" },
  { href: "/interpret", label: "AI 解讀器", icon: "◉" },
  { href: "/compass", label: "萬象羅盤", icon: "◎" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0D0D1A 0%, #080814 100%)',
        borderRight: '1px solid rgba(0, 212, 255, 0.08)'
      }}
    >
      {/* Logo */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-lg"
            style={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #FF006E 100%)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
            }}
          >
            <span className="text-white font-bold" style={{ fontFamily: 'var(--font-mono)' }}>象</span>
          </div>
          <div>
            <div 
              className="text-lg font-semibold tracking-wider"
              style={{ color: '#E0E0E0', letterSpacing: '0.2em' }}
            >
              萬象
            </div>
            <div 
              className="text-xs"
              style={{ color: '#666680', letterSpacing: '0.1em' }}
            >
              FATEXI v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mx-6 mb-6 px-4 py-3 rounded-lg" style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#00FF88' }} />
          <span className="text-xs" style={{ color: '#666680' }}>系統狀態</span>
        </div>
        <div className="text-sm font-medium" style={{ color: '#00FF88', fontFamily: 'var(--font-mono)' }}>
          LIVE · 即時更新
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent',
                  color: isActive ? '#00D4FF' : '#666680'
                }}
              >
                <span className="text-lg" style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div 
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: '#00D4FF', boxShadow: '0 0 8px rgba(0, 212, 255, 0.8)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-6 py-6" style={{ borderTop: '1px solid rgba(0, 212, 255, 0.05)' }}>
        <div className="text-xs" style={{ color: '#666680', lineHeight: 1.8 }}>
          <div>命的形狀，萬象承載</div>
          <div className="mt-1" style={{ color: '#444460' }}>© 2026 Fatexi</div>
        </div>
      </div>
    </aside>
  );
}
