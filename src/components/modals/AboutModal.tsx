import React from 'react';
import {
  GraduationCap,
  X,
  BookOpen,
  Code2,
  Database,
  Cpu,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                About this Project &amp; Academic Methodology
              </h3>
              <p className="text-2xs text-slate-500">
                Fundamentals of Data Science and Analytics Group Project
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Objective */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <BookOpen className="w-4 h-4 text-sky-600" /> Project Objectives
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              The purpose of this college-level Data Science project is to demonstrate real-world meteorological data acquisition, data cleaning, exploratory data analysis (EDA), rigorous descriptive statistics, multivariate correlation, seasonal stratification, Tukey IQR anomaly detection, and AI-assisted scientific synthesis.
            </p>
          </div>

          {/* Mathematical & Statistical Engine */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <Code2 className="w-4 h-4 text-indigo-600" /> Statistical Formulations
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-2xs text-slate-600 dark:text-slate-400 font-mono">
              <li><strong>Arithmetic Mean:</strong> x̄ = (1 / N) Σ xi</li>
              <li><strong>Sample Variance:</strong> s² = (1 / [N-1]) Σ (xi - x̄)²</li>
              <li><strong>Standard Deviation:</strong> s = √(s²)</li>
              <li><strong>Interquartile Range:</strong> IQR = Q3 - Q1</li>
              <li><strong>Pearson Correlation:</strong> r = Σ[(x - x̄)(y - ȳ)] / √[Σ(x - x̄)² Σ(y - ȳ)²]</li>
              <li><strong>Tukey Fences:</strong> [Lower = Q1 - 1.5×IQR, Upper = Q3 + 1.5×IQR]</li>
            </ul>
          </div>

          {/* Dataset Details */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <Database className="w-4 h-4 text-emerald-600" /> Dataset Specification
            </h4>
            <p className="text-2xs text-slate-600 dark:text-slate-400">
              The built-in sample contains 365 continuous daily records covering a full annual cycle (Jan 1, 2024 – Dec 31, 2024) across Lucknow, Delhi, Mumbai, and Bengaluru. Realistic meteorological physics are calibrated, such as peak summer heat in May–June, monsoon storm surges in July–September, high coastal humidity in Mumbai, and moderate plateau temperatures in Bengaluru.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Cpu className="w-4 h-4 text-cyan-600" /> Technology Stack
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                React 18 + Vite
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                TypeScript
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                Recharts Library
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                Tailwind CSS
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                Node.js / Express
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                Google Gemini API
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                PapaParse Engine
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-center font-medium">
                Lucide Vector Icons
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
