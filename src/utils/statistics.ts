import {
  WeatherRecord,
  DescriptiveStats,
  CorrelationResult,
  OutlierAnalysisResult,
  SeasonalMetric,
  CitySummary,
  SeasonName,
} from '../types';

/**
 * Calculates full descriptive statistics for an array of numbers.
 * No values are hardcoded; all are calculated dynamically.
 */
export function calculateDescriptiveStats(
  rawValues: number[],
  variableName = 'Variable'
): DescriptiveStats {
  const values = rawValues.filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  const n = values.length;

  if (n === 0) {
    return {
      variable: variableName,
      count: 0,
      mean: 0,
      median: 0,
      mode: [],
      min: 0,
      max: 0,
      range: 0,
      variance: 0,
      stdDev: 0,
      q1: 0,
      q2: 0,
      q3: 0,
      iqr: 0,
      cv: 0,
    };
  }

  // Sort ascending
  const sorted = [...values].sort((a, b) => a - b);

  // Mean
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = Math.round((sum / n) * 1000) / 1000;

  // Median (Q2)
  const median = calculatePercentile(sorted, 50);

  // Mode
  const frequencyMap = new Map<number, number>();
  let maxFreq = 0;
  for (const v of sorted) {
    // Round to 1 decimal place to group close floating points
    const rounded = Math.round(v * 10) / 10;
    const freq = (frequencyMap.get(rounded) || 0) + 1;
    frequencyMap.set(rounded, freq);
    if (freq > maxFreq) maxFreq = freq;
  }
  const mode: number[] = [];
  if (maxFreq > 1) {
    frequencyMap.forEach((freq, val) => {
      if (freq === maxFreq && mode.length < 3) mode.push(val);
    });
  }

  // Min, Max, Range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = Math.round((max - min) * 1000) / 1000;

  // Sample Variance (n - 1 denominator for unbiased estimator)
  let variance = 0;
  if (n > 1) {
    const sumSqDiff = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    variance = Math.round((sumSqDiff / (n - 1)) * 1000) / 1000;
  }

  // Standard Deviation
  const stdDev = Math.round(Math.sqrt(variance) * 1000) / 1000;

  // Quartiles Q1, Q2, Q3
  const q1 = calculatePercentile(sorted, 25);
  const q2 = median;
  const q3 = calculatePercentile(sorted, 75);
  const iqr = Math.round((q3 - q1) * 1000) / 1000;

  // Coefficient of Variation = (stdDev / mean) * 100%
  const cv = mean !== 0 ? Math.round((stdDev / Math.abs(mean)) * 10000) / 100 : 0;

  return {
    variable: variableName,
    count: n,
    mean,
    median,
    mode,
    min,
    max,
    range,
    variance,
    stdDev,
    q1,
    q2,
    q3,
    iqr,
    cv,
  };
}

/**
 * Calculates a specific percentile using standard linear interpolation between closest ranks.
 */
export function calculatePercentile(sorted: number[], percentile: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];

  const index = (percentile / 100) * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  const val = sorted[lower] * (1 - weight) + sorted[upper] * weight;
  return Math.round(val * 1000) / 1000;
}

/**
 * Calculates Pearson Correlation Coefficient r between two numeric arrays
 */
