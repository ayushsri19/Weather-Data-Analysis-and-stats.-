import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { WeatherRecord } from '../../types';
import { downloadRecordsAsCsv } from '../../utils/exportUtils';

interface DataExplorerTabProps {
  records: WeatherRecord[];
  onResetFilters: () => void;
}

type SortKey = keyof WeatherRecord;
type SortDirection = 'asc' | 'desc';

export const DataExplorerTab: React.FC<DataExplorerTabProps> = ({ records, onResetFilters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Search filter
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        r.city.toLowerCase().includes(term) ||
        r.date.includes(term) ||
        r.weatherCondition.toLowerCase().includes(term) ||
        String(r.temperature).includes(term)
    );
  }, [records, searchTerm]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRecords, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 inline-block ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-sky-600 dark:text-sky-400 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-sky-600 dark:text-sky-400 inline-block ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-explorer-search"
            type="text"
            placeholder="Search records by city, date, condition, or temperature..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Records Count */}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing {filteredRecords.length} records
          </span>

          {/* Page size selector */}
          <select
            id="select-page-size"
            aria-label="Records per page"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
          >
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {/* Download CSV */}
          <button
            id="btn-download-explorer-csv"
            type="button"
            onClick={() => downloadRecordsAsCsv(sortedRecords, 'filtered_weather_records.csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-2xs">
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Date {renderSortIcon('date')}
                </th>
                <th
                  onClick={() => handleSort('city')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  City {renderSortIcon('city')}
                </th>
                <th
                  onClick={() => handleSort('temperature')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Temp (°C) {renderSortIcon('temperature')}
                </th>
                <th
                  onClick={() => handleSort('feelsLike')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Feels Like {renderSortIcon('feelsLike')}
                </th>
                <th
                  onClick={() => handleSort('humidity')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Humidity (%) {renderSortIcon('humidity')}
                </th>
                <th
                  onClick={() => handleSort('precipitation')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Rain (mm) {renderSortIcon('precipitation')}
                </th>
                <th
                  onClick={() => handleSort('windSpeed')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Wind (km/h) {renderSortIcon('windSpeed')}
                </th>
                <th
                  onClick={() => handleSort('pressure')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Pressure (hPa) {renderSortIcon('pressure')}
                </th>
                <th
                  onClick={() => handleSort('cloudCover')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Cloud (%) {renderSortIcon('cloudCover')}
                </th>
                <th
                  onClick={() => handleSort('visibility')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Vis (km) {renderSortIcon('visibility')}
                </th>
                <th
                  onClick={() => handleSort('weatherCondition')}
                  className="py-3 px-3 cursor-pointer hover:text-sky-600 select-none whitespace-nowrap"
                >
                  Condition {renderSortIcon('weatherCondition')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No matching weather records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((row) => {
                  const hasMissing = Object.values(row).some(
                    (v) => v === null || v === undefined || v === ''
                  );
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        hasMissing ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.city}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-amber-600 dark:text-amber-400">
                        {row.temperature !== undefined ? `${row.temperature.toFixed(1)}°` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.feelsLike !== undefined ? `${row.feelsLike.toFixed(1)}°` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-teal-600 dark:text-teal-400 font-medium">
                        {row.humidity !== undefined ? `${row.humidity}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-blue-600 dark:text-blue-400">
                        {row.precipitation !== undefined ? `${row.precipitation} mm` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.windSpeed !== undefined ? `${row.windSpeed} km/h` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.pressure !== undefined ? `${row.pressure}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.cloudCover !== undefined ? `${row.cloudCover}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.visibility !== undefined ? `${row.visibility} km` : '—'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-2xs font-semibold ${
                            row.weatherCondition === 'Rainy' || row.weatherCondition === 'Thunderstorm'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : row.weatherCondition === 'Sunny'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : row.weatherCondition === 'Foggy' || row.weatherCondition === 'Haze'
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}
                        >
                          {row.weatherCondition}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
            {sortedRecords.length} total rows)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
