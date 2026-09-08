import React, { useState, useRef, useEffect } from 'react';
import {
  CloudSun,
  Moon,
  Sun,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Info,
  Database,
  BarChart2,
  MoreHorizontal,
  Download,
} from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenUpload: () => void;
  onResetDataset: () => void;
  onExportFilteredCsv: () => void;
  onExportStatsCsv: () => void;
  onOpenReport: () => void;
  onOpenAbout: () => void;
  onSelectTab: (tab: string) => void;
  isCustomDataset: boolean;
  totalRecords: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  onOpenUpload,
  onResetDataset,
  onExportFilteredCsv,
  onExportStatsCsv,
  onOpenReport,
  onOpenAbout,
  onSelectTab,
  isCustomDataset,
  totalRecords,
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Project Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white shadow-xs">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Weather Analytics
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Database className="w-3 h-3 text-sky-500" />
                <span>{totalRecords} records</span>
                {isCustomDataset && <span className="text-sky-600 font-semibold">• Custom</span>}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            {/* Upload CSV */}
            <button
              id="btn-upload-csv"
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>

            {/* Generate Report */}
            <button
              id="btn-generate-report"
              type="button"
              onClick={onOpenReport}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Report</span>
            </button>

            {/* AI Insights CTA */}
            <button
              id="btn-ai-insights-nav"
              type="button"
              onClick={() => onSelectTab('ai-insights')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Insights</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Actions Menu Dropdown (Exports, Reset, About) */}
            <div className="relative" ref={actionsRef}>
              <button
                id="btn-more-actions"
                type="button"
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                title="More Tools & Exports"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isActionsOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-2xs font-semibold text-slate-400 uppercase tracking-wider">
                    Data Export
                  </div>
                  <button
                    id="btn-export-filtered-csv"
                    type="button"
                    onClick={() => {
                      onExportFilteredCsv();
                      setIsActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Export Filtered CSV</span>
                  </button>

                  <button
                    id="btn-export-stats-csv"
                    type="button"
                    onClick={() => {
                      onExportStatsCsv();
                      setIsActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Export Statistics CSV</span>
                  </button>

                  {/* Report in mobile */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReport();
                      setIsActionsOpen(false);
                    }}
                    className="md:hidden w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Generate Project Report</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <div className="px-3 py-1 text-2xs font-semibold text-slate-400 uppercase tracking-wider">
                    Dataset &amp; Info
                  </div>

                  <button
                    id="btn-reset-dataset"
                    type="button"
                    onClick={() => {
                      onResetDataset();
                      setIsActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>Reset to 365-Day Sample</span>
                  </button>

                  <button
                    id="btn-about-project"
                    type="button"
                    onClick={() => {
                      onOpenAbout();
                      setIsActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <Info className="w-4 h-4 text-sky-500" />
                    <span>About Project &amp; Metadata</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