export function calculatePearsonCorrelation(
  xVals: number[],
  yVals: number[],
  var1Name = 'Variable 1',
  var2Name = 'Variable 2'
): CorrelationResult & { slope: number; intercept: number } {
  const pairs: [number, number][] = [];
  const minLen = Math.min(xVals.length, yVals.length);

  for (let i = 0; i < minLen; i++) {
    const x = xVals[i];
    const y = yVals[i];
    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
      pairs.push([x, y]);
    }
  }

  const n = pairs.length;
  if (n < 2) {
    return {
      var1: var1Name,
      var2: var2Name,
      r: 0,
      strength: 'Insufficient Data',
      description: 'Need at least 2 valid paired data points.',
      sampleSize: n,
      slope: 0,
      intercept: 0,
    };
  }

  const sumX = pairs.reduce((acc, [x]) => acc + x, 0);
  const sumY = pairs.reduce((acc, [, y]) => acc + y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  const r = denominator === 0 ? 0 : Math.round((numerator / denominator) * 10000) / 10000;

  // Linear Regression y = mx + c
  const slope = denomX === 0 ? 0 : Math.round((numerator / denomX) * 10000) / 10000;
  const intercept = Math.round((meanY - slope * meanX) * 1000) / 1000;

  // Interpretation string
  let strength = 'No meaningful correlation';
  let description = 'There is virtually no linear relationship between the two variables.';

  if (r >= 0.7) {
    strength = 'Strong positive correlation';
    description = `As ${var1Name} increases, ${var2Name} strongly tends to increase proportionally (r = ${r}).`;
  } else if (r >= 0.4) {
    strength = 'Moderate positive correlation';
    description = `There is a clear positive trend where higher ${var1Name} generally corresponds to higher ${var2Name} (r = ${r}).`;
  } else if (r >= 0.1) {
    strength = 'Weak positive correlation';
    description = `A slight positive association exists, though other atmospheric factors introduce variance (r = ${r}).`;
  } else if (r > -0.1) {
    strength = 'No meaningful correlation';
    description = `The correlation is negligible (r = ${r}), indicating independence between these two weather measurements.`;
  } else if (r > -0.4) {
    strength = 'Weak negative correlation';
    description = `A slight inverse trend exists, with higher ${var1Name} occasionally paired with lower ${var2Name} (r = ${r}).`;
  } else if (r > -0.7) {
    strength = 'Moderate negative correlation';
    description = `There is a distinct inverse trend where higher ${var1Name} corresponds to lower ${var2Name} (r = ${r}).`;
  } else {
    strength = 'Strong negative correlation';
    description = `As ${var1Name} increases, ${var2Name} strongly tends to decrease in a robust linear manner (r = ${r}).`;
  }

  return {
    var1: var1Name,
    var2: var2Name,
    r,
    strength,
    description,
    interpretation: description,
    sampleSize: n,
    slope,
    intercept,
  };
}

/**
 * Calculates Ordinary Least Squares (OLS) Simple Linear Regression
 */
export function calculateLinearRegression(
  x: number[],
  y: number[]
): {
  slope: number;
  intercept: number;
  r2: number;
  rSquared: number;
  equation: string;
} {
  const n = Math.min(x.length, y.length);
  if (n === 0)
    return {
      slope: 0,
      intercept: 0,
      r2: 0,
      rSquared: 0,
      equation: 'y = 0',
    };

  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const rawSlope = denomX !== 0 ? numerator / denomX : 0;
  const rawIntercept = meanY - rawSlope * meanX;
  const r = denomX > 0 && denomY > 0 ? numerator / Math.sqrt(denomX * denomY) : 0;
  const r2 = Math.round(r * r * 1000) / 1000;
  const slope = Math.round(rawSlope * 1000) / 1000;
  const intercept = Math.round(rawIntercept * 1000) / 1000;
  const sign = intercept >= 0 ? '+' : '-';
  const equation = `y = ${slope}x ${sign} ${Math.abs(intercept)}`;

  return {
    slope,
    intercept,
    r2,
    rSquared: r2,
    equation,
  };
}

export interface CorrelationMatrixRow {
  variable: string;
  label: string;
  values: Record<string, number>;
}

export type CorrelationMatrixOutput = CorrelationMatrixRow[] & {
  labels: string[];
  matrix: number[][];
  variableKeys: string[];
};

/**
 * Calculates a full correlation matrix across multiple weather variables
 */
export function calculateCorrelationMatrix(
  records: WeatherRecord[],
  variableKeys: ({ key: keyof WeatherRecord; label: string } | keyof WeatherRecord)[]
): CorrelationMatrixOutput {
  const normalizedKeys: { key: keyof WeatherRecord; label: string }[] = variableKeys.map((v) => {
    if (typeof v === 'object' && v !== null && 'key' in v) {
      return v as { key: keyof WeatherRecord; label: string };
    }
    const keyStr = String(v);
    const label = keyStr.charAt(0).toUpperCase() + keyStr.slice(1);
    return { key: v as keyof WeatherRecord, label };
  });

  const labels = normalizedKeys.map((v) => v.label);
  const keys = normalizedKeys.map((v) => String(v.key));
  const matrix: number[][] = [];
  const rows: CorrelationMatrixRow[] = [];

  for (let i = 0; i < normalizedKeys.length; i++) {
    matrix[i] = [];
    const valuesMap: Record<string, number> = {};
    const xVals = records.map((r) => Number(r[normalizedKeys[i].key]));

    for (let j = 0; j < normalizedKeys.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
        valuesMap[String(normalizedKeys[j].key)] = 1.0;
      } else if (j < i) {
        // Symmetric matrix
        matrix[i][j] = matrix[j][i];
        valuesMap[String(normalizedKeys[j].key)] = matrix[j][i];
      } else {
        const yVals = records.map((r) => Number(r[normalizedKeys[j].key]));
        const res = calculatePearsonCorrelation(xVals, yVals, labels[i], labels[j]);
        matrix[i][j] = res.r;
        valuesMap[String(normalizedKeys[j].key)] = res.r;
      }
    }

    rows.push({
      variable: String(normalizedKeys[i].key),
      label: labels[i],
      values: valuesMap,
    });
  }

  const result = rows as CorrelationMatrixOutput;
  result.labels = labels;
  result.matrix = matrix;
  result.variableKeys = keys;
  return result;
}

