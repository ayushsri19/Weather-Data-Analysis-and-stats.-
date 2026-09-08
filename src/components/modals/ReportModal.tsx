import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
} from 'lucide-react';
import { WeatherRecord } from '../../types';
import {
  calculateDescriptiveStats,
  calculateMonthlyStats,
  calculateSeasonalStats,
  calculateCitySummary,
  calculatePearsonCorrelation,
  detectOutliersTukey,
} from '../../utils/statistics';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: WeatherRecord[];
  isCustomDataset: boolean;
  filename?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  records,
  isCustomDataset,
  filename,
}) => {
  if (!isOpen) return null;

  const tempStats = calculateDescriptiveStats(records.map((r) => r.temperature), 'Temperature');
  const humStats = calculateDescriptiveStats(records.map((r) => r.humidity), 'Humidity');
  const rainStats = calculateDescriptiveStats(records.map((r) => r.precipitation), 'Rainfall');
  const windStats = calculateDescriptiveStats(records.map((r) => r.windSpeed), 'Wind Speed');
  const citySummaries = calculateCitySummary(records);
  const seasonalStats = calculateSeasonalStats(records);
  const tempHumCorr = calculatePearsonCorrelation(
    records.map((r) => r.temperature),
    records.map((r) => r.humidity),
    'Temperature',
    'Humidity'
  );
  const tempRainCorr = calculatePearsonCorrelation(
    records.map((r) => r.temperature),
    records.map((r) => r.precipitation),
    'Temperature',
    'Rainfall'
  );
  const outliersTemp = detectOutliersTukey(records, 'temperature', 'Temperature');
  const outliersRain = detectOutliersTukey(records, 'precipitation', 'Precipitation');

  const totalRainfall = Math.round(records.reduce((a, r) => a + r.precipitation, 0) * 10) / 10;
  const rainyDays = records.filter((r) => r.precipitation > 0.2).length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReportMarkdown = () => {
    const mdContent = `# Weather Data Analysis & Statistics — Academic Project Report
**Course:** Fundamentals of Data Science and Analytics (Group Project)
**Generated:** ${new Date().toLocaleDateString()}
**Dataset:** ${isCustomDataset ? filename || 'User Uploaded CSV' : 'Standard 365-Day Meteorological Dataset'} (${records.length} observations)

---

## 1. Executive Summary & Problem Formulation
This project explores statistical distributions, seasonal variation, bivariate correlation, and anomaly detection across key atmospheric parameters including dry-bulb temperature, relative humidity, precipitation, and wind velocity. 

### Key Dataset Highlights:
- **Total Sample Size (N):** ${records.length} records
- **Geographic Coverage:** ${citySummaries.map((c) => c.city).join(', ')}
- **Mean Temperature:** ${tempStats.mean.toFixed(2)}°C (Range: ${tempStats.min.toFixed(1)}°C to ${tempStats.max.toFixed(1)}°C)
- **Cumulative Rainfall:** ${totalRainfall} mm over ${rainyDays} rainy days (${((rainyDays / records.length) * 100).toFixed(1)}% of days)
- **Mean Relative Humidity:** ${humStats.mean.toFixed(1)}% (IQR: ${humStats.iqr.toFixed(1)}%)
- **Mean Wind Speed:** ${windStats.mean.toFixed(1)} km/h (Max: ${windStats.max.toFixed(1)} km/h)

---

## 2. Comprehensive Descriptive Statistics

| Parameter | Temperature (°C) | Humidity (%) | Rainfall (mm) | Wind Speed (km/h) |
|---|---|---|---|---|
| **Mean (μ)** | ${tempStats.mean.toFixed(2)} | ${humStats.mean.toFixed(2)} | ${rainStats.mean.toFixed(2)} | ${windStats.mean.toFixed(2)} |
| **Median (Q2)** | ${tempStats.median.toFixed(2)} | ${humStats.median.toFixed(2)} | ${rainStats.median.toFixed(2)} | ${windStats.median.toFixed(2)} |
| **Std. Deviation (σ)** | ${tempStats.stdDev.toFixed(2)} | ${humStats.stdDev.toFixed(2)} | ${rainStats.stdDev.toFixed(2)} | ${windStats.stdDev.toFixed(2)} |
| **Variance (s²)** | ${tempStats.variance.toFixed(2)} | ${humStats.variance.toFixed(2)} | ${rainStats.variance.toFixed(2)} | ${windStats.variance.toFixed(2)} |
| **Minimum** | ${tempStats.min.toFixed(2)} | ${humStats.min.toFixed(2)} | ${rainStats.min.toFixed(2)} | ${windStats.min.toFixed(2)} |
| **Maximum** | ${tempStats.max.toFixed(2)} | ${humStats.max.toFixed(2)} | ${rainStats.max.toFixed(2)} | ${windStats.max.toFixed(2)} |
| **Range** | ${tempStats.range.toFixed(2)} | ${humStats.range.toFixed(2)} | ${rainStats.range.toFixed(2)} | ${windStats.range.toFixed(2)} |
| **Q1 (25th Percentile)** | ${tempStats.q1.toFixed(2)} | ${humStats.q1.toFixed(2)} | ${rainStats.q1.toFixed(2)} | ${windStats.q1.toFixed(2)} |
| **Q3 (75th Percentile)** | ${tempStats.q3.toFixed(2)} | ${humStats.q3.toFixed(2)} | ${rainStats.q3.toFixed(2)} | ${windStats.q3.toFixed(2)} |
| **IQR (Q3 - Q1)** | ${tempStats.iqr.toFixed(2)} | ${humStats.iqr.toFixed(2)} | ${rainStats.iqr.toFixed(2)} | ${windStats.iqr.toFixed(2)} |
| **Coeff. of Variation (CV)** | ${tempStats.cv.toFixed(2)}% | ${humStats.cv.toFixed(2)}% | ${rainStats.cv.toFixed(2)}% | ${windStats.cv.toFixed(2)}% |

---

## 3. Bivariate Correlation Analysis (Pearson r)
- **Temperature vs. Humidity:** r = ${tempHumCorr.r.toFixed(3)} (${tempHumCorr.strength}).
  *Interpretation:* ${tempHumCorr.interpretation}
- **Temperature vs. Precipitation:** r = ${tempRainCorr.r.toFixed(3)} (${tempRainCorr.strength}).
  *Interpretation:* ${tempRainCorr.interpretation}

---

## 4. Seasonal Disaggregation (IMD Criteria)
${seasonalStats
  .map(
    (s) =>
      `### ${s.season} (${s.months})
- Observations: ${s.recordCount} days
- Mean Temperature: ${s.avgTemp}°C
- Cumulative Rainfall: ${s.totalRainfall} mm across ${s.rainyDays} rainy days
- Mean Relative Humidity: ${s.avgHumidity}%
- Mean Wind Speed: ${s.avgWindSpeed} km/h`
  )
  .join('\n\n')}

---

## 5. Statistical Outliers (Tukey's IQR Method)
- **Temperature Fences:** [${outliersTemp.lowerFence.toFixed(1)}°C, ${outliersTemp.upperFence.toFixed(1)}°C] — Detected ${outliersTemp.outliers.length} anomalies.
- **Precipitation Fences:** [${outliersRain.lowerFence.toFixed(1)} mm, ${outliersRain.upperFence.toFixed(1)} mm] — Detected ${outliersRain.outliers.length} cloudburst / extreme precipitation events.

---

## 6. Academic Conclusions & Recommendations
1. **Strong Seasonality:** Climatological variables exhibit pronounced quarterly transitions with high monsoonal rainfall concentration.
2. **Hydrological Disparity:** Inter-station comparisons demonstrate distinct micro-climatic regimes between inland northern plain stations and coastal/plateau stations.
3. **Data Science Validation:** Outliers detected correspond to legitimate physical atmospheric phenomena, validating that non-parametric methods are essential for weather analytics.
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Weather_Analysis_Academic_Report.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Academic Project Report Generator
              </h3>
              <p className="text-2xs text-slate-500">
                Fundamentals of Data Science and Analytics — Group Project Documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Academic Report Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
          {/* Title Header */}
          <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-2xs uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">
              Department of Computer Science &amp; Engineering / Analytics
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Weather Data Analysis &amp; Statistics Dashboard
            </h1>
            <div className="text-xs text-slate-500 font-medium">
              Course: Fundamentals of Data Science and Analytics — Comprehensive Group Project
            </div>
            <div className="text-2xs text-slate-400 pt-2 flex items-center justify-center gap-4">
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Dataset: {isCustomDataset ? filename : 'Standard 365-Day Climatology Sample'}</span>
              <span>Sample: N = {records.length} records</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
              1. Executive Project Summary
            </h2>
            <p>
              This investigation explores the statistical properties, probability distributions, bivariate correlations, and temporal fluctuations of meteorological variables recorded across multiple geographical observation stations. Descriptive measures of central tendency, dispersion, quartiles, and Tukey IQR outlier fences were derived using standard mathematical formulations.
            </p>
          </div>

          {/* Section 2: Key Statistical Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
              2. Descriptive Statistics Summary Matrix
            </h2>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-2xs uppercase">
                    <th className="p-2.5">Statistical Parameter</th>
                    <th className="p-2.5">Temperature (°C)</th>
                    <th className="p-2.5">Humidity (%)</th>
                    <th className="p-2.5">Rainfall (mm)</th>
                    <th className="p-2.5">Wind Speed (km/h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2 font-medium">Arithmetic Mean (μ)</td>
                    <td className="p-2 font-bold text-amber-600">{tempStats.mean.toFixed(2)}</td>
                    <td className="p-2 font-bold text-teal-600">{humStats.mean.toFixed(2)}</td>
                    <td className="p-2 font-bold text-blue-600">{rainStats.mean.toFixed(2)}</td>
                    <td className="p-2 font-bold text-emerald-600">{windStats.mean.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Median (50th Percentile)</td>
                    <td className="p-2">{tempStats.median.toFixed(2)}</td>
                    <td className="p-2">{humStats.median.toFixed(2)}</td>
                    <td className="p-2">{rainStats.median.toFixed(2)}</td>
                    <td className="p-2">{windStats.median.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Std. Deviation (σ)</td>
                    <td className="p-2">±{tempStats.stdDev.toFixed(2)}</td>
                    <td className="p-2">±{humStats.stdDev.toFixed(2)}</td>
                    <td className="p-2">±{rainStats.stdDev.toFixed(2)}</td>
                    <td className="p-2">±{windStats.stdDev.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Sample Variance (s²)</td>
                    <td className="p-2">{tempStats.variance.toFixed(2)}</td>
                    <td className="p-2">{humStats.variance.toFixed(2)}</td>
                    <td className="p-2">{rainStats.variance.toFixed(2)}</td>
                    <td className="p-2">{windStats.variance.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Extrema [Min, Max]</td>
                    <td className="p-2">[{tempStats.min.toFixed(1)}, {tempStats.max.toFixed(1)}]</td>
                    <td className="p-2">[{humStats.min.toFixed(1)}, {humStats.max.toFixed(1)}]</td>
                    <td className="p-2">[{rainStats.min.toFixed(1)}, {rainStats.max.toFixed(1)}]</td>
                    <td className="p-2">[{windStats.min.toFixed(1)}, {windStats.max.toFixed(1)}]</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Interquartile Range (IQR)</td>
                    <td className="p-2">{tempStats.iqr.toFixed(2)}</td>
                    <td className="p-2">{humStats.iqr.toFixed(2)}</td>
                    <td className="p-2">{rainStats.iqr.toFixed(2)}</td>
                    <td className="p-2">{windStats.iqr.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Coeff. of Variation (CV)</td>
                    <td className="p-2">{tempStats.cv.toFixed(1)}%</td>
                    <td className="p-2">{humStats.cv.toFixed(1)}%</td>
                    <td className="p-2">{rainStats.cv.toFixed(1)}%</td>
                    <td className="p-2">{windStats.cv.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Bivariate Correlation */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
              3. Correlation &amp; Covariance Findings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">
                  Temperature vs. Humidity
                </div>
                <div className="text-sm font-mono font-bold text-sky-600 mt-0.5">
                  Pearson r = {tempHumCorr.r.toFixed(3)} ({tempHumCorr.strength})
                </div>
                <p className="text-2xs text-slate-500 mt-1">{tempHumCorr.interpretation}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">
                  Temperature vs. Rainfall
                </div>
                <div className="text-sm font-mono font-bold text-sky-600 mt-0.5">
                  Pearson r = {tempRainCorr.r.toFixed(3)} ({tempRainCorr.strength})
                </div>
                <p className="text-2xs text-slate-500 mt-1">{tempRainCorr.interpretation}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Seasonal Disaggregation */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
              4. Seasonal Climatology Matrix
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {seasonalStats.map((s) => (
                <div
                  key={s.season}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-2xs space-y-1"
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{s.season}</div>
                  <div className="text-slate-500">{s.months}</div>
                  <div>Mean Temp: <strong>{s.avgTemp}°C</strong></div>
                  <div>Rainfall: <strong>{s.totalRainfall} mm</strong></div>
                  <div>Humidity: <strong>{s.avgHumidity}%</strong></div>
                  <div>Rainy Days: <strong>{s.rainyDays} d</strong></div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Academic Conclusion */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
              5. Group Project Conclusions
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>Robust Central Tendency Evaluation:</strong> Due to extreme monsoon rainfall skewness, non-parametric measures (median, IQR) provide superior central tendency metrics compared to simple unweighted means.
              </li>
              <li>
                <strong>Coupled Atmospheric Variables:</strong> Strong empirical evidence supports physical thermodynamic laws, particularly inverse temperature-humidity equilibrium and convective storm clustering.
              </li>
              <li>
                <strong>Practical Applicability:</strong> Derived seasonal thresholds directly inform municipal urban drainage benchmarks and agricultural cropping calendars.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
