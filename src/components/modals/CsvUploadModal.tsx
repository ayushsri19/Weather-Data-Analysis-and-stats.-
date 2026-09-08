import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
} from 'lucide-react';
import { WeatherRecord } from '../../types';
import { parseAndNormalizeCsv } from '../../utils/csvProcessor';
import { downloadRecordsAsCsv } from '../../utils/exportUtils';
import { SAMPLE_WEATHER_DATA } from '../../data/sampleWeatherData';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: WeatherRecord[], filename: string) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRecords, setPreviewRecords] = useState<WeatherRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setLoading(true);

    try {
      const records = await parseAndNormalizeCsv(file);
      if (records.length === 0) {
        throw new Error('CSV file did not contain any valid data rows.');
      }
      setPreviewRecords(records);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file.');
      setPreviewRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyDataset = () => {
    if (previewRecords.length > 0 && selectedFile) {
      onDataLoaded(previewRecords, selectedFile.name);
      onClose();
    }
  };

  const handleDownloadSampleCsv = () => {
    downloadRecordsAsCsv(SAMPLE_WEATHER_DATA.slice(0, 30), 'sample_weather_template.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Custom Weather CSV
              </h3>
              <p className="text-2xs text-slate-500">
                Supports standard meteorological data tables with automatic column matching
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Dropzone */}
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
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <FileSpreadsheet className="w-10 h-10 mx-auto text-sky-600 dark:text-sky-400 mb-2" />
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Drag and drop your CSV file here, or{' '}
              <span className="text-sky-600 dark:text-sky-400 underline">browse files</span>
            </div>
            <p className="text-2xs text-slate-400 mt-1">
              File should contain columns like Date, City, Temperature, Humidity, Rainfall, Wind Speed
            </p>
          </div>

          {/* Download Sample CSV Template CTA */}
          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span className="text-2xs text-slate-600 dark:text-slate-300">
                Need a reference format? Download our formatted sample CSV template:
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>Sample CSV</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Error processing CSV:</strong> {error}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-4 text-slate-500">
              Parsing and validating CSV schema...
            </div>
          )}

          {/* Preview of successfully parsed records */}
          {previewRecords.length > 0 && !loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Successfully parsed {previewRecords.length} records from &ldquo;
                    {selectedFile?.name}&rdquo;
                  </span>
                </div>
                <span className="text-2xs text-slate-400">
                  Showing first 5 rows preview
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="p-2">Date</th>
                      <th className="p-2">City</th>
                      <th className="p-2">Temp (°C)</th>
                      <th className="p-2">Humidity (%)</th>
                      <th className="p-2">Rain (mm)</th>
                      <th className="p-2">Wind (km/h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewRecords.slice(0, 5).map((r) => (
                      <tr key={r.id}>
                        <td className="p-2 font-mono">{r.date}</td>
                        <td className="p-2 font-bold">{r.city}</td>
                        <td className="p-2 text-amber-600">{r.temperature}°</td>
                        <td className="p-2 text-teal-600">{r.humidity}%</td>
                        <td className="p-2 text-blue-600">{r.precipitation}</td>
                        <td className="p-2">{r.windSpeed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={previewRecords.length === 0}
            onClick={handleApplyDataset}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            Apply to Dashboard ({previewRecords.length} Records)
          </button>
        </div>
      </div>
    </div>
  );
};
