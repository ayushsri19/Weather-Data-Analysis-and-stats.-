import { WeatherRecord, DescriptiveStats } from '../types';

/**
 * Converts array of WeatherRecords to downloadable CSV file
 */
export function downloadRecordsAsCsv(records: WeatherRecord[], filename = 'weather_dataset_filtered.csv') {
  if (!records || records.length === 0) return;

  const headers = [
    'Date',
    'City',
    'Temperature_C',
    'Feels_Like_C',
    'Humidity_Pct',
    'Wind_Speed_kmh',
    'Pressure_hPa',
    'Precipitation_mm',
    'Cloud_Cover_Pct',
    'Visibility_km',
    'Weather_Condition',
  ];

  const rows = records.map((r) => [
    r.date,
    `"${r.city}"`,
    r.temperature,
    r.feelsLike,
    r.humidity,
    r.windSpeed,
    r.pressure,
    r.precipitation,
    r.cloudCover,
    r.visibility,
    `"${r.weatherCondition}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Downloads descriptive statistics summary table as CSV
 */
export function downloadStatsAsCsv(statsList: DescriptiveStats[], filename = 'statistical_summary.csv') {
  if (!statsList || statsList.length === 0) return;

  const headers = [
    'Variable',
    'Count',
    'Mean',
    'Median',
    'Mode',
    'Min',
    'Max',
    'Range',
    'Variance',
    'Std_Deviation',
    'Q1_25th',
    'Q2_Median',
    'Q3_75th',
    'IQR',
    'CV_Percent',
  ];

  const rows = statsList.map((s) => [
    `"${s.variable}"`,
    s.count,
    s.mean,
    s.median,
    `"${s.mode.join('; ') || 'N/A'}"`,
    s.min,
    s.max,
    s.range,
    s.variance,
    s.stdDev,
    s.q1,
    s.q2,
    s.q3,
    s.iqr,
    `${s.cv}%`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generic browser download trigger
 */
export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
