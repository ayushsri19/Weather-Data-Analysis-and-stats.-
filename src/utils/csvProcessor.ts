import Papa from 'papaparse';
import { WeatherRecord, ColumnMapping, DataQualityReport } from '../types';

export interface RawCsvParsed {
  data: Record<string, any>[];
  columns: string[];
  totalRows: number;
  totalColumns: number;
  previewRows: Record<string, any>[];
}

/**
 * Parses raw CSV string using PapaParse
 */
export function parseCsvText(csvText: string): Promise<RawCsvParsed> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // We handle type sanitization ourselves
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('Uploaded CSV is empty or has no valid rows.'));
        }

        const columns = results.meta.fields || Object.keys(results.data[0] || {});
        if (columns.length === 0) {
          return reject(new Error('No column headers detected in the CSV.'));
        }

        resolve({
          data: results.data,
          columns,
          totalRows: results.data.length,
          totalColumns: columns.length,
          previewRows: results.data.slice(0, 8),
        });
      },
      error: (err) => {
        reject(new Error(`CSV Parsing failed: ${err.message}`));
      },
    });
  });
}

/**
 * Automatically infers best column mapping from header names
 */
export function autoDetectColumnMapping(columns: string[]): ColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const found = columns.find((c) => {
        const clean = c.toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean.includes(cand) || cand.includes(clean);
      });
      if (found) return found;
    }
    return '';
  };

  return {
    date: findMatch(['date', 'time', 'timestamp', 'day']),
    city: findMatch(['city', 'location', 'station', 'region', 'place']),
    temperature: findMatch(['temp', 'temperature', 'tavg', 'tmax', 'degc']),
    feelsLike: findMatch(['feelslike', 'apparent', 'heatindex', 'windchill']),
    humidity: findMatch(['humidity', 'humid', 'rh', 'moisture']),
    precipitation: findMatch(['rain', 'rainfall', 'precipitation', 'precip', 'prcp']),
    windSpeed: findMatch(['wind', 'windspeed', 'speed', 'wspeed', 'wspd']),
    pressure: findMatch(['pressure', 'barometer', 'pres', 'mslp', 'hpa']),
    cloudCover: findMatch(['cloud', 'cloudcover', 'coverage', 'clouds']),
    visibility: findMatch(['visibility', 'visib', 'vis']),
    weatherCondition: findMatch(['condition', 'weather', 'summary', 'desc', 'status']),
  };
}

/**
 * Assesses data quality for a list of WeatherRecord objects
 */
export function analyzeDataQuality(
  records: WeatherRecord[],
  columns = [
    'date',
    'city',
    'temperature',
    'humidity',
    'precipitation',
    'windSpeed',
    'pressure',
    'cloudCover',
    'visibility',
  ]
): DataQualityReport {
  const totalRecords = records.length;
  const totalColumns = columns.length;

  let totalMissing = 0;
  let missingRowsCount = 0;
  let invalidNumericCount = 0;

  const rowSignatures = new Set<string>();
  let duplicateRowsCount = 0;

  const columnQuality = columns.map((col) => {
    let missing = 0;
    let invalid = 0;

    for (const r of records) {
      const val = r[col];
      if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
        missing++;
      } else if (
        ['temperature', 'humidity', 'precipitation', 'windSpeed', 'pressure', 'cloudCover', 'visibility'].includes(
          col
        )
      ) {
        if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
          invalid++;
        } else if (col === 'humidity' && (val < 0 || val > 100)) {
          invalid++;
        } else if (col === 'precipitation' && val < 0) {
          invalid++;
        }
      }
    }

    return {
      column: col,
      missing,
      invalid,
      type: ['date', 'city', 'weatherCondition'].includes(col) ? 'string' : 'number',
    };
  });

  // Check row-level missing, duplicates, and invalid numbers
  for (const r of records) {
    let rowHasMissing = false;
    let rowHasInvalid = false;

    for (const col of columns) {
      const val = r[col];
      if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
        totalMissing++;
        rowHasMissing = true;
      } else if (
        ['temperature', 'humidity', 'precipitation', 'windSpeed', 'pressure', 'cloudCover', 'visibility'].includes(
          col
        )
      ) {
        if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
          invalidNumericCount++;
          rowHasInvalid = true;
        } else if (col === 'humidity' && (val < 0 || val > 100)) {
          invalidNumericCount++;
          rowHasInvalid = true;
        } else if (col === 'precipitation' && val < 0) {
          invalidNumericCount++;
          rowHasInvalid = true;
        }
      }
    }

    if (rowHasMissing) missingRowsCount++;

    // Deduplication signature
    const sig = `${r.city}-${r.date}`;
    if (rowSignatures.has(sig)) {
      duplicateRowsCount++;
    } else {
      rowSignatures.add(sig);
    }
  }

  const totalCells = totalRecords * totalColumns;
  const validCells = Math.max(0, totalCells - totalMissing - invalidNumericCount);
  const dataCompletenessPercentage =
    totalCells > 0 ? Math.round((validCells / totalCells) * 10000) / 100 : 100;

  return {
    totalRecords,
    totalColumns,
    missingValuesCount: totalMissing,
    missingRowsCount,
    duplicateRowsCount,
    invalidNumericCount,
    dataCompletenessPercentage,
    columnQuality,
  };
}

