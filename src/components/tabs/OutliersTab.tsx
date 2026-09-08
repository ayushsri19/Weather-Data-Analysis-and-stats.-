import React, { useState } from 'react';
import {
  AlertTriangle,
  Sliders,
  Filter,
  CheckCircle2,
  Info,
  Download,
} from 'lucide-react';
import { WeatherRecord, NumericalVariable } from '../../types';
import { detectOutliersTukey } from '../../utils/statistics';
import { downloadRecordsAsCsv } from '../../utils/exportUtils';

interface OutliersTabProps {
  records: WeatherRecord[];
}

const OUTLIER_VARIABLES: { key: NumericalVariable; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'precipitation', label: 'Rainfall / Precipitation', unit: 'mm' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h' },
  { key: 'humidity', label: 'Relative Humidity', unit: '%' },
  { key: 'pressure', label: 'Atmospheric Pressure', unit: 'hPa' },
];

export const OutliersTab: React.FC<OutliersTabProps> = ({ records }) => {
  const [selectedVar, setSelectedVar] = useState<NumericalVariable>('temperature');

  // Detect outliers for selected variable
  const currentVarInfo = OUTLIER_VARIABLES.find((v) => v.key === selectedVar) || OUTLIER_VARIABLES[0];
  const outlierResult = detectOutliersTukey(records, selectedVar, currentVarInfo.label);

  // Detect outliers across all 5 key variables for summary
  const allOutlierResults = OUTLIER_VARIABLES.map((v) =>
    detectOutliersTukey(records, v.key, v.label)
  );

  const totalAllOutliersCount = allOutlierResults.reduce(
    (sum, res) => sum + res.outliers.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Statistical Outlier Detection (Tukey&apos;s IQR Method)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Data Science anomaly identification using standard Interquartile Range fences: [Q1 - 1.5 × IQR, Q3 + 1.5 × IQR].
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {totalAllOutliersCount} Total Anomalies Flagged
            </span>
          </div>
        </div>

        {/* Variable Switcher */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {OUTLIER_VARIABLES.map((v) => {
            const isSelected = selectedVar === v.key;
            const res = allOutlierResults.find((r) => r.variable === v.label);
            const count = res?.outliers.length || 0;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setSelectedVar(v.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{v.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tukey Math & Threshold Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Q1 (25th Percentile)</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {outlierResult.q1.toFixed(1)} {currentVarInfo.unit}
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Q3 (75th Percentile)</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {outlierResult.q3.toFixed(1)} {currentVarInfo.unit}
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">IQR (Q3 - Q1)</span>
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {outlierResult.iqr.toFixed(1)} {currentVarInfo.unit}
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Lower Fence</span>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
            {outlierResult.lowerFence.toFixed(1)} {currentVarInfo.unit}
          </div>
          <div className="text-2xs text-slate-400">Q1 - 1.5×IQR</div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Upper Fence</span>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
            {outlierResult.upperFence.toFixed(1)} {currentVarInfo.unit}
          </div>
          <div className="text-2xs text-slate-400">Q3 + 1.5×IQR</div>
        </div>
      </div>

      {/* Outliers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Detected Outliers for {currentVarInfo.label}
            </h3>
            <p className="text-xs text-slate-500">
              {outlierResult.outliers.length} records exceed standard Tukey statistical fences.
            </p>
          </div>
          {outlierResult.outliers.length > 0 && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {((outlierResult.outliers.length / records.length) * 100).toFixed(1)}% of observations
            </span>
          )}
        </div>

        {outlierResult.outliers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Outliers Detected in {currentVarInfo.label}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              All records fall safely within the Tukey range [{outlierResult.lowerFence.toFixed(1)}, {outlierResult.upperFence.toFixed(1)}].
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Variable</th>
                  <th className="py-2.5 px-3">Recorded Value</th>
                  <th className="py-2.5 px-3">Threshold Exceeded</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Physical Weather Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outlierResult.outliers.map((o) => (
                  <tr key={o.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {o.date}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                      {o.city}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {o.variable}
                    </td>
                    <td className="py-2 px-3 font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {o.value} {currentVarInfo.unit}
                    </td>
                    <td className="py-2 px-3 font-mono text-2xs text-slate-500">
                      {o.boundExceeded === 'UPPER'
                        ? `> Upper Fence (${outlierResult.upperFence.toFixed(1)})`
                        : `< Lower Fence (${outlierResult.lowerFence.toFixed(1)})`}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          o.classification.includes('Extreme')
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {o.classification}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-2xs text-slate-600 dark:text-slate-300 max-w-xs">
                      {o.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Academic Methodology Context Note */}
      <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-slate-900 dark:text-white mb-1">
            Why Weather Outliers Are Statistically Legitimate (Non-Errors):
          </strong>
          In standard industrial data cleaning, outliers are often discarded as measurement errors. However, in atmospheric and climatological data science, extreme values represent real critical meteorological phenomena — such as severe heatwaves, convective cloudbursts, squall lines, and winter western disturbance inversions. Robust non-parametric methods like Tukey&apos;s IQR identify these events without assuming a Gaussian (normal) distribution.
        </div>
      </div>
    </div>
  );
};