/**
 * Detects outliers using Tukey's IQR Method:
 * Lower Bound = Q1 - 1.5 * IQR
 * Upper Bound = Q3 + 1.5 * IQR
 */
export function calculateOutliersIQR(
  records: WeatherRecord[],
  variableKey: keyof WeatherRecord,
  variableLabel = 'Variable'
): OutlierAnalysisResult {
  const numericRecords = records.filter(
    (r) => typeof r[variableKey] === 'number' && !isNaN(r[variableKey])
  );
  const values = numericRecords.map((r) => Number(r[variableKey]));

  if (values.length === 0) {
    return {
      variable: variableLabel,
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      outlierCount: 0,
      outlierPercentage: 0,
      outliers: [],
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = calculatePercentile(sorted, 25);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = Math.round((q3 - q1) * 1000) / 1000;

  const lowerBound = Math.round((q1 - 1.5 * iqr) * 1000) / 1000;
  const upperBound = Math.round((q3 + 1.5 * iqr) * 1000) / 1000;

  const outliers = numericRecords.filter((r) => {
    const v = Number(r[variableKey]);
    return v < lowerBound || v > upperBound;
  });

  const outlierPercentage =
    numericRecords.length > 0
      ? Math.round((outliers.length / numericRecords.length) * 10000) / 100
      : 0;

  return {
    variable: variableLabel,
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound,
    outlierCount: outliers.length,
    outlierPercentage,
    outliers,
  };
}

export interface TukeyOutlierItem {
  recordId: string;
  date: string;
  city: string;
  variable: string;
  value: number;
  boundExceeded: 'UPPER' | 'LOWER';
  classification: string;
  reason: string;
}

export interface TukeyOutlierReport {
  variable: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: TukeyOutlierItem[];
}

/**
 * Enhanced Tukey IQR Outlier Detection with atmospheric classification
 */
export function detectOutliersTukey(
  records: WeatherRecord[],
  variableKey: keyof WeatherRecord,
  variableLabel = 'Variable'
): TukeyOutlierReport {
  const numericRecords = records.filter(
    (r) => typeof r[variableKey] === 'number' && !isNaN(r[variableKey])
  );
  const values = numericRecords.map((r) => Number(r[variableKey]));

  if (values.length === 0) {
    return {
      variable: variableLabel,
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerFence: 0,
      upperFence: 0,
      outliers: [],
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = calculatePercentile(sorted, 25);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = Math.round((q3 - q1) * 100) / 100;

  const lowerFence = Math.round((q1 - 1.5 * iqr) * 100) / 100;
  const upperFence = Math.round((q3 + 1.5 * iqr) * 100) / 100;

  const outlierItems: TukeyOutlierItem[] = [];

  for (const r of numericRecords) {
    const val = Number(r[variableKey]);
    if (val < lowerFence || val > upperFence) {
      const boundExceeded = val > upperFence ? 'UPPER' : 'LOWER';
      let classification = 'Mild Anomaly';
      let reason = `Observed ${val} falls outside standard fence [${lowerFence}, ${upperFence}].`;

      if (boundExceeded === 'UPPER') {
        const extremeThreshold = q3 + 3.0 * iqr;
        if (val > extremeThreshold) {
          classification = 'Extreme High Event';
        }
        if (variableKey === 'temperature') {
          reason = `Severe heat episode / heatwave condition recorded during peak diurnal insulation.`;
        } else if (variableKey === 'precipitation') {
          reason = `Convective cloudburst / intense monsoon storm event exceeding seasonal normal.`;
        } else if (variableKey === 'windSpeed') {
          reason = `Gale force wind gust or pre-monsoon squall line phenomenon.`;
        } else if (variableKey === 'humidity') {
          reason = `High moisture saturation event near condensation point.`;
        }
      } else {
        const extremeThreshold = q1 - 3.0 * iqr;
        if (val < extremeThreshold) {
          classification = 'Extreme Low Event';
        }
        if (variableKey === 'temperature') {
          reason = `Cold wave / winter western disturbance temperature drop.`;
        } else if (variableKey === 'humidity') {
          reason = `Extremely dry continental air mass invasion during peak arid conditions.`;
        }
      }

      outlierItems.push({
        recordId: r.id,
        date: r.date,
        city: r.city,
        variable: variableLabel,
        value: val,
        boundExceeded,
        classification,
        reason,
      });
    }
  }

  return {
    variable: variableLabel,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    outliers: outlierItems,
  };
}

/**
 * Classifies date into Indian subcontinental meteorological seasons:
 * Winter: Dec, Jan, Feb
 * Summer: Mar, Apr, May, Jun
 * Monsoon: Jul, Aug, Sep
 * Post-Monsoon: Oct, Nov
 */
export function getSeasonForDate(dateStr: string): SeasonName {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1; // 1-12
  if (m === 12 || m === 1 || m === 2) return 'Winter';
  if (m >= 3 && m <= 6) return 'Summer';
  if (m >= 7 && m <= 9) return 'Monsoon';
  return 'Post-Monsoon';
}

export function calculateSeasonalStats(records: WeatherRecord[]): SeasonalMetric[] {
  const seasons: { name: SeasonName; months: string }[] = [
    { name: 'Winter', months: 'Dec – Feb' },
    { name: 'Summer', months: 'Mar – Jun' },
    { name: 'Monsoon', months: 'Jul – Sep' },
    { name: 'Post-Monsoon', months: 'Oct – Nov' },
  ];

  return seasons.map((s) => {
    const seasonRecords = records.filter((r) => getSeasonForDate(r.date) === s.name);
    const n = seasonRecords.length;

    if (n === 0) {
      return {
        season: s.name,
        months: s.months,
        recordCount: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        totalRainfall: 0,
        avgRainfall: 0,
        avgWindSpeed: 0,
        avgPressure: 0,
        maxTemperature: 0,
        minTemperature: 0,
      };
    }

    const temps = seasonRecords.map((r) => r.temperature);
    const hums = seasonRecords.map((r) => r.humidity);
    const rains = seasonRecords.map((r) => r.precipitation);
    const winds = seasonRecords.map((r) => r.windSpeed);
    const press = seasonRecords.map((r) => r.pressure);

    const sumTemp = temps.reduce((a, b) => a + b, 0);
    const sumHum = hums.reduce((a, b) => a + b, 0);
    const totalRain = rains.reduce((a, b) => a + b, 0);
    const sumWind = winds.reduce((a, b) => a + b, 0);
    const sumPress = press.reduce((a, b) => a + b, 0);
    const rainyDays = rains.filter((r) => r > 0.2).length;

    return {
      season: s.name,
      months: s.months,
      recordCount: n,
      avgTemperature: Math.round((sumTemp / n) * 10) / 10,
      avgTemp: Math.round((sumTemp / n) * 10) / 10,
      avgHumidity: Math.round((sumHum / n) * 10) / 10,
      totalRainfall: Math.round(totalRain * 10) / 10,
      avgRainfall: Math.round((totalRain / n) * 100) / 100,
      avgWindSpeed: Math.round((sumWind / n) * 10) / 10,
      avgPressure: Math.round((sumPress / n) * 10) / 10,
      maxTemperature: Math.max(...temps),
      minTemperature: Math.min(...temps),
      rainyDays,
    };
  });
}

/**
 * Calculates monthly aggregations across 12 calendar months
 */
export function calculateMonthlyStats(records: WeatherRecord[]): {
  monthIndex: number;
  monthName: string;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  totalRainfall: number;
  avgRainfall: number;
  rainyDays: number;
  avgHumidity: number;
  avgWindSpeed: number;
  avgPressure: number;
}[] {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  return monthNames.map((name, idx) => {
    const targetMonth = idx + 1;
    const mRecords = records.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() + 1 === targetMonth;
    });

    const n = mRecords.length;
    if (n === 0) {
      return {
        monthIndex: targetMonth,
        monthName: name,
        avgTemp: 0,
        maxTemp: 0,
        minTemp: 0,
        totalRainfall: 0,
        avgRainfall: 0,
        rainyDays: 0,
        avgHumidity: 0,
        avgWindSpeed: 0,
        avgPressure: 0,
      };
    }

    const temps = mRecords.map((r) => r.temperature);
    const rains = mRecords.map((r) => r.precipitation);
    const hums = mRecords.map((r) => r.humidity);
    const winds = mRecords.map((r) => r.windSpeed);
    const press = mRecords.map((r) => r.pressure);

    const totalRain = rains.reduce((a, b) => a + b, 0);
    const rainyDays = rains.filter((r) => r > 0.2).length;

    return {
      monthIndex: targetMonth,
      monthName: name,
      avgTemp: Math.round((temps.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      totalRainfall: Math.round(totalRain * 10) / 10,
      avgRainfall: Math.round((totalRain / n) * 100) / 100,
      rainyDays,
      avgHumidity: Math.round((hums.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      avgWindSpeed: Math.round((winds.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      avgPressure: Math.round((press.reduce((a, b) => a + b, 0) / n) * 10) / 10,
    };
  });
}

/**
 * Calculates comparative summary for unique cities in dataset
 */
export function calculateCitySummary(records: WeatherRecord[]): CitySummary[] {
  const cityMap = new Map<string, WeatherRecord[]>();
  for (const r of records) {
    const list = cityMap.get(r.city) || [];
    list.push(r);
    cityMap.set(r.city, list);
  }

  const summaries: CitySummary[] = [];
  cityMap.forEach((cityRecords, city) => {
    const n = cityRecords.length;
    const temps = cityRecords.map((r) => r.temperature);
    const hums = cityRecords.map((r) => r.humidity);
    const rains = cityRecords.map((r) => r.precipitation);
    const winds = cityRecords.map((r) => r.windSpeed);
    const press = cityRecords.map((r) => r.pressure);

    const totalRain = rains.reduce((a, b) => a + b, 0);
    const rainyDays = rains.filter((r) => r > 0.2).length;

    summaries.push({
      city,
      recordCount: n,
      avgTemperature: Math.round((temps.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      avgHumidity: Math.round((hums.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      totalRainfall: Math.round(totalRain * 10) / 10,
      avgRainfall: Math.round((totalRain / n) * 100) / 100,
      avgWindSpeed: Math.round((winds.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      maxWindSpeed: Math.max(...winds),
      maxTemperature: Math.max(...temps),
      minTemperature: Math.min(...temps),
      avgPressure: Math.round((press.reduce((a, b) => a + b, 0) / n) * 10) / 10,
      rainyDays,
      rainyDaysPercent: n > 0 ? Math.round((rainyDays / n) * 1000) / 10 : 0,
    });
  });

  return summaries.sort((a, b) => b.recordCount - a.recordCount);
}

/**
 * Generates histogram bin data for distribution charts
 */
export function calculateHistogram(
  values: number[],
  numBins = 10
): { binLabel: string; min: number; max: number; count: number; frequency: number }[] {
  const filtered = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (filtered.length === 0) return [];

  const min = Math.min(...filtered);
  const max = Math.max(...filtered);

  if (min === max) {
    return [
      {
        binLabel: `${min}`,
        min,
        max,
        count: filtered.length,
        frequency: 100,
      },
    ];
  }

  const binWidth = (max - min) / numBins;
  const bins: { binLabel: string; min: number; max: number; count: number; frequency: number }[] = [];

  for (let i = 0; i < numBins; i++) {
    const bMin = min + i * binWidth;
    const bMax = i === numBins - 1 ? max : min + (i + 1) * binWidth;
    const label = `${bMin.toFixed(1)}–${bMax.toFixed(1)}`;
    bins.push({
      binLabel: label,
      min: bMin,
      max: bMax,
      count: 0,
      frequency: 0,
    });
  }

  for (const v of filtered) {
    let assigned = false;
    for (let i = 0; i < numBins; i++) {
      if (i === numBins - 1 ? v >= bins[i].min && v <= bins[i].max : v >= bins[i].min && v < bins[i].max) {
        bins[i].count++;
        assigned = true;
        break;
      }
    }
    if (!assigned && bins.length > 0) {
      bins[bins.length - 1].count++;
    }
  }

  for (const b of bins) {
    b.frequency = Math.round((b.count / filtered.length) * 1000) / 10;
  }

  return bins;
}
