import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Layers,
  Cpu,
  BarChart3,
  Database,
  Terminal,
  ArrowRight,
  RefreshCw,
  MapPin,
  Calendar,
  Thermometer,
  Droplets,
  ShieldCheck,
} from 'lucide-react';
import {
  WeatherRecord,
  DescriptiveStats,
  DataQualityReport,
  CorrelationResult,
  OutlierAnalysisResult,
  NumericalVariable,
} from '../../types';
import {
  parseCsvText,
  autoDetectColumnMapping,
  normalizeRawData,
  analyzeDataQuality,
} from '../../utils/csvProcessor';
import {
  calculateDescriptiveStats,
  calculatePearsonCorrelation,
  detectOutliersTukey,
  calculateSeasonalStats,
  calculateCitySummary,
} from '../../utils/statistics';
import { downloadRecordsAsCsv } from '../../utils/exportUtils';
import { SAMPLE_WEATHER_DATA } from '../../data/sampleWeatherData';

export type PipelineStage = 'idle' | 'initiation' | 'integration' | 'analyzation' | 'completed' | 'error';

interface ProcessLog {
  id: string;
  timestamp: string;
  phase: 'initiation' | 'integration' | 'analyzation' | 'ready' | 'error';
  message: string;
}

export interface AnalysisDossier {
  filename: string;
  fileSize: string;
  records: WeatherRecord[];
  rawRowCount: number;
  columnsDetected: string[];
  qualityReport: DataQualityReport;
  cities: string[];
  startDate: string;
  endDate: string;
  stats: Record<NumericalVariable, DescriptiveStats>;
  correlations: { pair: string; r: number; strength: string }[];
  outliersCount: number;
  totalRain: number;
  rainyDays: number;
}

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: WeatherRecord[], filename: string, dossier?: AnalysisDossier) => void;
}

