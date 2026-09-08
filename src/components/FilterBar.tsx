import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Cloud,
  Sliders,
  X,
  ChevronDown,
  Filter as FilterIcon,
  Search,
} from 'lucide-react';
import { FilterState, NumericalVariable } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableCities: string[];
  availableConditions: string[];
  totalRecordsCount: number;
  filteredRecordsCount: number;
}

const VARIABLE_OPTIONS: { value: NumericalVariable; label: string; unit: string }[] = [
  { value: 'temperature', label: 'Temperature', unit: '°C' },
  { value: 'feelsLike', label: 'Feels Like', unit: '°C' },
  { value: 'humidity', label: 'Humidity', unit: '%' },
  { value: 'precipitation', label: 'Precipitation', unit: 'mm' },
  { value: 'windSpeed', label: 'Wind Speed', unit: 'km/h' },
  { value: 'pressure', label: 'Pressure', unit: 'hPa' },
  { value: 'cloudCover', label: 'Cloud Cover', unit: '%' },
  { value: 'visibility', label: 'Visibility', unit: 'km' },
];

const SEASONS = ['All Year', 'Winter', 'Summer', 'Monsoon', 'Post-Monsoon'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableCities,
  availableConditions,
  totalRecordsCount,
  filteredRecordsCount,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Active season detection
  const currentSeason = (() => {
    if (!filters.dateStart && !filters.dateEnd) return 'All Year';
    if (filters.dateStart === '2024-01-01' && filters.dateEnd === '2024-02-29') return 'Winter';
    if (filters.dateStart === '2024-03-01' && filters.dateEnd === '2024-06-30') return 'Summer';
    if (filters.dateStart === '2024-07-01' && filters.dateEnd === '2024-09-30') return 'Monsoon';
    if (filters.dateStart === '2024-10-01' && filters.dateEnd === '2024-11-30') return 'Post-Monsoon';
    return 'Custom';
  })();

  const handleSeasonSelect = (season: string) => {
    if (season === 'Winter') {
      onFilterChange({ dateStart: '2024-01-01', dateEnd: '2024-02-29' });
    } else if (season === 'Summer') {
      onFilterChange({ dateStart: '2024-03-01', dateEnd: '2024-06-30' });
    } else if (season === 'Monsoon') {
      onFilterChange({ dateStart: '2024-07-01', dateEnd: '2024-09-30' });
    } else if (season === 'Post-Monsoon') {
      onFilterChange({ dateStart: '2024-10-01', dateEnd: '2024-11-30' });
    } else {
      onFilterChange({ dateStart: '', dateEnd: '' });
    }
  };

  const isCustomFiltered =
    filters.city !== 'ALL' ||
    filters.dateStart !== '' ||
    filters.dateEnd !== '' ||
    filters.weatherCondition !== 'ALL' ||
    (filters.searchQuery && filters.searchQuery.trim() !== '');

  // Extra active filters count for the "More Filters" toggle
  const extraActiveCount = [
    Boolean(filters.weatherCondition !== 'ALL'),
    Boolean(currentSeason === 'Custom'),
    Boolean(filters.searchQuery && filters.searchQuery.trim() !== ''),
  ].filter(Boolean).length;

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Main Minimal Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Quick Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* City Dropdown */}
            <div className="relative inline-flex items-center">
              <MapPin className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                id="filter-city-select"
                aria-label="Select City"
                value={filters.city}
                onChange={(e) => onFilterChange({ city: e.target.value })}
                className="pl-7 pr-6 py-1 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-hidden transition-colors"
              >
                <option value="ALL">All Cities ({availableCities.length})</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Season Segmented Control */}
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              {SEASONS.map((season) => {
                const isSelected = currentSeason === season;
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => handleSeasonSelect(season)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>

            {/* Variable Quick Focus */}
            <div className="hidden lg:flex items-center">
              <select
                id="filter-variable-select"
                aria-label="Select Target Variable"
                value={filters.selectedVariable}
                onChange={(e) =>
                  onFilterChange({ selectedVariable: e.target.value as NumericalVariable })
                }
                className="py-1 px-2.5 font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-hidden transition-colors"
              >
                {VARIABLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Focus: {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* More Filters Toggle */}
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                isAdvancedOpen || extraActiveCount > 0
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FilterIcon className="w-3 h-3 text-slate-400" />
              <span>More Filters</span>
              {extraActiveCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-2xs font-bold">
                  {extraActiveCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Right: Counter & Reset */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              <strong className="text-slate-800 dark:text-slate-200">{filteredRecordsCount}</strong>
              <span className="mx-0.5">/</span>
              {totalRecordsCount} records
            </span>

            {isCustomFiltered && (
              <button
                id="btn-clear-filters"
                type="button"
                onClick={onResetFilters}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="Reset all filters to default"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {isAdvancedOpen && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in duration-100">
            {/* Date Pickers */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                id="filter-date-start"
                type="date"
                aria-label="From Date"
                value={filters.dateStart}
                onChange={(e) => onFilterChange({ dateStart: e.target.value })}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden"
                placeholder="From"
              />
              <span className="text-slate-400">–</span>
              <input
                id="filter-date-end"
                type="date"
                aria-label="To Date"
                value={filters.dateEnd}
                onChange={(e) => onFilterChange({ dateEnd: e.target.value })}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden"
                placeholder="To"
              />
            </div>

            {/* Condition Dropdown */}
            <div className="relative inline-flex items-center">
              <Cloud className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                id="filter-condition-select"
                aria-label="Filter Weather Condition"
                value={filters.weatherCondition}
                onChange={(e) => onFilterChange({ weatherCondition: e.target.value })}
                className="pl-7 pr-6 py-1 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-hidden transition-colors"
              >
                <option value="ALL">All Conditions</option>
                {availableConditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            {/* Variable on small screens */}
            <div className="lg:hidden relative inline-flex items-center">
              <Sliders className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                aria-label="Select Focus Variable"
                value={filters.selectedVariable}
                onChange={(e) =>
                  onFilterChange({ selectedVariable: e.target.value as NumericalVariable })
                }
                className="pl-7 pr-6 py-1 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-hidden transition-colors"
              >
                {VARIABLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Focus: {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Search Input */}
            <div className="relative inline-flex items-center flex-1 min-w-[140px]">
              <Search className="w-3 h-3 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                placeholder="Search condition or text..."
                className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
