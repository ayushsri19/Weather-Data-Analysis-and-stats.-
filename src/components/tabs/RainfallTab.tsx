import React from 'react';
import {
  CloudRain,
  Droplets,
  Calendar,
  Building,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { WeatherRecord } from '../../types';
import {
  calculateDescriptiveStats,
  calculateMonthlyStats,
  calculateCitySummary,
  calculateHistogram,
} from '../../utils/statistics';

interface RainfallTabProps {
  records: WeatherRecord[];
}

export const RainfallTab: React.FC<RainfallTabProps> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <CloudRain className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No rainfall records found
        </h3>
      </div>
    );
  }

  const rainValues = records.map((r) => r.precipitation);
  const rainStats = calculateDescriptiveStats(rainValues, 'Precipitation');
  const totalRainfall = Math.round(rainValues.reduce((a, b) => a + b, 0) * 10) / 10;
  const rainyDays = records.filter((r) => r.precipitation > 0.2);
  const rainyDaysCount = rainyDays.length;
  const rainyDaysPercent =
    records.length > 0 ? Math.round((rainyDaysCount / records.length) * 1000) / 10 : 0;

  // Wettest single day
  let wettestDay = records[0];
  for (const r of records) {
    if (r.precipitation > wettestDay.precipitation) wettestDay = r;
  }

  const monthlyStats = calculateMonthlyStats(records);
  const citySummaries = calculateCitySummary(records);
  const rainHistogram = calculateHistogram(
    rainValues.filter((r) => r > 0), // Only positive rain days for distribution
    10
  );

  // Daily sample for area chart
  const sampleStep = Math.max(1, Math.floor(records.length / 150));
  const dailyData = records.filter((_, i) => i % sampleStep === 0).map((r) => ({
    date: r.date,
    city: r.city,
    rain: r.precipitation,
  }));

  // Precipitation intensity classification (Meteorological standard)
  const intensityTiers = [
    { label: 'Dry (0 - 0.2 mm)', count: records.filter((r) => r.precipitation <= 0.2).length },
    { label: 'Light (0.2 - 7.5 mm)', count: records.filter((r) => r.precipitation > 0.2 && r.precipitation <= 7.5).length },
    { label: 'Moderate (7.5 - 35.5 mm)', count: records.filter((r) => r.precipitation > 7.5 && r.precipitation <= 35.5).length },
    { label: 'Heavy (> 35.5 mm)', count: records.filter((r) => r.precipitation > 35.5).length },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Rainfall */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Precipitation
            </span>
            <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalRainfall.toLocaleString()} mm
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Daily Mean: {rainStats.mean.toFixed(2)} mm</span>
            <span>N = {records.length}</span>
          </div>
        </div>

        {/* Average on Rainy Days */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mean on Wet Days
            </span>
            <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {rainyDaysCount > 0
              ? (totalRainfall / rainyDaysCount).toFixed(1)
              : '0.0'}{' '}
            mm/day
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Overall Mean: {rainStats.mean.toFixed(1)} mm</span>
            <span>Median: {rainStats.median.toFixed(1)} mm</span>
          </div>
        </div>

        {/* Maximum Daily Rainfall */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Max 24h Downpour
            </span>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {rainStats.max.toFixed(1)} mm
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Date: {wettestDay.date}</span>
            <span>City: {wettestDay.city}</span>
          </div>
        </div>

        {/* Rainy Days Count */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rainy Days (&gt;0.2mm)
            </span>
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {rainyDaysCount} Days
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Frequency: {rainyDaysPercent}%</span>
            <span>Dry: {records.length - rainyDaysCount} d</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Monthly Rainfall Bar Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Monthly Cumulative Precipitation Profile
          </h3>
          <p className="text-xs text-slate-500">
            Total rainfall aggregated across each calendar month showing peak monsoon surges.
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
              <YAxis unit="mm" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="totalRainfall"
                name="Total Rainfall (mm)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="rainyDays"
                name="Rainy Days Count"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Daily Rainfall Area Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Precipitation Events Over Time
          </h3>
          <p className="text-xs text-slate-500">
            Chronological hydrograph tracking individual convective and monsoon storm episodes.
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} minTickGap={35} />
              <YAxis unit="mm" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="rain"
                name="Rainfall (mm)"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: City Comparison & Intensity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Rainy Days Comparison by City */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rainfall &amp; Rainy Days Comparison by Station
            </h3>
            <p className="text-xs text-slate-500">
              Total rainfall (mm) and number of rainy days across analyzed stations.
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={citySummaries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis unit="mm" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="totalRainfall" name="Total Rain (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rainyDays" name="Rainy Days Count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meteorological Intensity Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Rainfall Intensity Stratification
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Classification based on standard meteorological precipitation criteria.
            </p>
            <div className="space-y-3">
              {intensityTiers.map((tier) => {
                const pct = records.length > 0 ? Math.round((tier.count / records.length) * 100) : 0;
                return (
                  <div key={tier.label}>
                    <div className="flex justify-between text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                      <span>{tier.label}</span>
                      <span>
                        {tier.count} days ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-2xs text-slate-500">
            Note: Subcontinent rainfall is characterized by heavy monsoon concentration where a small fraction of days produce the majority of annual precipitation volume.
          </div>
        </div>
      </div>
    </div>
  );
};