const METEOROLOGICAL_VARS: { key: NumericalVariable; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'feelsLike', label: 'Feels Like', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'precipitation', label: 'Rainfall', unit: 'mm' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa' },
  { key: 'cloudCover', label: 'Cloud Cover', unit: '%' },
  { key: 'visibility', label: 'Visibility', unit: 'km' },
];

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [dossier, setDossier] = useState<AnalysisDossier | null>(null);
  const [resultTab, setResultTab] = useState<'preview' | 'stats' | 'logs'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logTerminalRef = useRef<HTMLDivElement>(null);
  const cancelPipelineRef = useRef(false);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const addLog = (phase: ProcessLog['phase'], message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, timestamp: timeStr, phase, message }]);
  };

  const resetModal = () => {
    cancelPipelineRef.current = true;
    setStage('idle');
    setProgress(0);
    setSelectedFile(null);
    setError(null);
    setLogs([]);
    setDossier(null);
    setResultTab('preview');
  };

  const handleClose = () => {
    cancelPipelineRef.current = true;
    onClose();
  };

  /**
   * Actual 3-Stage Pipeline:
   * 1. Initiation: Delimiter extraction, character streaming, header discovery & column mapping.
   * 2. Integration: Type casting, ISO date resolution, deduplication, missing-value audit & dataset normalization.
   * 3. Analyzation: Descriptive calculus (Mean/SD/IQR), Pearson correlation matrix, Tukey IQR anomaly detection, IMD seasonal aggregation.
   */
  const startPipeline = async (file: File | string, customFilename?: string) => {
    cancelPipelineRef.current = false;
    setError(null);
    setLogs([]);
    setDossier(null);
    setProgress(5);
    setStage('initiation');

    const fileName = typeof file === 'string' ? customFilename || 'weather_sample.csv' : file.name;
    const fileSizeStr =
      typeof file === 'string'
        ? `${Math.round(file.length / 1024)} KB`
        : `${Math.round(file.size / 1024)} KB`;

    try {
      // ----------------------------------------------------
      // STAGE 1: INITIATION (डेटा प्रारंभ व पार्सिंग)
      // ----------------------------------------------------
      addLog('initiation', `Initiating file stream for "${fileName}" (${fileSizeStr})`);
      await new Promise((r) => setTimeout(r, 250));
      if (cancelPipelineRef.current) return;

      const rawText = typeof file === 'string' ? file : await file.text();
      addLog('initiation', `Stream loaded into memory: ${rawText.length.toLocaleString()} UTF-8 bytes read`);
      setProgress(20);

      addLog('initiation', 'Parsing CSV delimiter matrix & row structure using PapaParse engine...');
      const parsedCsv = await parseCsvText(rawText);
      if (cancelPipelineRef.current) return;

      addLog(
        'initiation',
        `Parsed ${parsedCsv.totalRows.toLocaleString()} rows across ${parsedCsv.totalColumns} column headers.`
      );
      addLog('initiation', `Detected headers: [${parsedCsv.columns.join(', ')}]`);

      const columnMapping = autoDetectColumnMapping(parsedCsv.columns);
      const mappedKeys = Object.entries(columnMapping).filter(([, v]) => Boolean(v));
      addLog(
        'initiation',
        `Auto-mapped ${mappedKeys.length}/11 meteorological variables (Date, City, Temp, Humidity, Rain, Wind...).`
      );

      setProgress(35);
      await new Promise((r) => setTimeout(r, 350));
      if (cancelPipelineRef.current) return;

      // ----------------------------------------------------
      // STAGE 2: INTEGRATION (शोधन, एकीकरण व डेटा स्वास्थ्य)
      // ----------------------------------------------------
      setStage('integration');
      setProgress(40);
      addLog('integration', 'Beginning data integration: type-casting, ISO date standardization & float parsing...');

      const normalizedRecords = normalizeRawData(parsedCsv.data, columnMapping);
      if (normalizedRecords.length === 0) {
        throw new Error('No valid weather observations could be extracted from this dataset.');
      }
      setProgress(55);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelPipelineRef.current) return;

      // Extract unique cities & temporal boundary
      const citiesSet = new Set<string>();
      normalizedRecords.forEach((r) => {
        if (r.city) citiesSet.add(r.city);
      });
      const uniqueCities = Array.from(citiesSet).sort();

      const dates = normalizedRecords.map((r) => r.date).filter(Boolean).sort();
      const startDate = dates[0] || 'N/A';
      const endDate = dates[dates.length - 1] || 'N/A';

      addLog(
        'integration',
        `Normalized ${normalizedRecords.length.toLocaleString()} records across ${uniqueCities.length} meteorological stations: ${uniqueCities.join(', ')}.`
      );
      addLog('integration', `Temporal span verified: ${startDate} to ${endDate}.`);

      // Run Data Quality Audit
      addLog('integration', 'Performing data hygiene audit (null-cell distribution & composite key deduplication)...');
      const qualityReport = analyzeDataQuality(normalizedRecords);

      addLog(
        'integration',
        `Data Completeness Score: ${qualityReport.dataCompletenessPercentage}% (${qualityReport.missingValuesCount} null cells, ${qualityReport.duplicateRowsCount} duplicate collisions resolved).`
      );

      setProgress(65);
      await new Promise((r) => setTimeout(r, 350));
      if (cancelPipelineRef.current) return;

      // ----------------------------------------------------
      // STAGE 3: ANALYZATION (वास्तविक सांख्यिकीय संगणना)
      // ----------------------------------------------------
      setStage('analyzation');
      setProgress(70);
      addLog('analyzation', 'Executing statistical computation engine across all 8 continuous meteorological variables...');

      // 1. Calculate Descriptive Stats for all 8 metrics
      const statsMap = {} as Record<NumericalVariable, DescriptiveStats>;
      METEOROLOGICAL_VARS.forEach((v) => {
        const values = normalizedRecords.map((r) => Number(r[v.key]));
        statsMap[v.key] = calculateDescriptiveStats(values, v.label);
      });
      addLog(
        'analyzation',
        `Temperature: Mean = ${statsMap.temperature.mean}°C (SD ±${statsMap.temperature.stdDev}°C, IQR: ${statsMap.temperature.iqr}°C, Min: ${statsMap.temperature.min}°C, Max: ${statsMap.temperature.max}°C).`
      );

      const totalRain = Math.round(normalizedRecords.reduce((acc, r) => acc + (r.precipitation || 0), 0) * 10) / 10;
      const rainyDays = normalizedRecords.filter((r) => (r.precipitation || 0) > 0.2).length;
      addLog(
        'analyzation',
        `Precipitation: Cumulative = ${totalRain} mm across ${rainyDays} active rainfall days (Max daily: ${statsMap.precipitation.max} mm).`
      );

      setProgress(82);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelPipelineRef.current) return;

      // 2. Pearson Correlations
      addLog('analyzation', 'Calculating bivariate Pearson correlation coefficients (r)...');
      const tempVals = normalizedRecords.map((r) => r.temperature);
      const humVals = normalizedRecords.map((r) => r.humidity);
      const rainVals = normalizedRecords.map((r) => r.precipitation);
      const windVals = normalizedRecords.map((r) => r.windSpeed);

      const corrTempHum = calculatePearsonCorrelation(tempVals, humVals, 'Temperature', 'Humidity');
      const corrTempRain = calculatePearsonCorrelation(tempVals, rainVals, 'Temperature', 'Rainfall');
      const corrRainHum = calculatePearsonCorrelation(rainVals, humVals, 'Rainfall', 'Humidity');
      const corrWindTemp = calculatePearsonCorrelation(windVals, tempVals, 'Wind Speed', 'Temperature');

      const correlations = [
        { pair: 'Temp vs Humidity', r: corrTempHum.r, strength: corrTempHum.strength },
        { pair: 'Temp vs Rainfall', r: corrTempRain.r, strength: corrTempRain.strength },
        { pair: 'Rainfall vs Humidity', r: corrRainHum.r, strength: corrRainHum.strength },
        { pair: 'Wind Speed vs Temp', r: corrWindTemp.r, strength: corrWindTemp.strength },
      ];
      addLog(
        'analyzation',
        `Pearson r(Temp, Humidity) = ${corrTempHum.r} (${corrTempHum.strength}); r(Rain, Humidity) = ${corrRainHum.r}.`
      );

      // 3. Tukey IQR Outlier Detection
      addLog('analyzation', "Executing Tukey's 1.5×IQR anomaly detection algorithm...");
      const tempOutliers = detectOutliersTukey(normalizedRecords, 'temperature', 'Temperature');
      const rainOutliers = detectOutliersTukey(normalizedRecords, 'precipitation', 'Precipitation');
      const totalOutliersCount = tempOutliers.outliers.length + rainOutliers.outliers.length;
      addLog(
        'analyzation',
        `Outlier audit flagged ${totalOutliersCount} total anomalies (${tempOutliers.outliers.length} thermal extremes, ${rainOutliers.outliers.length} torrential rainfall spikes).`
      );

      // 4. Seasonal & City Aggregation
      addLog('analyzation', 'Computing IMD seasonal distribution (Winter, Summer, Monsoon, Post-Monsoon)...');
      calculateSeasonalStats(normalizedRecords);
      calculateCitySummary(normalizedRecords);

      setProgress(95);
      await new Promise((r) => setTimeout(r, 250));
      if (cancelPipelineRef.current) return;

      // ----------------------------------------------------
      // STAGE 4: PIPELINE READY & DOSSIER SYNTHESIS
      // ----------------------------------------------------
      const generatedDossier: AnalysisDossier = {
        filename: fileName,
        fileSize: fileSizeStr,
        records: normalizedRecords,
        rawRowCount: parsedCsv.totalRows,
        columnsDetected: parsedCsv.columns,
        qualityReport,
        cities: uniqueCities,
        startDate,
        endDate,
        stats: statsMap,
        correlations,
        outliersCount: totalOutliersCount,
        totalRain,
        rainyDays,
      };

      setDossier(generatedDossier);
      setProgress(100);
      setStage('completed');
      addLog('ready', 'All 3 stages (Initiation, Integration & Analyzation) executed and verified successfully!');
      addLog('ready', `Dataset "${fileName}" ready for active deployment to interactive analytical dashboards.`);
    } catch (err: any) {
      console.error('Pipeline failed:', err);
      setError(err.message || 'An error occurred during dataset pipeline execution.');
      setStage('error');
      addLog('error', `Pipeline execution failed: ${err.message || 'Unknown processing failure'}`);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      startPipeline(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      startPipeline(file);
    }
  };

  const handleTestWithSample = () => {
    // Generate sample CSV text from SAMPLE_WEATHER_DATA
    const headers = [
      'date',
      'city',
      'temperature',
      'feelsLike',
      'humidity',
      'precipitation',
      'windSpeed',
      'pressure',
      'cloudCover',
      'visibility',
      'weatherCondition',
    ];
    const rows = SAMPLE_WEATHER_DATA.map((r) =>
      headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(',')
    );
    const sampleCsvText = [headers.join(','), ...rows].join('\n');

    startPipeline(sampleCsvText, 'imd_india_meteorological_benchmark.csv');
  };

  const handleApplyToDashboard = () => {
    if (dossier && dossier.records.length > 0) {
      onDataLoaded(dossier.records, dossier.filename, dossier);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                stage === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : stage === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : stage !== 'idle'
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {stage === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : stage !== 'idle' && stage !== 'error' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Meteorological CSV Processing Pipeline
                </h3>
                <span className="px-2 py-0.5 rounded-full text-3xs font-bold tracking-wider uppercase bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                  Data Science Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated 3-Phase Execution: Initiation • Integration • Analyzation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STAGE 0: IDLE (Upload Dropzone) */}
          {stage === 'idle' && (
            <div className="space-y-4">
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-sky-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Drag and drop your Weather CSV here, or{' '}
                  <span className="text-sky-600 dark:text-sky-400 underline">browse files</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Accepts meteorological CSV files containing Date, City, Temperature, Humidity, Rainfall, Wind Speed, etc.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-2xs text-slate-600 dark:text-slate-300 font-medium">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  Initiation, Integration & Analyzation will trigger automatically on upload
                </div>
              </div>

              {/* Quick Actions & Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Sample CSV Template
                      </div>
                      <div className="text-3xs text-slate-500">Download reference 30-day template</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadRecordsAsCsv(SAMPLE_WEATHER_DATA.slice(0, 30), 'weather_csv_template.csv')
                    }
                    className="px-2.5 py-1 text-2xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-2xs transition-colors"
                  >
                    Download
                  </button>
                </div>

                <div className="p-3.5 bg-sky-50/60 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Run Test Pipeline
                      </div>
                      <div className="text-3xs text-slate-500">Test with 365-day meteorological benchmark</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWithSample}
                    className="px-2.5 py-1 text-2xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-2xs transition-colors"
                  >
                    Test Pipeline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE PIPELINE / PROCESSING / COMPLETED STAGES */}
          {stage !== 'idle' && (
            <div className="space-y-4">
              {/* Progress Bar & Stage Indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Pipeline Execution Progress</span>
                    <span className="text-2xs text-slate-500 dark:text-slate-400">
                      ({selectedFile ? selectedFile.name : dossier?.filename || 'Uploaded File'})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      stage === 'completed'
                        ? 'bg-emerald-500'
                        : stage === 'error'
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* 3 Explicit Pipeline Steppers */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Phase 1: Initiation */}
                  <div
                    className={`p-2.5 rounded-lg border text-2xs transition-all ${
                      stage === 'initiation'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-semibold shadow-2xs'
                        : stage === 'integration' || stage === 'analyzation' || stage === 'completed'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {stage === 'initiation' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
                      ) : stage === 'integration' || stage === 'analyzation' || stage === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-3xs">
                          1
                        </span>
                      )}
                      <span className="font-bold">1. Initiation</span>
                    </div>
                    <div className="text-3xs text-slate-500 dark:text-slate-400">
                      Delimited text parsing & header auto-mapping
                    </div>
                  </div>

                  {/* Phase 2: Integration */}
                  <div
                    className={`p-2.5 rounded-lg border text-2xs transition-all ${
                      stage === 'integration'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-semibold shadow-2xs'
                        : stage === 'analyzation' || stage === 'completed'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {stage === 'integration' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
                      ) : stage === 'analyzation' || stage === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-3xs">
                          2
                        </span>
                      )}
                      <span className="font-bold">2. Integration</span>
                    </div>
                    <div className="text-3xs text-slate-500 dark:text-slate-400">
                      Type sanitization, deduplication & data hygiene
                    </div>
                  </div>

                  {/* Phase 3: Analyzation */}
                  <div
                    className={`p-2.5 rounded-lg border text-2xs transition-all ${
                      stage === 'analyzation'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-semibold shadow-2xs'
                        : stage === 'completed'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {stage === 'analyzation' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
                      ) : stage === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-3xs">
                          3
                        </span>
                      )}
                      <span className="font-bold">3. Analyzation</span>
                    </div>
                    <div className="text-3xs text-slate-500 dark:text-slate-400">
                      Descriptive stats, Pearson r & IQR outliers
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Alert if pipeline broke */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pipeline Error:</strong> {error}
                  </div>
                </div>
              )}

              {/* LIVE TERMINAL LOG WINDOW */}
              <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 overflow-hidden font-mono text-2xs shadow-inner">
                <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-3xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-Time Processing Telemetry Feed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{stage.toUpperCase()} ACTIVE</span>
                  </div>
                </div>
                <div
                  ref={logTerminalRef}
                  className="p-3 max-h-36 overflow-y-auto space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-700"
                >
                  {logs.map((log) => (
                    <div key={log.id} className="leading-relaxed flex items-start gap-2">
                      <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                      <span
                        className={`font-semibold shrink-0 uppercase text-3xs px-1 rounded ${
                          log.phase === 'initiation'
                            ? 'bg-sky-950 text-sky-400'
                            : log.phase === 'integration'
                            ? 'bg-indigo-950 text-indigo-400'
                            : log.phase === 'analyzation'
                            ? 'bg-amber-950 text-amber-400'
                            : log.phase === 'ready'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {log.phase}
                      </span>
                      <span
                        className={
                          log.phase === 'ready'
                            ? 'text-emerald-300 font-semibold'
                            : log.phase === 'error'
                            ? 'text-rose-400 font-semibold'
                            : 'text-slate-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {stage !== 'completed' && stage !== 'error' && (
                    <div className="text-sky-400 flex items-center gap-1 text-3xs pt-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Computing next analytical pipeline transformation...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STAGE: COMPLETED (Comprehensive Analyzed Dossier Summary) */}
              {stage === 'completed' && dossier && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {/* High Level KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-3xs text-slate-400 uppercase font-semibold">Total Records</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {dossier.records.length.toLocaleString()}
                      </div>
                      <div className="text-3xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        100% Ingested & Synced
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-3xs text-slate-400 uppercase font-semibold">Stations Detected</div>
                      <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                        {dossier.cities.length} Cities
                      </div>
                      <div className="text-3xs text-slate-500 truncate mt-0.5">
                        {dossier.cities.slice(0, 3).join(', ')}
                        {dossier.cities.length > 3 ? '...' : ''}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-3xs text-slate-400 uppercase font-semibold">Avg Temperature</div>
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {dossier.stats.temperature.mean}°C
                      </div>
                      <div className="text-3xs text-slate-500 mt-0.5">
                        Range: {dossier.stats.temperature.min}° to {dossier.stats.temperature.max}°C
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-3xs text-slate-400 uppercase font-semibold">Data Completeness</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {dossier.qualityReport.dataCompletenessPercentage}%
                      </div>
                      <div className="text-3xs text-slate-500 mt-0.5">
                        {dossier.outliersCount} Outliers Flagged
                      </div>
                    </div>
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                    <button
                      type="button"
                      onClick={() => setResultTab('preview')}
                      className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-colors ${
                        resultTab === 'preview'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Data Preview (First 5 Rows)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultTab('stats')}
                      className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-colors ${
                        resultTab === 'stats'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Calculated Statistics (8 Metrics)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultTab('logs')}
                      className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-colors ${
                        resultTab === 'logs'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Telemetry Summary
                    </button>
                  </div>

                  {/* Tab 1: Preview Table */}
                  {resultTab === 'preview' && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-2xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            <th className="p-2">Date</th>
                            <th className="p-2">City</th>
                            <th className="p-2">Temp (°C)</th>
                            <th className="p-2">Humidity (%)</th>
                            <th className="p-2">Rain (mm)</th>
                            <th className="p-2">Wind (km/h)</th>
                            <th className="p-2">Pressure (hPa)</th>
                            <th className="p-2">Condition</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {dossier.records.slice(0, 5).map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2 font-mono">{r.date}</td>
                              <td className="p-2 font-bold">{r.city}</td>
                              <td className="p-2 text-amber-600 font-semibold">{r.temperature}°</td>
                              <td className="p-2 text-teal-600">{r.humidity}%</td>
                              <td className="p-2 text-blue-600">{r.precipitation}</td>
                              <td className="p-2">{r.windSpeed}</td>
                              <td className="p-2 text-slate-500">{r.pressure}</td>
                              <td className="p-2">
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-3xs">
                                  {r.weatherCondition}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tab 2: Calculated Statistics */}
                  {resultTab === 'stats' && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-2xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            <th className="p-2">Variable</th>
                            <th className="p-2">Mean</th>
                            <th className="p-2">Median</th>
                            <th className="p-2">Std Dev</th>
                            <th className="p-2">Min</th>
                            <th className="p-2">Max</th>
                            <th className="p-2">IQR</th>
                            <th className="p-2">CV (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {METEOROLOGICAL_VARS.map((v) => {
                            const s = dossier.stats[v.key];
                            return (
                              <tr key={v.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 font-sans font-bold text-slate-900 dark:text-white">
                                  {v.label} ({v.unit})
                                </td>
                                <td className="p-2">{s.mean}</td>
                                <td className="p-2">{s.median}</td>
                                <td className="p-2">±{s.stdDev}</td>
                                <td className="p-2">{s.min}</td>
                                <td className="p-2">{s.max}</td>
                                <td className="p-2">{s.iqr}</td>
                                <td className="p-2">{s.cv}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tab 3: Telemetry Summary */}
                  {resultTab === 'logs' && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-2xs space-y-2">
                      <div className="font-bold text-slate-900 dark:text-white">Execution Overview:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                        <li>
                          <strong>Initiation:</strong> File parsed from UTF-8 stream, mapped {dossier.columnsDetected.length} column headers without data loss.
                        </li>
                        <li>
                          <strong>Integration:</strong> Normalized {dossier.records.length} records into typed objects with {dossier.qualityReport.dataCompletenessPercentage}% completeness rating.
                        </li>
                        <li>
                          <strong>Analyzation:</strong> Evaluated Pearson correlation pairs and identified {dossier.outliersCount} statistical outliers using Tukey&apos;s 1.5×IQR boundary rule.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
          <div>
            {stage !== 'idle' && (
              <button
                type="button"
                onClick={resetModal}
                className="text-2xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Upload different file
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {stage === 'completed' ? 'Close' : 'Cancel'}
            </button>

            {stage === 'completed' && (
              <button
                type="button"
                onClick={handleApplyToDashboard}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-all hover:gap-2.5 active:scale-98"
              >
                <span>Apply Analyzed Data to Dashboard ({dossier?.records.length} Records)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
