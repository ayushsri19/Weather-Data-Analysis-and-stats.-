import React from 'react';
import {
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  CloudRain,
  Wind,
  Gauge,
  Database,
  Calendar,
  Building,
  CheckCircle2,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { WeatherRecord } from '../../types';
import {
  calculateDescriptiveStats,
  calculateMonthlyStats,
  calculateCitySummary,
} from '../../utils/statistics';

interface DashboardTabProps {
  records: WeatherRecord[];
  onSelectTab: (tabId: string) => void;
  onSelectCity: (city: string) => void;
}

const CONDITION_COLORS: Record<string, string> = {
  Sunny: '#f59e0b',
  'Partly Cloudy': '#38bdf8',
  Overcast: '#94a3b8',
  Rainy: '#3b82f6',
  Thunderstorm: '#6366f1',
  Foggy: '#cbd5e1',
  Haze: '#d97706',
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  records,
  onSelectTab,
  onSelectCity,
}) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 my-6">
        <Database className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No records match the current filter criteria
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Adjust or reset the filters in the top filter bar to see statistical charts and KPIs.
        </p>
      </div>
    );
  }

  // Calculate descriptive statistics for KPIs
  const tempStats = calculateDescriptiveStats(records.map((r) => r.temperature), 'Temperature');
  const humidityStats = calculateDescriptiveStats(records.map((r) => r.humidity), 'Humidity');
  const rainStats = calculateDescriptiveStats(records.map((r) => r.precipitation), 'Rainfall');
  const windStats = calculateDescriptiveStats(records.map((r) => r.windSpeed), 'Wind Speed');

  const totalRainfall = Math.round(records.reduce((acc, r) => acc + r.precipitation, 0) * 10) / 10;
  const rainyDaysCount = records.filter((r) => r.precipitation > 0.2).length;
  const monthlyData = calculateMonthlyStats(records);
  const citySummaries = calculateCitySummary(records);

  // Weather conditions aggregation for distribution
  const conditionCountMap = new Map<string, number>();
  for (const r of records) {
    const c = r.weatherCondition || 'Other';
    conditionCountMap.set(c, (conditionCountMap.get(c) || 0) + 1);
  }
  const conditionDistribution = Array.from(conditionCountMap.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / records.length) * 100),
  }));

  // Daily sample for trend (if more than 120 records, sample smoothly to keep Recharts snappy)
  const sampleRate = Math.max(1, Math.floor(records.length / 150));
  const trendData = records.filter((_, i) => i % sampleRate === 0).map((r) => ({
    date: r.date,
    city: r.city,
    temp: r.temperature,
    feelsLike: r.feelsLike,
    humidity: r.humidity,
    rain: r.precipitation,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid (8 Core Required Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Average Temperature */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Temperature
            </span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {tempStats.mean.toFixed(1)}°C
            </span>
            <span className="text-xs font-medium text-slate-500">
              Median: {tempStats.median.toFixed(1)}°C
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>SD: ±{tempStats.stdDev.toFixed(1)}°C</span>
            <span>CV: {tempStats.cv}%</span>
          </div>
        </div>

        {/* 2. Maximum Temperature */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Max Temperature
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {tempStats.max.toFixed(1)}°C
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Range: {tempStats.range.toFixed(1)}°C</span>
            <span>Q3 (75%): {tempStats.q3.toFixed(1)}°C</span>
          </div>
        </div>

        {/* 3. Minimum Temperature */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Min Temperature
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {tempStats.min.toFixed(1)}°C
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Q1 (25%): {tempStats.q1.toFixed(1)}°C</span>
            <span>IQR: {tempStats.iqr.toFixed(1)}°C</span>
          </div>
        </div>

        {/* 4. Average Humidity */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Humidity
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {humidityStats.mean.toFixed(1)}%
            </span>
            <span className="text-xs font-medium text-slate-500">
              IQR: {humidityStats.iqr.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Min: {humidityStats.min}%</span>
            <span>Max: {humidityStats.max}%</span>
          </div>
        </div>

        {/* 5. Total Rainfall */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Rainfall
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {totalRainfall.toLocaleString()} mm
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Rainy Days: {rainyDaysCount}</span>
            <span>Daily Max: {rainStats.max} mm</span>
          </div>
        </div>

        {/* 6. Average Wind Speed */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Wind Speed
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {windStats.mean.toFixed(1)} km/h
            </span>
            <span className="text-xs font-medium text-slate-500">
              Median: {windStats.median.toFixed(1)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>SD: ±{windStats.stdDev.toFixed(1)}</span>
            <span>Variance: {windStats.variance.toFixed(1)}</span>
          </div>
        </div>

        {/* 7. Maximum Wind Speed */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Max Wind Speed
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">
              {windStats.max.toFixed(1)} km/h
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Range: {windStats.range.toFixed(1)} km/h</span>
            <span>Q3: {windStats.q3.toFixed(1)} km/h</span>
          </div>
        </div>

        {/* 8. Number of Records */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Observations
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {records.length.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">Rows</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Cities: {citySummaries.length}</span>
            <span>100% Calibrated</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Temperature & Feels Like Trend */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Temperature &amp; Apparent Feels-Like Trend
              </h3>
              <p className="text-xs text-slate-500">
                Continuous chronological progression highlighting seasonal shifts and heat-index divergence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('temperature')}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Deep Dive &rarr;
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} minTickGap={30} />
                <YAxis unit="°C" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
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

        {/* Weather Conditions Distribution */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Weather Conditions
              </h3>
              <p className="text-xs text-slate-500">Categorical frequency distribution</p>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {conditionDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CONDITION_COLORS[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} days`, name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Table */}
          <div className="mt-2 max-h-28 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {conditionDistribution.map((c) => (
              <div key={c.name} className="py-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CONDITION_COLORS[c.name] || '#64748b' }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{c.name}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {c.count} d ({c.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Weather Matrix & Multi-City Comparison Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Temperature & Rainfall Profile */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Thermal &amp; Precipitation Cycle
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated monthly average temperature (°C) vs total monthly rainfall (mm).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('rainfall')}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Rainfall Details &rarr;
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  unit="°C"
                  tick={{ fontSize: 11 }}
                  domain={[0, 45]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="mm"
                  tick={{ fontSize: 11 }}
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
                <Bar
                  yAxisId="left"
                  dataKey="avgTemp"
                  name="Avg Temp (°C)"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalRainfall"
                  name="Total Rain (mm)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Comparison Quick Overview */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Station Comparisons
              </h3>
              <button
                type="button"
                onClick={() => onSelectTab('city-comparison')}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Full Grid &rarr;
              </button>
            </div>
            <div className="space-y-2.5">
              {citySummaries.map((c) => (
                <div
                  key={c.city}
                  onClick={() => onSelectCity(c.city)}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 bg-slate-50/70 dark:bg-slate-800/60 cursor-pointer transition-all hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {c.city}
                    </span>
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-medium">
                      {c.recordCount} records
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-2xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="block text-slate-400">Avg Temp</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {c.avgTemperature}°C
                      </strong>
                    </div>
                    <div>
                      <span className="block text-slate-400">Rainfall</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {c.totalRainfall} mm
                      </strong>
                    </div>
                    <div>
                      <span className="block text-slate-400">Humidity</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {c.avgHumidity}%
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Data Validated
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('statistics')}
              className="text-slate-700 dark:text-slate-300 hover:text-sky-600 font-medium hover:underline"
            >
              View Statistical Formulations &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
