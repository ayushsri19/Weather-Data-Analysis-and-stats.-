export interface WeatherRecord {
  id: string;
  date: string; // YYYY-MM-DD
  city: string; // Lucknow, Delhi, Mumbai, Bengaluru, etc.
  temperature: number; // in Celsius
  feelsLike: number; // in Celsius
  humidity: number; // in %
  windSpeed: number; // in km/h
  pressure: number; // in hPa
  precipitation: number; // in mm
  cloudCover: number; // in %
  visibility: number; // in km
  weatherCondition: string; // Sunny, Partly Cloudy, Overcast, Rainy, Thunderstorm, Foggy, Haze
  [key: string]: any; // for custom uploaded fields
}

export type NumericalVariable =
  | 'temperature'
  | 'feelsLike'
  | 'humidity'
  | 'windSpeed'
  | 'pressure'
  | 'precipitation'
  | 'cloudCover'
  | 'visibility';

export interface DescriptiveStats {
  variable: string;
  count: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDev: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  cv: number; // Coefficient of Variation in %
}

export interface CorrelationResult {
  var1: string;
  var2: string;
  r: number;
  strength: string;
  description: string;
  interpretation?: string;
  sampleSize: number;
}

export interface OutlierAnalysisResult {
  variable: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outlierCount: number;
  outlierPercentage: number;
  outliers: WeatherRecord[];
}

export type SeasonName = 'Winter' | 'Summer' | 'Monsoon' | 'Post-Monsoon';

export interface SeasonalMetric {
  season: SeasonName;
  months: string;
  recordCount: number;
  avgTemperature: number;
  avgTemp?: number;
  avgHumidity: number;
  totalRainfall: number;
  avgRainfall: number;
  avgWindSpeed: number;
  avgPressure: number;
  maxTemperature: number;
  minTemperature: number;
  rainyDays?: number;
}

export interface CitySummary {
  city: string;
  recordCount: number;
  avgTemperature: number;
  avgHumidity: number;
  totalRainfall: number;
  avgRainfall: number;
  avgWindSpeed: number;
  maxWindSpeed: number;
  maxTemperature: number;
  minTemperature: number;
  avgPressure: number;
  rainyDays: number;
  rainyDaysPercent?: number;
}

export interface AiInsightResponse {
  report: string;
  model: string;
  generatedAt: string;
}

export interface DataQualityReport {
  totalRecords: number;
  totalColumns: number;
  missingValuesCount: number;
  missingRowsCount: number;
  duplicateRowsCount: number;
  invalidNumericCount: number;
  dataCompletenessPercentage: number;
  columnQuality: {
    column: string;
    missing: number;
    invalid: number;
    type: string;
  }[];
}

export interface FilterState {
  city: string; // 'ALL' or specific city
  dateStart: string;
  dateEnd: string;
  weatherCondition: string; // 'ALL' or specific
  selectedVariable: NumericalVariable;
  searchQuery: string;
}

export interface ColumnMapping {
  date: string;
  city: string;
  temperature: string;
  feelsLike: string;
  humidity: string;
  windSpeed: string;
  pressure: string;
  precipitation: string;
  cloudCover: string;
  visibility: string;
  weatherCondition: string;
}
