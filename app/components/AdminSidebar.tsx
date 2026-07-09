'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, Home, Workflow, Database, Settings, BarChart3, ChevronDown } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Navigation',
    items: [
      { label: 'Dashboard', href: '/admin', icon: <Home className="w-4 h-4" /> },
      { label: 'Metrics', href: '/admin?tab=metrics', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Node Registry', href: '/admin', icon: <Database className="w-4 h-4" /> },
      {
        label: 'Workflows',
        href: '/workflow-builder',
        icon: <Workflow className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Admin',
    items: [{ label: 'Settings', href: '#settings', icon: <Settings className="w-4 h-4" /> }],
  },
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('Navigation');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const isActive = (href: string) => {
    if (href.startsWith('/admin?tab=')) {
      const targetTab = href.split('tab=')[1];
      return pathname === '/admin' && currentTab === targetTab;
    }
    if (href === '/admin') {
      return pathname === '/admin' && currentTab !== 'metrics';
    }
    return pathname === href;
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-900 text-white shadow-lg transition-all duration-300 overflow-y-auto
          ${isCollapsed ? 'w-16' : 'w-60'}
          lg:static lg:translate-x-0
        `}
      >
        <div className="p-6 border-b border-gray-800">
          <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              A
            </div>
            {!isCollapsed && <span className="font-semibold">Admin</span>}
          </div>
        </div>

        <nav className="p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <button
                  onClick={() =>
                    setExpandedSection(expandedSection === section.title ? '' : section.title)
                  }
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors mb-2"
                >
                  {section.title}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      expandedSection === section.title ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

              {!isCollapsed || expandedSection === section.title ? (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs bg-blue-600 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                !isCollapsed && null
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />}
    </>
  );
}