/**
 * Transforms raw mapped rows into normalized WeatherRecord[]
 */
export function normalizeRawData(
  rawData: Record<string, any>[],
  mapping: ColumnMapping
): WeatherRecord[] {
  return rawData.map((row, index) => {
    const rawDate = mapping.date ? String(row[mapping.date] || '').trim() : '';
    // Standardize date to YYYY-MM-DD
    let formattedDate = rawDate;
    const parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      formattedDate = parsedDate.toISOString().split('T')[0];
    } else if (!formattedDate) {
      formattedDate = `2024-01-${String((index % 28) + 1).padStart(2, '0')}`;
    }

    const parseNum = (colName: string, fallback: number): number => {
      if (!colName) return fallback;
      const raw = row[colName];
      if (raw === null || raw === undefined || raw === '') return fallback;
      const cleanStr = String(raw).replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleanStr);
      return isNaN(num) ? fallback : num;
    };

    const temp = parseNum(mapping.temperature, 25.0);
    const feelsLike = mapping.feelsLike ? parseNum(mapping.feelsLike, temp) : temp;
    const humidity = Math.min(100, Math.max(0, parseNum(mapping.humidity, 60.0)));
    const precipitation = Math.max(0, parseNum(mapping.precipitation, 0.0));
    const windSpeed = Math.max(0, parseNum(mapping.windSpeed, 12.0));
    const pressure = parseNum(mapping.pressure, 1012.0);
    const cloudCover = Math.min(100, Math.max(0, parseNum(mapping.cloudCover, 25.0)));
    const visibility = Math.max(0, parseNum(mapping.visibility, 8.5));

    const city = mapping.city ? String(row[mapping.city] || 'Custom Station').trim() : 'Custom Station';
    let weatherCondition = mapping.weatherCondition
      ? String(row[mapping.weatherCondition] || '').trim()
      : '';

    if (!weatherCondition) {
      if (precipitation > 25) weatherCondition = 'Thunderstorm';
      else if (precipitation > 0.2) weatherCondition = 'Rainy';
      else if (cloudCover > 70) weatherCondition = 'Overcast';
      else if (cloudCover > 30) weatherCondition = 'Partly Cloudy';
      else weatherCondition = 'Sunny';
    }

    return {
      id: `rec-${index}-${city.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`,
      date: formattedDate,
      city: city || 'Unknown City',
      temperature: temp,
      feelsLike,
      humidity,
      windSpeed,
      pressure,
      precipitation,
      cloudCover,
      visibility,
      weatherCondition,
    };
  });
}

/**
 * Convenient helper that parses a CSV File or text, auto-detects columns,
 * and normalizes it directly to WeatherRecord[]
 */
export async function parseAndNormalizeCsv(file: File | string): Promise<WeatherRecord[]> {
  let text = '';
  if (typeof file === 'string') {
    text = file;
  } else {
    text = await file.text();
  }
  const parsed = await parseCsvText(text);
  const mapping = autoDetectColumnMapping(parsed.columns);
  return normalizeRawData(parsed.data, mapping);
}

/**
 * Data Cleaning Strategies:
 * 1. 'drop_rows': Drops rows with any missing numerical values
 * 2. 'impute_mean': Fills missing numericals with the column mean
 * 3. 'impute_median': Fills missing numericals with the column median
 * 4. 'forward_fill': Fills missing numericals with previous valid observation
 */
export function cleanDataset(
  records: WeatherRecord[],
  strategy: 'drop_rows' | 'impute_mean' | 'impute_median' | 'forward_fill'
): WeatherRecord[] {
  const numericKeys: (keyof WeatherRecord)[] = [
    'temperature',
    'feelsLike',
    'humidity',
    'windSpeed',
    'pressure',
    'precipitation',
    'cloudCover',
    'visibility',
  ];

  if (strategy === 'drop_rows') {
    return records.filter((r) => {
      for (const k of numericKeys) {
        const val = r[k];
        if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return false;
      }
      return true;
    });
  }

  // Precalculate means & medians for each variable
  const statsMap: Record<string, { mean: number; median: number }> = {};
  for (const k of numericKeys) {
    const valid = records
      .map((r) => r[k])
      .filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v)) as number[];

    if (valid.length > 0) {
      const sum = valid.reduce((a, b) => a + b, 0);
      const mean = Math.round((sum / valid.length) * 10) / 10;
      const sorted = [...valid].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      statsMap[k] = { mean, median: Math.round(median * 10) / 10 };
    } else {
      statsMap[k] = { mean: 0, median: 0 };
    }
  }

  const cleaned: WeatherRecord[] = [];
  const lastValidVal: Record<string, number> = {};

  for (let i = 0; i < records.length; i++) {
    const rec = { ...records[i] };

    for (const k of numericKeys) {
      const val = rec[k];
      const isMissing = typeof val !== 'number' || isNaN(val) || !isFinite(val);

      if (isMissing) {
        if (strategy === 'impute_mean') {
          rec[k] = statsMap[k].mean;
        } else if (strategy === 'impute_median') {
          rec[k] = statsMap[k].median;
        } else if (strategy === 'forward_fill') {
          rec[k] = lastValidVal[k] !== undefined ? lastValidVal[k] : statsMap[k].median;
        }
      } else {
        lastValidVal[k] = val;
      }
    }

    cleaned.push(rec);
  }

  return cleaned;
}
