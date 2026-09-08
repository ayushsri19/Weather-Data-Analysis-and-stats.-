import React from 'react';
import {
  CalendarDays,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  Sun,
  Snowflake,
  CloudLightning,
  Leaf,
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
} from 'recharts';
import { WeatherRecord } from '../../types';
import { calculateSeasonalStats } from '../../utils/statistics';

interface SeasonalTabProps {
  records: WeatherRecord[];
}

const SEASON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Winter: Snowflake,
  Summer: Sun,
  Monsoon: CloudLightning,
  'Post-Monsoon': Leaf,
};

const SEASON_COLORS: Record<string, string> = {
  Winter: '#38bdf8',
  Summer: '#f97316',
  Monsoon: '#3b82f6',
  'Post-Monsoon': '#10b981',
};

export const SeasonalTab: React.FC<SeasonalTabProps> = ({ records }) => {
  const seasonalStats = calculateSeasonalStats(records);

  if (seasonalStats.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <CalendarDays className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No records available for seasonal analysis
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Seasonal Climatology &amp; Quarterly Weather Patterns
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Stratification according to the Indian Meteorological Department (IMD) seasonal classification: Winter (Dec–Feb), Summer (Mar–Jun), Monsoon (Jul–Sep), and Post-Monsoon (Oct–Nov).
        </p>
      </div>

      {/* 4 Season Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasonalStats.map((s) => {
          const Icon = SEASON_ICONS[s.season] || CalendarDays;
          const color = SEASON_COLORS[s.season] || '#6366f1';

          return (
            <div
              key={s.season}
              className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-sky-400 transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg text-white shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.season}
                      </h3>
                      <span className="text-2xs text-slate-400">{s.months}</span>
                    </div>
                  </div>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {s.recordCount} d
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Avg Temperature:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.avgTemp}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-blue-500" /> Total Rainfall:
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {s.totalRainfall} mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-teal-500" /> Avg Humidity:
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {s.avgHumidity}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-emerald-500" /> Avg Wind Speed:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {s.avgWindSpeed} km/h
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs text-slate-500">
                <span>Rainy Days:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {s.rainyDays} days ({s.recordCount > 0 ? Math.round((s.rainyDays / s.recordCount) * 100) : 0}%)
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Seasonal Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasonal Thermal & Moisture Comparison Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Seasonal Temperature vs. Humidity Profile
            </h3>
            <p className="text-xs text-slate-500">
              Contrasting mean temperature (°C) and relative humidity (%) across seasons.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="avgTemp" name="Mean Temp (°C)" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgHumidity" name="Mean Humidity (%)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Rainfall & Rainy Days Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Seasonal Rainfall &amp; Precipitation Days
            </h3>
            <p className="text-xs text-slate-500">
              Total rainfall volume (mm) and number of rainy days recorded per season.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="season" tick={{ fontSize: 11 }} />
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
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
