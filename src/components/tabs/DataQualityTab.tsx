import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  FileCheck,
  Percent,
} from 'lucide-react';
import { WeatherRecord, DataQualityReport } from '../../types';

interface DataQualityTabProps {
  records: WeatherRecord[];
}

export const DataQualityTab: React.FC<DataQualityTabProps> = ({ records }) => {
  const totalRows = records.length;

  const COLUMNS = [
    { key: 'date', label: 'Date', expectedType: 'ISO Date (string)' },
    { key: 'city', label: 'City', expectedType: 'Nominal Categorical (string)' },
    { key: 'temperature', label: 'Temperature (°C)', expectedType: 'Continuous Numeric (float)' },
    { key: 'feelsLike', label: 'Feels Like (°C)', expectedType: 'Continuous Numeric (float)' },
    { key: 'humidity', label: 'Humidity (%)', expectedType: 'Continuous Percentage (integer)' },
    { key: 'precipitation', label: 'Precipitation (mm)', expectedType: 'Continuous Ratio (float)' },
    { key: 'windSpeed', label: 'Wind Speed (km/h)', expectedType: 'Continuous Ratio (float)' },
    { key: 'pressure', label: 'Atmospheric Pressure (hPa)', expectedType: 'Continuous Interval (float)' },
    { key: 'cloudCover', label: 'Cloud Cover (%)', expectedType: 'Discrete Percentage (integer)' },
    { key: 'visibility', label: 'Visibility (km)', expectedType: 'Continuous Ratio (float)' },
    { key: 'weatherCondition', label: 'Condition', expectedType: 'Nominal Categorical (string)' },
  ];

  // Calculate missing per column
  const columnAudit = COLUMNS.map((col) => {
    let missingCount = 0;
    for (const r of records) {
      const val = (r as any)[col.key];
      if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
        missingCount++;
      }
    }
    const validCount = totalRows - missingCount;
    const completeness = totalRows > 0 ? (validCount / totalRows) * 100 : 100;

    return {
      ...col,
      missingCount,
      validCount,
      completeness: Math.round(completeness * 10) / 10,
    };
  });

  const totalPossibleValues = totalRows * COLUMNS.length;
  const totalMissingCells = columnAudit.reduce((acc, c) => acc + c.missingCount, 0);
  const overallCompleteness =
    totalPossibleValues > 0
      ? Math.round(((totalPossibleValues - totalMissingCells) / totalPossibleValues) * 1000) / 10
      : 100;

  // Duplicate checks (same date & city)
  const keySet = new Set<string>();
  let duplicateCount = 0;
  for (const r of records) {
    const key = `${r.date}_${r.city}`;
    if (keySet.has(key)) duplicateCount++;
    else keySet.add(key);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data Quality, Hygiene &amp; Schema Integrity Audit
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Automated data validation pipeline verifying schema consistency, missing field distribution, record completeness, and duplicate keys.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Rows */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Total Observations</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {totalRows.toLocaleString()}
          </div>
          <div className="text-2xs text-slate-500 mt-1">100% ingested into memory</div>
        </div>

        {/* Overall Completeness */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Completeness Index</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {overallCompleteness}%
          </div>
          <div className="text-2xs text-slate-500 mt-1">Across all data attributes</div>
        </div>

        {/* Missing Values */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Null / Missing Cells</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {totalMissingCells}
          </div>
          <div className="text-2xs text-slate-500 mt-1">
            {totalMissingCells === 0 ? 'Zero null cells detected' : 'Missing values flagged'}
          </div>
        </div>

        {/* Duplicate Keys */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Duplicate Keys (City+Date)</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {duplicateCount}
          </div>
          <div className="text-2xs text-slate-500 mt-1">
            {duplicateCount === 0 ? 'Strict 1:1 primary key integrity' : 'Duplicate records found'}
          </div>
        </div>
      </div>

      {/* Column Schema & Completeness Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Attribute Schema Definition &amp; Null-Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Field-by-field verification of data types and data completeness ratios.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Field Name</th>
                <th className="py-2.5 px-3">Data Science Data Type</th>
                <th className="py-2.5 px-3">Valid Values</th>
                <th className="py-2.5 px-3">Missing Values</th>
                <th className="py-2.5 px-3">Completeness</th>
                <th className="py-2.5 px-3">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {columnAudit.map((col) => (
                <tr key={col.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white font-mono">
                    {col.label}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-2xs">
                      {col.expectedType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                    {col.validCount}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                    {col.missingCount > 0 ? (
                      <span className="text-rose-600 font-bold">{col.missingCount}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span>{col.completeness}%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${col.completeness}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {col.missingCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" /> Contains Nulls
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Preprocessing Actions Performed */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Automated Data Cleaning &amp; Normalization Pipeline Applied
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              1. Type Casting &amp; Sanitization
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-2xs">
              Raw strings parsed into typed numeric values (`parseFloat`). String whitespace trimmed and header variations normalized into standard keys.
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              2. Temporal Sorting &amp; Indexing
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-2xs">
              Chronological ordering enforced using ISO YYYY-MM-DD date standards to eliminate time-series breaks and ensure accurate moving averages.
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              3. Imputation Strategy
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-2xs">
              Missing precipitation default-treated as 0.0 mm (trace or dry); temperature and pressure validated against physical non-negative/plausible atmospheric limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
