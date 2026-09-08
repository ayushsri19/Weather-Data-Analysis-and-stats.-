import { WeatherRecord } from '../types';

// Deterministic pseudo-random number generator for consistent physical data
function createSeededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807 + 1) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSampleDataset(): WeatherRecord[] {
  const records: WeatherRecord[] = [];
  const rand = createSeededRandom(42);

  const cities = [
    {
      name: 'Lucknow',
      lat: 26.8467,
      baseTemp: 25.5,
      tempAmp: 12.0,
      summerPeakDay: 150, // late May
      winterMinDay: 15, // mid Jan
      annualRainfallFactor: 0.9,
      coastal: false,
      elevation: 123,
    },
    {
      name: 'Delhi',
      lat: 28.6139,
      baseTemp: 25.0,
      tempAmp: 14.5,
      summerPeakDay: 152,
      winterMinDay: 12,
      annualRainfallFactor: 0.75,
      coastal: false,
      elevation: 216,
    },
    {
      name: 'Mumbai',
      lat: 19.076,
      baseTemp: 28.0,
      tempAmp: 4.5, // coastal moderation
      summerPeakDay: 140,
      winterMinDay: 20,
      annualRainfallFactor: 2.6, // heavy coastal monsoon
      coastal: true,
      elevation: 14,
    },
    {
      name: 'Bengaluru',
      lat: 12.9716,
      baseTemp: 23.5, // high altitude moderation
      tempAmp: 5.5,
      summerPeakDay: 110, // April peak
      winterMinDay: 10,
      annualRainfallFactor: 1.1,
      coastal: false,
      elevation: 920,
    },
  ];

  const startDate = new Date('2024-01-01');
  const daysInYear = 366; // 2024 is a leap year

  for (let dayIndex = 0; dayIndex < daysInYear; dayIndex++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayIndex);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfYear = dayIndex + 1;
    const month = currentDate.getMonth() + 1; // 1 to 12

    for (const city of cities) {
      // 1. Temperature Calculation with seasonal curve + noise
      const seasonAngle = (2 * Math.PI * (dayOfYear - city.winterMinDay)) / 366;
      let temp = city.baseTemp - city.tempAmp * Math.cos(seasonAngle);

      // Urban Heat Island & synoptic variation (-2 to +2°C)
      const dayNoise = (rand() - 0.5) * 3.5;
      temp = Math.round((temp + dayNoise) * 10) / 10;

      // Ensure city boundaries
      if (city.name === 'Delhi' && month === 1) temp = Math.min(temp, 16.5);
      if (city.name === 'Lucknow' && (month === 5 || month === 6) && rand() > 0.8) temp = Math.max(temp, 42.8);

      // 2. Monsoon and Rainfall
      // Monsoon in India roughly day 160 (June 10) to day 270 (Sept 27)
      let isMonsoonSeason = dayOfYear >= 160 && dayOfYear <= 270;
      let monsoonPeakFactor = 0;
      if (isMonsoonSeason) {
        monsoonPeakFactor = Math.sin((Math.PI * (dayOfYear - 160)) / 110);
      }

      // Pre-monsoon showers in Bengaluru (April-May)
      const isPreMonsoon = city.name === 'Bengaluru' && dayOfYear >= 100 && dayOfYear < 160;

      let rainProb = 0.05;
      if (isMonsoonSeason) {
        rainProb = city.coastal ? 0.65 : 0.45;
      } else if (isPreMonsoon) {
        rainProb = 0.25;
      } else if (month === 1 || month === 12) {
        rainProb = 0.03; // Western disturbances
      }

      let rainfall = 0;
      if (rand() < rainProb) {
        if (isMonsoonSeason) {
          const maxRain = city.coastal ? 120 : 65;
          rainfall = Math.round((rand() * maxRain * monsoonPeakFactor + rand() * 12) * 10) / 10;
        } else {
          rainfall = Math.round((rand() * 15 + 1) * 10) / 10;
        }
      }

      // 3. Humidity (%)
      // Inversely correlated with temp in pre-monsoon, strongly positive with rainfall
      let baseHumidity = city.coastal ? 72 : 48;
      if (isMonsoonSeason) {
        baseHumidity += 26 * monsoonPeakFactor;
      } else if (month >= 3 && month <= 5 && !city.coastal) {
        baseHumidity -= 18; // Dry hot summer in Delhi/Lucknow
      } else if ((month === 12 || month === 1) && !city.coastal) {
        baseHumidity += 18; // Winter morning fog / high humidity
      }
      if (rainfall > 0) baseHumidity += 12;

      let humidity = Math.min(98, Math.max(18, Math.round(baseHumidity + (rand() - 0.5) * 12)));

      // 4. Feels Like Temperature
      // Heat index approximation when warm + humid; wind chill when cold + windy
      let feelsLike = temp;
      if (temp >= 27) {
        const vaporPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
        feelsLike = Math.round((temp + 0.33 * vaporPressure - 4.0) * 10) / 10;
      } else if (temp <= 15) {
        feelsLike = Math.round((temp - 1.2 - rand() * 1.5) * 10) / 10;
      } else {
        feelsLike = Math.round((temp + (rand() - 0.5) * 1.5) * 10) / 10;
      }

      // 5. Wind Speed (km/h)
      let baseWind = city.coastal ? 16 : 11;
      if (isMonsoonSeason) baseWind += 6;
      if (rainfall > 30) baseWind += 10; // convective gust
      const windSpeed = Math.round((baseWind + (rand() - 0.5) * 8) * 10) / 10;

      // 6. Atmospheric Pressure (hPa)
      // Normal range: 1000 - 1018 hPa. Lower in hot summer & monsoon depression.
      let basePressure = 1013 - (city.elevation / 100) * 1.2;
      if (temp > 35) basePressure -= 6;
      if (rainfall > 40) basePressure -= 9; // low pressure system
      if (month === 12 || month === 1) basePressure += 5; // winter high
      const pressure = Math.round((basePressure + (rand() - 0.5) * 3) * 10) / 10;

      // 7. Cloud Cover (%)
      let cloudCover = 15;
      if (rainfall > 0) {
        cloudCover = Math.min(100, Math.round(75 + rand() * 25));
      } else if (isMonsoonSeason) {
        cloudCover = Math.min(100, Math.round(50 + rand() * 40));
      } else if ((month === 12 || month === 1) && !city.coastal) {
        cloudCover = Math.round(35 + rand() * 35); // fog/haze layer
      } else {
        cloudCover = Math.round(rand() * 30);
      }

      // 8. Visibility (km)
      let visibility = 9.5;
      if ((month === 12 || month === 1) && (city.name === 'Delhi' || city.name === 'Lucknow')) {
        visibility = Math.round((rand() * 2.5 + 1.2) * 10) / 10; // winter smog/fog
      } else if (rainfall > 25) {
        visibility = Math.round((rand() * 3.0 + 2.0) * 10) / 10;
      } else if (rainfall > 0) {
        visibility = Math.round((rand() * 4.0 + 4.5) * 10) / 10;
      } else {
        visibility = Math.round((rand() * 2.0 + 8.0) * 10) / 10;
      }

      // 9. Weather Condition Categorization
      let weatherCondition = 'Sunny';
      if (rainfall >= 30) {
        weatherCondition = 'Thunderstorm';
      } else if (rainfall > 0) {
        weatherCondition = 'Rainy';
      } else if (visibility < 3.0 && (month === 12 || month === 1)) {
        weatherCondition = 'Foggy';
      } else if (visibility < 5.0 && !city.coastal) {
        weatherCondition = 'Haze';
      } else if (cloudCover > 70) {
        weatherCondition = 'Overcast';
      } else if (cloudCover > 30) {
        weatherCondition = 'Partly Cloudy';
      } else {
        weatherCondition = 'Sunny';
      }

      records.push({
        id: `${city.name.toLowerCase()}-${dateStr}`,
        date: dateStr,
        city: city.name,
        temperature: temp,
        feelsLike: feelsLike,
        humidity: humidity,
        windSpeed: windSpeed,
        pressure: pressure,
        precipitation: rainfall,
        cloudCover: cloudCover,
        visibility: visibility,
        weatherCondition: weatherCondition,
      });
    }
  }

  return records;
}

export const SAMPLE_WEATHER_DATA: WeatherRecord[] = generateSampleDataset();
