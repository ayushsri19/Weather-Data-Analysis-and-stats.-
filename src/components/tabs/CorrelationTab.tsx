import React, { useState } from 'react';
import {
  Network,
  TrendingUp,
  HelpCircle,
  Sliders,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { WeatherRecord, NumericalVariable } from '../../types';
import {
  calculateCorrelationMatrix,
  calculatePearsonCorrelation,
  calculateLinearRegression,
} from '../../utils/statistics';

interface CorrelationTabProps {
  records: WeatherRecord[];
}

const VARIABLES: { key: NumericalVariable; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'feelsLike', label: 'Feels Like', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'precipitation', label: 'Rainfall', unit: 'mm' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa' },
  { key: 'cloudCover', label: 'Cloud Cover', unit: '%' },
  { key: 'visibility', label: 'Visibility', unit: 'km' },
];

export const CorrelationTab: React.FC<CorrelationTabProps> = ({ records }) => {
  const [varX, setVarX] = useState<NumericalVariable>('temperature');
  const [varY, setVarY] = useState<NumericalVariable>('humidity');

  const varXInfo = VARIABLES.find((v) => v.key === varX) || VARIABLES[0];
  const varYInfo = VARIABLES.find((v) => v.key === varY) || VARIABLES[2];

  const xVals = records.map((r) => Number(r[varX]));
  const yVals = records.map((r) => Number(r[varY]));

  const corr = calculatePearsonCorrelation(xVals, yVals, varXInfo.label, varYInfo.label);
  const regression = calculateLinearRegression(xVals, yVals);
  const matrix = calculateCorrelationMatrix(records, VARIABLES.map((v) => v.key));

  // Downsample for scatter plot if records > 250 for crisp rendering
  const step = Math.max(1, Math.floor(records.length / 200));
  const scatterPoints = records.filter((_, i) => i % step === 0).map((r) => ({
    x: Number(r[varX]),
    y: Number(r[varY]),
    city: r.city,
    date: r.date,
  }));

  // Create regression line endpoints
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const regressionLineData = [
    { x: minX, yFit: Math.round((regression.slope * minX + regression.intercept) * 100) / 100 },
    { x: maxX, yFit: Math.round((regression.slope * maxX + regression.intercept) * 100) / 100 },
  ];

  // Helper for heatmap cell color
  const getHeatmapColor = (r: number) => {
    if (r === 1) return 'bg-sky-600 text-white font-bold';
    if (r > 0.6) return 'bg-blue-500 text-white font-medium';
    if (r > 0.3) return 'bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200';
    if (r > 0.1) return 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300';
    if (r >= -0.1 && r <= 0.1) return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
    if (r < -0.6) return 'bg-rose-500 text-white font-medium';
    if (r < -0.3) return 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200';
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bivariate Correlation &amp; Ordinary Least Squares (OLS) Regression
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluates linear dependence ($r \in [-1, 1]$) between weather variables across {records.length} observations.
            </p>
          </div>
        </div>

        {/* Quick Correlation Pairs Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Key Curated Pairs:</span>
          {[
            { x: 'temperature', y: 'humidity', label: 'Temp vs. Humidity' },
            { x: 'temperature', y: 'windSpeed', label: 'Temp vs. Wind Speed' },
            { x: 'humidity', y: 'precipitation', label: 'Humidity vs. Rainfall' },
            { x: 'temperature', y: 'precipitation', label: 'Temp vs. Rainfall' },
            { x: 'temperature', y: 'pressure', label: 'Temp vs. Pressure' },
          ].map((pair) => (
            <button
              key={pair.label}
              type="button"
              onClick={() => {
                setVarX(pair.x as NumericalVariable);
                setVarY(pair.y as NumericalVariable);
              }}
              className={`px-2.5 py-1 text-2xs font-semibold rounded-md border transition-all ${
                varX === pair.x && varY === pair.y
                  ? 'bg-sky-50 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Scatter Plot & Regression Line Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scatter Plot */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Scatter Plot with Fitted Regression Line
              </h3>
              <p className="text-xs text-slate-500">
                Plotting {varXInfo.label} (X) vs. {varYInfo.label} (Y)
              </p>
            </div>

            {/* Variable Selectors */}
            <div className="flex items-center gap-2 text-xs">
              <div>
                <label className="text-2xs font-semibold text-slate-400 block mb-0.5">X Axis</label>
                <select
                  value={varX}
                  onChange={(e) => setVarX(e.target.value as NumericalVariable)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium"
                >
                  {VARIABLES.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-3" />
              <div>
                <label className="text-2xs font-semibold text-slate-400 block mb-0.5">Y Axis</label>
                <select
                  value={varY}
                  onChange={(e) => setVarY(e.target.value as NumericalVariable)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium"
                >
                  {VARIABLES.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={varXInfo.label}
                  unit={varXInfo.unit}
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={varYInfo.label}
                  unit={varYInfo.unit}
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-slate-900 text-white rounded-lg text-xs shadow-md">
                          <div className="font-bold">{data.city} ({data.date})</div>
                          <div className="mt-1 text-slate-300">
                            {varXInfo.label}: <strong>{data.x} {varXInfo.unit}</strong>
                          </div>
                          <div className="text-slate-300">
                            {varYInfo.label}: <strong>{data.y} {varYInfo.unit}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  name="Observations"
                  data={scatterPoints}
                  fill="#0284c7"
                  opacity={0.65}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistical Interpretation Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
              Pairwise Correlation Metrics
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                r = {corr.r.toFixed(3)}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                {corr.strength}
              </span>
            </div>

            {/* Regression Equation */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-2xs font-semibold text-slate-500 uppercase">
                Fitted Regression Model (OLS)
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                {regression.equation}
              </div>
              <div className="mt-2 text-2xs text-slate-500 flex justify-between">
                <span>R²: <strong>{regression.rSquared.toFixed(3)}</strong></span>
                <span>Slope: <strong>{regression.slope.toFixed(3)}</strong></span>
              </div>
            </div>

            {/* Plain English Scientific Explanation */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Data Science Interpretation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {corr.interpretation}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-2xs text-slate-500">
            Note: Correlation denotes associative covariance, not unilateral causation. Physical atmospheric mechanisms (e.g. saturation vapor pressure) govern these interactions.
          </div>
        </div>
      </div>

      {/* Correlation Matrix Heatmap Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Pearson Correlation Matrix (Heatmap)
          </h3>
          <p className="text-xs text-slate-500">
            Click any cell to immediately focus the bivariate scatter plot on that variable pair.
          </p>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-2xs uppercase text-slate-400 font-semibold">
                  Variable
                </th>
                {VARIABLES.map((v) => (
                  <th
                    key={v.key}
                    className="p-2 text-2xs uppercase text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap"
                  >
                    {v.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIdx) => (
                <tr key={row.variable}>
                  <td className="p-2 text-left font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {VARIABLES[rowIdx]?.label || row.variable}
                  </td>
                  {matrix.map((col, colIdx) => {
                    const rVal = row.values[col.variable];
                    const isSelectedPair =
                      (varX === row.variable && varY === col.variable) ||
                      (varY === row.variable && varX === col.variable);

                    return (
                      <td key={col.variable} className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVarX(row.variable as NumericalVariable);
                            setVarY(col.variable as NumericalVariable);
                          }}
                          className={`w-full py-2 px-1 rounded text-2xs font-mono transition-all ${getHeatmapColor(
                            rVal
                          )} ${isSelectedPair ? 'ring-2 ring-sky-500 scale-105' : 'hover:opacity-85'}`}
                          title={`${row.variable} vs ${col.variable}: r = ${rVal}`}
                        >
                          {rVal !== undefined ? rVal.toFixed(2) : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
