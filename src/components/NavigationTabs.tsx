import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  CloudSun,
  Calculator,
  Building2,
  Database,
  Sparkles,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  BarChart2,
  Network,
  CalendarDays,
  AlertTriangle,
  Table2,
  ShieldCheck,
  ChevronDown,
  Layers,
  Check,
} from 'lucide-react';

export interface TabDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface TabGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  defaultTab: string;
  subTabs?: TabDefinition[];
}

export const TAB_GROUPS: TabGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    defaultTab: 'dashboard',
  },
  {
    id: 'atmosphere',
    label: 'Atmosphere',
    icon: CloudSun,
    defaultTab: 'temperature',
    subTabs: [
      { id: 'temperature', label: 'Temperature', shortLabel: 'Temp', icon: Thermometer },
      { id: 'rainfall', label: 'Precipitation', shortLabel: 'Rain', icon: CloudRain },
      { id: 'humidity', label: 'Relative Humidity', shortLabel: 'Humidity', icon: Droplets },
      { id: 'wind', label: 'Wind Speed', shortLabel: 'Wind', icon: Wind },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Calculator,
    defaultTab: 'statistics',
    subTabs: [
      { id: 'statistics', label: 'Descriptive Stats', shortLabel: 'Stats', icon: BarChart2 },
      { id: 'correlation', label: 'Correlation Matrix', shortLabel: 'Correlation', icon: Network },
      { id: 'seasonal', label: 'Seasonal Analysis', shortLabel: 'Seasonal', icon: CalendarDays },
      { id: 'outliers', label: 'Outliers (IQR)', shortLabel: 'Outliers', icon: AlertTriangle },
    ],
  },
  {
    id: 'cities',
    label: 'Cities',
    icon: Building2,
    defaultTab: 'city-comparison',
  },
  {
    id: 'dataset',
    label: 'Dataset',
    icon: Database,
    defaultTab: 'explorer',
    subTabs: [
      { id: 'explorer', label: 'Data Explorer', shortLabel: 'Table', icon: Table2 },
      { id: 'data-quality', label: 'Quality & Preprocessing', shortLabel: 'Quality', icon: ShieldCheck },
    ],
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Sparkles,
    badge: 'Gemini',
    defaultTab: 'ai-insights',
  },
];

// Flat list for quick jump dropdown
export const ALL_TABS: TabDefinition[] = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'temperature', label: 'Temperature Analytics', icon: Thermometer },
  { id: 'rainfall', label: 'Precipitation & Rainfall', icon: CloudRain },
  { id: 'humidity', label: 'Relative Humidity', icon: Droplets },
  { id: 'wind', label: 'Wind Speed Dynamics', icon: Wind },
  { id: 'statistics', label: 'Descriptive Statistics', icon: BarChart2 },
  { id: 'correlation', label: 'Correlation Matrix & OLS', icon: Network },
  { id: 'seasonal', label: 'IMD Seasonal Disaggregation', icon: CalendarDays },
  { id: 'outliers', label: 'Tukey IQR Anomaly Detection', icon: AlertTriangle },
  { id: 'city-comparison', label: 'Cross-City Comparative', icon: Building2 },
  { id: 'explorer', label: 'Raw Data Explorer Table', icon: Table2 },
  { id: 'data-quality', label: 'Data Quality & Cleaning', icon: ShieldCheck },
  { id: 'ai-insights', label: 'AI Weather Synthesis', icon: Sparkles, badge: 'Gemini' },
];

interface NavigationTabsProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  // Determine current active group
  const activeGroup = TAB_GROUPS.find((group) => {
    if (group.id === activeTab || group.defaultTab === activeTab) return true;
    return group.subTabs?.some((sub) => sub.id === activeTab);
  }) || TAB_GROUPS[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setIsQuickMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGroupClick = (group: TabGroup) => {
    if (group.subTabs && group.subTabs.length > 0) {
      // If already in this group, keep current tab; otherwise select default
      const currentTabInGroup = group.subTabs.find((s) => s.id === activeTab);
      if (!currentTabInGroup) {
        onSelectTab(group.defaultTab);
      }
    } else {
      onSelectTab(group.defaultTab);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tier 1: Primary Navigation Pillars */}
        <div className="flex items-center justify-between py-1.5 gap-2">
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5" aria-label="Main navigation">
            {TAB_GROUPS.map((group) => {
              const Icon = group.icon;
              const isGroupActive = activeGroup.id === group.id;

              return (
                <button
                  key={group.id}
                  id={`nav-group-${group.id}`}
                  type="button"
                  onClick={() => handleGroupClick(group)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isGroupActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isGroupActive ? 'text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{group.label}</span>
                  {group.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                        isGroupActive
                          ? 'bg-sky-500 text-white'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      }`}
                    >
                      {group.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick View Jump Dropdown */}
          <div className="relative shrink-0" ref={quickMenuRef}>
            <button
              id="btn-quick-view-switcher"
              type="button"
              onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Quick Jump to any of the 13 analysis views"
            >
              <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">All Views (13)</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isQuickMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isQuickMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Direct Jump (All 13 Modules)
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {ALL_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isCurrent = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(tab.id);
                          setIsQuickMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                          isCurrent
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: Inline Sub-Navigation (Rendered only when active group has subTabs) */}
        {activeGroup.subTabs && activeGroup.subTabs.length > 0 && (
          <div className="flex items-center space-x-1.5 py-1.5 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
            <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              {activeGroup.label}:
            </span>
            {activeGroup.subTabs.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeTab === sub.id;

              return (
                <button
                  key={sub.id}
                  id={`tab-sub-${sub.id}`}
                  type="button"
                  onClick={() => onSelectTab(sub.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isSubActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <SubIcon className={`w-3 h-3 ${isSubActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
