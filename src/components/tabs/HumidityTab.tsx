import React from 'react';
import {
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Activity,
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
  calculatePearsonCorrelation,
} from '../../utils/statistics';

interface HumidityTabProps {
  records: WeatherRecord[];
}

export const HumidityTab: React.FC<HumidityTabProps> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <Droplets className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No humidity records found
        </h3>
      </div>
    );
  }

  const humidities = records.map((r) => r.humidity);
  const temps = records.map((r) => r.temperature);
  const humStats = calculateDescriptiveStats(humidities, 'Humidity');
  const monthlyStats = calculateMonthlyStats(records);
  const histogramBins = calculateHistogram(humidities, 10);
  const tempHumCorr = calculatePearsonCorrelation(temps, humidities, 'Temperature', 'Humidity');

  // Sample data for smooth dual-line chart
  const sampleStep = Math.max(1, Math.floor(records.length / 150));
  const dualAxisData = records.filter((_, i) => i % sampleStep === 0).map((r) => ({
    date: r.date,
    city: r.city,
    humidity: r.humidity,
    temperature: r.temperature,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Average Humidity */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mean Relative Humidity
            </span>
            <Droplets className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {humStats.mean.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Median: {humStats.median.toFixed(1)}%</span>
            <span>SD: ±{humStats.stdDev.toFixed(1)}%</span>
          </div>
        </div>

        {/* Max Humidity */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Maximum Humidity
            </span>
            <ArrowUpRight className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">
            {humStats.max.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Q3: {humStats.q3.toFixed(1)}%</span>
            <span>Near Saturation</span>
          </div>
        </div>

        {/* Min Humidity */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Minimum Humidity
            </span>
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            {humStats.min.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Q1: {humStats.q1.toFixed(1)}%</span>
            <span>Dry Air Period</span>
          </div>
        </div>

        {/* Interquartile Range & Dispersion */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Humidity Spread (IQR)
            </span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {humStats.iqr.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Range: {humStats.range.toFixed(1)}%</span>
            <span>CV: {humStats.cv.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Primary Chart: Dual Axis Comparison Between Humidity and Temperature Over Time */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Dual-Axis Dynamic: Humidity vs. Temperature Over Time
            </h3>
            <p className="text-xs text-slate-500">
              Contrasting atmospheric moisture (%) against thermal energy (°C) showing diurnal and seasonal inverse correlations.
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            Pearson r = <strong>{tempHumCorr.r.toFixed(3)}</strong> ({tempHumCorr.strength})
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dualAxisData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} minTickGap={35} />
              <YAxis
                yAxisId="temp"
                orientation="left"
                unit="°C"
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <YAxis
                yAxisId="hum"
                orientation="right"
                unit="%"
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
              />
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
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="hum"
                type="monotone"
                dataKey="humidity"
                name="Relative Humidity (%)"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Monthly Trend & Frequency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Humidity Trend Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Monthly Mean Relative Humidity Trend
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated monthly humidity percentages across calendar months.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
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
                  dataKey="avgHumidity"
                  name="Monthly Mean Humidity (%)"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Distribution Histogram */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Relative Humidity Distribution (Histogram)
            </h3>
            <p className="text-xs text-slate-500">
              Frequency distribution across 10 discrete humidity percentage bands.
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
                <Bar dataKey="count" name="Observed Days" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
