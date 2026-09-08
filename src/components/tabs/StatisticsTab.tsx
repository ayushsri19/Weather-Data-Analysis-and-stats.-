import React, { useState } from 'react';
import {
  Calculator,
  Download,
  Sigma,
  TrendingUp,
  Sliders,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { WeatherRecord, NumericalVariable, DescriptiveStats } from '../../types';
import { calculateDescriptiveStats } from '../../utils/statistics';
import { downloadStatsAsCsv } from '../../utils/exportUtils';

interface StatisticsTabProps {
  records: WeatherRecord[];
  initialVariable?: NumericalVariable;
}

const VARIABLES: { key: NumericalVariable; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'feelsLike', label: 'Feels Like', unit: '°C' },
  { key: 'humidity', label: 'Relative Humidity', unit: '%' },
  { key: 'precipitation', label: 'Precipitation / Rainfall', unit: 'mm' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h' },
  { key: 'pressure', label: 'Atmospheric Pressure', unit: 'hPa' },
  { key: 'cloudCover', label: 'Cloud Cover', unit: '%' },
  { key: 'visibility', label: 'Visibility', unit: 'km' },
];

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  records,
  initialVariable = 'temperature',
}) => {
  const [selectedVar, setSelectedVar] = useState<NumericalVariable>(initialVariable);

  // Calculate statistics for the currently selected variable
  const selectedValues = records.map((r) => Number(r[selectedVar]));
  const currentVarInfo = VARIABLES.find((v) => v.key === selectedVar) || VARIABLES[0];
  const stats = calculateDescriptiveStats(selectedValues, currentVarInfo.label);

  // Calculate stats for all variables for the summary comparison table
  const allStats: DescriptiveStats[] = VARIABLES.map((v) => {
    const vals = records.map((r) => Number(r[v.key]));
    return calculateDescriptiveStats(vals, v.label);
  });

  const formatNum = (val: number, decimals = 2) => {
    if (val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      {/* Header & Variable Switcher */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Descriptive Statistical Analysis &amp; Parameter Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sample size $N = {records.length}$ observations. Evaluated dynamically from current filtered data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadStatsAsCsv(allStats, 'weather_descriptive_statistics.csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Download All Stats (CSV)</span>
          </button>
        </div>

        {/* Variable Selector Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => {
            const isSelected = selectedVar === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setSelectedVar(v.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {v.label} ({v.unit})
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Variable: Detailed Academic Metric Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Statistical Parameters for{' '}
            <span className="text-sky-600 dark:text-sky-400">{currentVarInfo.label}</span> ({currentVarInfo.unit})
          </h3>
          <span className="text-2xs font-mono text-slate-500">
            N = {stats.count} observations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Mean */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Arithmetic Mean (μ)
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {formatNum(stats.mean)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Formula: (1 / N) × Σ xi
            </div>
          </div>

          {/* Median */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Median (50th Percentile)
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {formatNum(stats.median)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Center value of sorted array
            </div>
          </div>

          {/* Mode */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Mode (Most Frequent)
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white truncate">
              {stats.mode.length > 0
                ? `${stats.mode.map((m) => formatNum(m, 1)).join(', ')} ${currentVarInfo.unit}`
                : 'No clear mode'}
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Highest peak in distribution
            </div>
          </div>

          {/* Standard Deviation */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Std. Deviation (σ)
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              ±{formatNum(stats.stdDev)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Formula: √[ Σ (xi - μ)² / (N - 1) ]
            </div>
          </div>

          {/* Variance */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Sample Variance (s²)
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {formatNum(stats.variance)}
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Measure of data spread
            </div>
          </div>

          {/* Range */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Range (Max - Min)
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {formatNum(stats.range)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500 flex justify-between">
              <span>Min: {formatNum(stats.min)}</span>
              <span>Max: {formatNum(stats.max)}</span>
            </div>
          </div>

          {/* Quartiles Q1, Q2, Q3 */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Quartiles (Q1, Q2, Q3)
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Q1: {formatNum(stats.q1)}</span>
              <span>Q2: {formatNum(stats.q2)}</span>
              <span>Q3: {formatNum(stats.q3)}</span>
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              25th, 50th, 75th percentiles
            </div>
          </div>

          {/* IQR */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Interquartile Range (IQR)
            </div>
            <div className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatNum(stats.iqr)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Formula: Q3 - Q1
            </div>
          </div>

          {/* Coefficient of Variation */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Coeff. of Variation (CV)
            </div>
            <div className="mt-1 text-2xl font-bold text-teal-600 dark:text-teal-400">
              {formatNum(stats.cv)}%
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Formula: (σ / μ) × 100%
            </div>
          </div>

          {/* Extrema: Min */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Observed Minimum
            </div>
            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNum(stats.min)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500">
              Lowest recorded observation
            </div>
          </div>

          {/* Extrema: Max */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Observed Maximum
            </div>
            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatNum(stats.max)} {currentVarInfo.unit}
            </div>
            <div className="mt-2 text-2xs text-slate-500">
              Highest recorded observation
            </div>
          </div>

          {/* IQR Bounds (Outlier Thresholds) */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Tukey Outlier Fences
            </div>
            <div className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
              [{(stats.q1 - 1.5 * stats.iqr).toFixed(1)}, {(stats.q3 + 1.5 * stats.iqr).toFixed(1)}]
            </div>
            <div className="mt-2 text-2xs text-slate-500 font-mono">
              Q1 - 1.5×IQR to Q3 + 1.5×IQR
            </div>
          </div>
        </div>
      </div>

      {/* Five-Number Summary Visual Boxplot Representation */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Five-Number Summary &amp; Percentile Distribution
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Visualizing Minimum ({formatNum(stats.min)}), Q1 ({formatNum(stats.q1)}), Median ({formatNum(stats.median)}), Q3 ({formatNum(stats.q3)}), and Maximum ({formatNum(stats.max)}) on relative scale.
        </p>

        {/* Boxplot Diagram */}
        <div className="relative w-full h-20 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 flex items-center">
          {stats.range > 0 ? (
            <div className="relative w-full h-8 flex items-center">
              {/* Whisker line from min to max */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-400 -translate-y-1/2" />

              {/* Min marker */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-1 h-5 bg-slate-600 dark:bg-slate-300 rounded-full" />
                <span className="text-2xs font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">
                  Min {formatNum(stats.min)}
                </span>
              </div>

              {/* IQR Box from Q1 to Q3 */}
              {(() => {
                const q1Percent = Math.max(0, Math.min(100, ((stats.q1 - stats.min) / stats.range) * 100));
                const q3Percent = Math.max(0, Math.min(100, ((stats.q3 - stats.min) / stats.range) * 100));
                const medPercent = Math.max(0, Math.min(100, ((stats.median - stats.min) / stats.range) * 100));
                const boxWidth = Math.max(2, q3Percent - q1Percent);

                return (
                  <>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-7 bg-sky-100 dark:bg-sky-950/80 border-2 border-sky-600 rounded-sm"
                      style={{
                        left: `${q1Percent}%`,
                        width: `${boxWidth}%`,
                      }}
                    />
                    {/* Median bar */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-full z-10"
                      style={{ left: `${medPercent}%` }}
                    />
                  </>
                );
              })()}

              {/* Max marker */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-1 h-5 bg-slate-600 dark:bg-slate-300 rounded-full" />
                <span className="text-2xs font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">
                  Max {formatNum(stats.max)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center w-full text-xs text-slate-400">Zero variance in variable.</div>
          )}
        </div>
      </div>

      {/* Comprehensive Cross-Variable Statistical Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cross-Variable Descriptive Summary Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Comparative descriptive benchmarks across all 8 numeric weather variables.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            N = {records.length} Valid Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3">Mean</th>
                <th className="py-2.5 px-3">Median</th>
                <th className="py-2.5 px-3">Std Dev (σ)</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Min</th>
                <th className="py-2.5 px-3">Max</th>
                <th className="py-2.5 px-3">Range</th>
                <th className="py-2.5 px-3">Q1</th>
                <th className="py-2.5 px-3">Q3</th>
                <th className="py-2.5 px-3">IQR</th>
                <th className="py-2.5 px-3">CV (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allStats.map((s) => (
                <tr
                  key={s.variable}
                  onClick={() => {
                    const match = VARIABLES.find((v) => v.label === s.variable);
                    if (match) setSelectedVar(match.key);
                  }}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    s.variable === currentVarInfo.label ? 'bg-sky-50/50 dark:bg-sky-950/30' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                    {s.variable}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {formatNum(s.mean)}
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                    {formatNum(s.median)}
                  </td>
                  <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">
                    ±{formatNum(s.stdDev)}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {formatNum(s.variance)}
                  </td>
                  <td className="py-2 px-3 text-blue-600 dark:text-blue-400">
                    {formatNum(s.min)}
                  </td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">
                    {formatNum(s.max)}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {formatNum(s.range)}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {formatNum(s.q1)}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {formatNum(s.q3)}
                  </td>
                  <td className="py-2 px-3 font-medium text-indigo-600 dark:text-indigo-400">
                    {formatNum(s.iqr)}
                  </td>
                  <td className="py-2 px-3 text-teal-600 dark:text-teal-400">
                    {formatNum(s.cv)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
