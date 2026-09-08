import React from 'react';
import {
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Snowflake,
  BarChart3,
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
  AreaChart,
  Area,
} from 'recharts';
import { WeatherRecord } from '../../types';
import {
  calculateDescriptiveStats,
  calculateMonthlyStats,
  calculateHistogram,
} from '../../utils/statistics';

interface TemperatureTabProps {
  records: WeatherRecord[];
}

export const TemperatureTab: React.FC<TemperatureTabProps> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <Thermometer className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No records found
        </h3>
        <p className="text-xs text-slate-500 mt-1">Please adjust your filters to view temperature analytics.</p>
      </div>
    );
  }

  const temps = records.map((r) => r.temperature);
  const tempStats = calculateDescriptiveStats(temps, 'Temperature');
  const monthlyStats = calculateMonthlyStats(records);
  const histogramBins = calculateHistogram(temps, 12);

  // Identify highest and lowest temperature records
  let highestDay = records[0];
  let lowestDay = records[0];
  for (const r of records) {
    if (r.temperature > highestDay.temperature) highestDay = r;
    if (r.temperature < lowestDay.temperature) lowestDay = r;
  }

  // Daily sample for snappier Recharts rendering
  const sampleStep = Math.max(1, Math.floor(records.length / 150));
  const dailyData = records.filter((_, i) => i % sampleStep === 0).map((r) => ({
    date: r.date,
    city: r.city,
    temperature: r.temperature,
    feelsLike: r.feelsLike,
    diurnalDiff: Math.round(Math.abs(r.feelsLike - r.temperature) * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Average Temp */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mean Temperature
            </span>
            <Thermometer className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {tempStats.mean.toFixed(1)}°C
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Median: {tempStats.median.toFixed(1)}°C</span>
            <span>SD: ±{tempStats.stdDev.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Max Temp */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Peak Thermal Max
            </span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
            {tempStats.max.toFixed(1)}°C
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Range: {tempStats.range.toFixed(1)}°C</span>
            <span>Q3: {tempStats.q3.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Min Temp */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Peak Thermal Min
            </span>
            <Snowflake className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {tempStats.min.toFixed(1)}°C
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Q1: {tempStats.q1.toFixed(1)}°C</span>
            <span>IQR: {tempStats.iqr.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Thermal Variability */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Variability (CV)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {tempStats.cv.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Variance: {tempStats.variance.toFixed(1)}</span>
            <span>N = {records.length}</span>
          </div>
        </div>
      </div>

      {/* Highest and Lowest Day Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highest Day Card */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500 text-white shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Highest Temperature Record
              </span>
              <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-200">
                {highestDay.date}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {highestDay.city} — {highestDay.temperature.toFixed(1)}°C
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>Feels Like: <strong>{highestDay.feelsLike.toFixed(1)}°C</strong></span>
              <span>Humidity: <strong>{highestDay.humidity}%</strong></span>
              <span>Condition: <strong>{highestDay.weatherCondition}</strong></span>
            </div>
          </div>
        </div>

        {/* Lowest Day Card */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <Snowflake className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Lowest Temperature Record
              </span>
              <span className="text-xs font-mono font-bold text-blue-800 dark:text-blue-200">
                {lowestDay.date}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {lowestDay.city} — {lowestDay.temperature.toFixed(1)}°C
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>Feels Like: <strong>{lowestDay.feelsLike.toFixed(1)}°C</strong></span>
              <span>Humidity: <strong>{lowestDay.humidity}%</strong></span>
              <span>Condition: <strong>{lowestDay.weatherCondition}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 1: Daily Temperature Trend Line Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Temperature Progression &amp; Heat Index
          </h3>
          <p className="text-xs text-slate-500">
            Observed dry-bulb temperature (°C) versus apparent feels-like temperature over time.
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} minTickGap={35} />
              <YAxis unit="°C" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
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
                dataKey="temperature"
                name="Dry-Bulb Temp (°C)"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="feelsLike"
                name="Feels Like (°C)"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Monthly Averages & Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Monthly Average Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Monthly Average Temperature Profile
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated monthly means, maximums, and minimums across calendar months.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                <YAxis unit="°C" tick={{ fontSize: 11 }} domain={[0, 45]} />
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
                  dataKey="avgTemp"
                  name="Monthly Mean (°C)"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="maxTemp"
                  name="Monthly Max (°C)"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="minTemp"
                  name="Monthly Min (°C)"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Temperature Distribution Histogram */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Temperature Frequency Distribution (Histogram)
            </h3>
            <p className="text-xs text-slate-500">
              Frequency distribution across 12 discrete temperature bins (°C).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramBins} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="binLabel" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11 }} name="Days" />
                <Tooltip
                  formatter={(value: any) => [`${value} observations`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Frequency (Days)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
