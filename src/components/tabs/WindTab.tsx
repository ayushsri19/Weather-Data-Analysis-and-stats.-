import React from 'react';
import {
  Wind,
  Gauge,
  Compass,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { WeatherRecord } from '../../types';
import {
  calculateDescriptiveStats,
  calculateMonthlyStats,
  calculateHistogram,
} from '../../utils/statistics';

interface WindTabProps {
  records: WeatherRecord[];
}

export const WindTab: React.FC<WindTabProps> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <Wind className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No wind records found
        </h3>
      </div>
    );
  }

  const windValues = records.map((r) => r.windSpeed);
  const windStats = calculateDescriptiveStats(windValues, 'Wind Speed');
  const monthlyStats = calculateMonthlyStats(records);
  const histogramBins = calculateHistogram(windValues, 10);

  // Sample data for trend line
  const sampleStep = Math.max(1, Math.floor(records.length / 150));
  const dailyData = records.filter((_, i) => i % sampleStep === 0).map((r) => ({
    date: r.date,
    city: r.city,
    windSpeed: r.windSpeed,
  }));

  // Beaufort Wind Scale Categorization
  const beaufortTiers = [
    { label: 'Calm & Light Air (< 6 km/h)', count: records.filter((r) => r.windSpeed < 6).length },
    { label: 'Light Breeze (6 – 11 km/h)', count: records.filter((r) => r.windSpeed >= 6 && r.windSpeed < 12).length },
    { label: 'Gentle Breeze (12 – 19 km/h)', count: records.filter((r) => r.windSpeed >= 12 && r.windSpeed < 20).length },
    { label: 'Moderate Breeze (20 – 28 km/h)', count: records.filter((r) => r.windSpeed >= 20 && r.windSpeed < 29).length },
    { label: 'Fresh / Strong (> 28 km/h)', count: records.filter((r) => r.windSpeed >= 29).length },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Average Wind Speed */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mean Wind Speed
            </span>
            <Wind className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {windStats.mean.toFixed(1)} km/h
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Median: {windStats.median.toFixed(1)} km/h</span>
            <span>SD: ±{windStats.stdDev.toFixed(1)}</span>
          </div>
        </div>

        {/* Max Wind Speed */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Maximum Wind Gust
            </span>
            <Gauge className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            {windStats.max.toFixed(1)} km/h
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Range: {windStats.range.toFixed(1)} km/h</span>
            <span>Q3: {windStats.q3.toFixed(1)} km/h</span>
          </div>
        </div>

        {/* Minimum Wind Speed */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Minimum Wind Speed
            </span>
            <Compass className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">
            {windStats.min.toFixed(1)} km/h
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Q1: {windStats.q1.toFixed(1)} km/h</span>
            <span>Calm Baselines</span>
          </div>
        </div>

        {/* Spread / IQR */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Wind Dispersion (IQR)
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {windStats.iqr.toFixed(1)} km/h
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Variance: {windStats.variance.toFixed(1)}</span>
            <span>CV: {windStats.cv.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Daily Wind Speed Trend Line Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Wind Speed Velocity Profile (km/h)
          </h3>
          <p className="text-xs text-slate-500">
            Continuous anemometer velocity records over time, capturing convective bursts and synoptic pressure gradients.
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} minTickGap={35} />
              <YAxis unit="km/h" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="windSpeed"
                name="Wind Speed (km/h)"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Monthly Wind Speed & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Wind Speed Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Monthly Average Wind Speed Profile
            </h3>
            <p className="text-xs text-slate-500">
              Mean atmospheric circulation velocity across calendar months.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                <YAxis unit="km/h" tick={{ fontSize: 11 }} />
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
                  dataKey="avgWindSpeed"
                  name="Monthly Avg Wind (km/h)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wind Speed Distribution Histogram */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Wind Speed Velocity Distribution (Histogram)
            </h3>
            <p className="text-xs text-slate-500">
              Frequency distribution across 10 wind velocity classes (km/h).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramBins} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="binLabel" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} days`, 'Frequency']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Frequency (Days)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Beaufort Scale Breakdown */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Beaufort Empirical Wind Force Classification
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Atmospheric circulation intensity categorized according to World Meteorological Organization wind scale standards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {beaufortTiers.map((b) => {
            const pct = records.length > 0 ? Math.round((b.count / records.length) * 100) : 0;
            return (
              <div
                key={b.label}
                className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="text-2xs font-semibold text-slate-500 dark:text-slate-400">
                  {b.label}
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {b.count} <span className="text-xs font-normal text-slate-400">days</span>
                </div>
                <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {pct}% of dataset
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
