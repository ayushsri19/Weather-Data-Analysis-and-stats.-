import React, { useState, useMemo, useEffect } from 'react';
import { SAMPLE_WEATHER_DATA } from './data/sampleWeatherData';
import { WeatherRecord, FilterState, NumericalVariable } from './types';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { NavigationTabs } from './components/NavigationTabs';
import { DashboardTab } from './components/tabs/DashboardTab';
import { DataExplorerTab } from './components/tabs/DataExplorerTab';
import { StatisticsTab } from './components/tabs/StatisticsTab';
import { TemperatureTab } from './components/tabs/TemperatureTab';
import { RainfallTab } from './components/tabs/RainfallTab';
import { HumidityTab } from './components/tabs/HumidityTab';
import { WindTab } from './components/tabs/WindTab';
import { CityComparisonTab } from './components/tabs/CityComparisonTab';
import { CorrelationTab } from './components/tabs/CorrelationTab';
import { SeasonalTab } from './components/tabs/SeasonalTab';
import { OutliersTab } from './components/tabs/OutliersTab';
import { DataQualityTab } from './components/tabs/DataQualityTab';
import { AiInsightsTab } from './components/tabs/AiInsightsTab';
import { CsvUploadModal } from './components/modals/CsvUploadModal';
import { ReportModal } from './components/modals/ReportModal';
import { AboutModal } from './components/modals/AboutModal';
import { downloadRecordsAsCsv, downloadStatsAsCsv } from './utils/exportUtils';
import { calculateDescriptiveStats } from './utils/statistics';

const DEFAULT_FILTERS: FilterState = {
  city: 'ALL',
  dateStart: '',
  dateEnd: '',
  weatherCondition: 'ALL',
  selectedVariable: 'temperature',
  searchQuery: '',
};

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Dataset state
  const [records, setRecords] = useState<WeatherRecord[]>(SAMPLE_WEATHER_DATA);
  const [datasetName, setDatasetName] = useState<string>('Sample 365-Day Data');
  const [isCustomDataset, setIsCustomDataset] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Filters state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Available unique cities and conditions from currently loaded dataset
  const availableCities = useMemo(() => {
    const citiesSet = new Set<string>();
    for (const r of records) {
      if (r.city) citiesSet.add(r.city);
    }
    return Array.from(citiesSet).sort();
  }, [records]);

  const availableConditions = useMemo(() => {
    const condSet = new Set<string>();
    for (const r of records) {
      if (r.weatherCondition) condSet.add(r.weatherCondition);
    }
    return Array.from(condSet).sort();
  }, [records]);

  // Filtered records based on active filters
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // City filter
      if (filters.city !== 'ALL' && r.city !== filters.city) {
        return false;
      }
      // Date start filter
      if (filters.dateStart && r.date < filters.dateStart) {
        return false;
      }
      // Date end filter
      if (filters.dateEnd && r.date > filters.dateEnd) {
        return false;
      }
      // Weather condition filter
      if (filters.weatherCondition !== 'ALL' && r.weatherCondition !== filters.weatherCondition) {
        return false;
      }
      return true;
    });
  }, [records, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleResetDataset = () => {
    setRecords(SAMPLE_WEATHER_DATA);
    setDatasetName('Sample 365-Day Data');
    setIsCustomDataset(false);
    setFilters(DEFAULT_FILTERS);
  };

  const handleDataLoaded = (newRecords: WeatherRecord[], filename: string) => {
    setRecords(newRecords);
    setDatasetName(filename);
    setIsCustomDataset(true);
    setFilters(DEFAULT_FILTERS);
    setActiveTab('dashboard');
  };

  const handleExportFilteredCsv = () => {
    downloadRecordsAsCsv(
      filteredRecords,
      `weather_records_${filters.city.toLowerCase()}_filtered.csv`
    );
  };

  const handleExportStatsCsv = () => {
    const varKeys: { key: NumericalVariable; label: string }[] = [
      { key: 'temperature', label: 'Temperature' },
      { key: 'feelsLike', label: 'Feels Like' },
      { key: 'humidity', label: 'Humidity' },
      { key: 'precipitation', label: 'Rainfall' },
      { key: 'windSpeed', label: 'Wind Speed' },
      { key: 'pressure', label: 'Pressure' },
      { key: 'cloudCover', label: 'Cloud Cover' },
      { key: 'visibility', label: 'Visibility' },
    ];
    const statsList = varKeys.map((v) => {
      const vals = filteredRecords.map((r) => Number(r[v.key]));
      return calculateDescriptiveStats(vals, v.label);
    });
    downloadStatsAsCsv(statsList, 'weather_descriptive_statistics.csv');
  };

  const handleSelectCityFromChild = (city: string) => {
    setFilters((prev) => ({ ...prev, city }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Application Bar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetDataset={handleResetDataset}
        onExportFilteredCsv={handleExportFilteredCsv}
        onExportStatsCsv={handleExportStatsCsv}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        isCustomDataset={isCustomDataset}
        totalRecords={records.length}
      />

      {/* Navigation Tabs Bar */}
      <NavigationTabs activeTab={activeTab} onSelectTab={(tabId) => setActiveTab(tabId)} />

      {/* Global Interactive Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availableCities={availableCities}
        availableConditions={availableConditions}
        totalRecordsCount={records.length}
        filteredRecordsCount={filteredRecords.length}
      />

      {/* Main Tab Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            records={filteredRecords}
            onSelectTab={(tabId) => setActiveTab(tabId)}
            onSelectCity={handleSelectCityFromChild}
          />
        )}

        {activeTab === 'explorer' && (
          <DataExplorerTab
            records={filteredRecords}
            onResetFilters={handleResetFilters}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsTab
            records={filteredRecords}
            initialVariable={filters.selectedVariable}
          />
        )}

        {activeTab === 'temperature' && <TemperatureTab records={filteredRecords} />}

        {activeTab === 'rainfall' && <RainfallTab records={filteredRecords} />}

        {activeTab === 'humidity' && <HumidityTab records={filteredRecords} />}

        {activeTab === 'wind' && <WindTab records={filteredRecords} />}

        {activeTab === 'city-comparison' && <CityComparisonTab records={filteredRecords} />}

        {activeTab === 'correlation' && <CorrelationTab records={filteredRecords} />}

        {activeTab === 'seasonal' && <SeasonalTab records={filteredRecords} />}

        {activeTab === 'outliers' && <OutliersTab records={filteredRecords} />}

        {activeTab === 'data-quality' && <DataQualityTab records={filteredRecords} />}

        {activeTab === 'ai-insights' && <AiInsightsTab records={filteredRecords} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Weather Data Analysis &amp; Statistics Dashboard</strong> — College-Level Fundamentals of Data Science and Analytics Group Project
          </div>
          <div className="flex items-center gap-3 text-2xs">
            <span>React + Vite</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Recharts</span>
            <span>•</span>
            <span>Express</span>
            <span>•</span>
            <span>Gemini API</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        records={filteredRecords}
        isCustomDataset={isCustomDataset}
        filename={datasetName}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
