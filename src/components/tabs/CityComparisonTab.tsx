import React, { useState } from 'react';
import {
  Building2,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  BarChart2,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { WeatherRecord } from '../../types';
import { calculateCitySummary } from '../../utils/statistics';

interface CityComparisonTabProps {
  records: WeatherRecord[];
}

export const CityComparisonTab: React.FC<CityComparisonTabProps> = ({ records }) => {
  const citySummaries = calculateCitySummary(records);
  const [selectedMetric, setSelectedMetric] = useState<
    'temperature' | 'rainfall' | 'humidity' | 'wind'
  >('temperature');

  if (citySummaries.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No city records found
        </h3>
      </div>
    );
  }

  // Normalized radar chart comparison for multi-station climate profiling
  const radarData = [
    {
      metric: 'Avg Temp (°C)',
      ...Object.fromEntries(citySummaries.map((c) => [c.city, c.avgTemperature])),
    },
    {
      metric: 'Avg Humidity (%)',
      ...Object.fromEntries(citySummaries.map((c) => [c.city, c.avgHumidity])),
    },
    {
      metric: 'Avg Wind (km/h)',
      ...Object.fromEntries(citySummaries.map((c) => [c.city, c.avgWindSpeed])),
    },
    {
      metric: 'Rainy Days',
      ...Object.fromEntries(citySummaries.map((c) => [c.city, c.rainyDays])),
    },
  ];

  const CITY_COLORS: Record<string, string> = {
    Lucknow: '#f97316',
    Delhi: '#ef4444',
    Mumbai: '#3b82f6',
    Bengaluru: '#10b981',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-City Weather &amp; Climatology Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cross-station comparative analysis across {citySummaries.length} geographic stations.
            </p>
          </div>

          {/* Metric Selector for Primary Comparative Chart */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setSelectedMetric('temperature')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                selectedMetric === 'temperature'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Temperature
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('rainfall')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                selectedMetric === 'rainfall'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Rainfall
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('humidity')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                selectedMetric === 'humidity'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Humidity
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('wind')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                selectedMetric === 'wind'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Wind Speed
            </button>
          </div>
        </div>
      </div>

      {/* Individual City Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {citySummaries.map((c) => {
          const badgeColor = CITY_COLORS[c.city] || '#6366f1';
          return (
            <div
              key={c.city}
              className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-400 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: badgeColor }}
                  />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {c.city}
                  </h3>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {c.recordCount} records
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Avg Temp:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.avgTemperature}°C
                  </span>
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-400">
                  <span>Range:</span>
                  <span>
                    {c.minTemperature}°C to {c.maxTemperature}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" /> Total Rain:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {c.totalRainfall} mm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-teal-500" /> Avg Humidity:
                  </span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {c.avgHumidity}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-emerald-500" /> Avg Wind:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {c.avgWindSpeed} km/h
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-2xs">
                  <span className="text-slate-500">Rainy Days:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {c.rainyDays} days ({c.rainyDaysPercent}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Bar Charts by Selected Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Comparison Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              Station Comparative: {selectedMetric}
            </h3>
            <p className="text-xs text-slate-500">
              Direct station juxtaposition across {selectedMetric} indicators.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === 'temperature' ? (
                <BarChart data={citySummaries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                  <YAxis unit="°C" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="avgTemperature" name="Mean Temp (°C)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="maxTemperature" name="Max Temp (°C)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minTemperature" name="Min Temp (°C)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : selectedMetric === 'rainfall' ? (
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
                  <Bar dataKey="totalRainfall" name="Total Rainfall (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rainyDays" name="Rainy Days Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : selectedMetric === 'humidity' ? (
                <BarChart data={citySummaries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
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
                  <Bar dataKey="avgHumidity" name="Mean Humidity (%)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={citySummaries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} />
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
                  <Bar dataKey="avgWindSpeed" name="Mean Wind Speed (km/h)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Station Climatology Radar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Composite Climate Radar Footprint
            </h3>
            <p className="text-xs text-slate-500">
              Multi-dimensional profile across temperature, humidity, wind, and rainy days.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={80}>
                <PolarGrid opacity={0.3} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {citySummaries.map((c) => (
                  <Radar
                    key={c.city}
                    name={c.city}
                    dataKey={c.city}
                    stroke={CITY_COLORS[c.city] || '#6366f1'}
                    fill={CITY_COLORS[c.city] || '#6366f1'}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table Comparing All Cities */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Comprehensive Inter-City Weather Comparison Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Full tabular benchmark across all recorded atmospheric variables.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3">Records</th>
                <th className="py-2.5 px-3">Mean Temp</th>
                <th className="py-2.5 px-3">Max Temp</th>
                <th className="py-2.5 px-3">Min Temp</th>
                <th className="py-2.5 px-3">Thermal Range</th>
                <th className="py-2.5 px-3">Total Rainfall</th>
                <th className="py-2.5 px-3">Rainy Days</th>
                <th className="py-2.5 px-3">Mean Humidity</th>
                <th className="py-2.5 px-3">Mean Wind</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {citySummaries.map((c) => (
                <tr key={c.city} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CITY_COLORS[c.city] || '#6366f1' }}
                    />
                    {c.city}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                    {c.recordCount}
                  </td>
                  <td className="py-2 px-3 font-semibold text-amber-600 dark:text-amber-400">
                    {c.avgTemperature}°C
                  </td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400 font-medium">
                    {c.maxTemperature}°C
                  </td>
                  <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-medium">
                    {c.minTemperature}°C
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {(c.maxTemperature - c.minTemperature).toFixed(1)}°C
                  </td>
                  <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">
                    {c.totalRainfall} mm
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                    {c.rainyDays} d ({c.rainyDaysPercent}%)
                  </td>
                  <td className="py-2 px-3 text-teal-600 dark:text-teal-400 font-medium">
                    {c.avgHumidity}%
                  </td>
                  <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-medium">
                    {c.avgWindSpeed} km/h
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
