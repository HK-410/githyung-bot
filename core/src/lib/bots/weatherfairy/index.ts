import axios from 'axios';
import { TwitterClient, parseTwitterCredentials } from '@hakyung/x-bot-toolkit';
import { BotRunResult } from '@/lib/cron-handler';

interface ForecastResponseData {
  list: Array<{dt: number, main: {temp_min: number, temp_max: number}, weather: Array<{description: string}>}>
}

interface WeatherData {
  temp: {
    min?: number,
    max?: number,
  },
  weather?: string,
}

const WEATHER_DICTIONARY: {[key: string]: {
  importance: number,
  icon: string,
}} = {
  'clear sky': { importance: 0, icon: '☀️' },
  'few clouds': { importance: 1, icon: '🌤' },
  'scattered clouds': { importance: 2, icon: '⛅' },
  'broken clouds': { importance: 3, icon: '🌥' },
  'mist': { importance: 4, icon: '🌫' },
  'shower rain': { importance: 5, icon: '🌦' },
  'rain': { importance: 6, icon: '🌧' },
  'thunderstorm': { importance: 7, icon: '⛈️' },
  'snow': { importance: 8, icon: '☃️' },
};

const CITIES = [
  { id: 'Seoul', name: '서울' },
  { id: 'Busan', name: '부산' },
  { id: 'Pyongyang', name: '평양' },
];

async function getWeatherDataForCity(cityId: string, today: number, apiKey: string): Promise<WeatherData> {
  const headers = { 
    'User-Agent': 'WeatherFairyBot/1.0 (https://github.com/HK-410/hakyng-bots; hakyung410+weatherfairy@gmail.com)' 
  };
  const response = await axios.get(
    `http://api.openweathermap.org/data/2.5/forecast?q=${cityId}&appid=${apiKey}&lang=en&units=metric`,
    { headers }
  );
  
  const forecastData: ForecastResponseData = response.data;
  const cityWeather: WeatherData = { temp: {} };

  for (const forecast of forecastData.list) {
    const forecastTimeInKST = new Date(new Date(forecast.dt * 1000).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    if (forecastTimeInKST.getUTCDate() !== today) continue;

    if (cityWeather.temp.min === undefined || forecast.main.temp_min < cityWeather.temp.min) {
      cityWeather.temp.min = forecast.main.temp_min;
    }
    if (cityWeather.temp.max === undefined || cityWeather.temp.max < forecast.main.temp_max) {
      cityWeather.temp.max = forecast.main.temp_max;
    }
    for (const weatherInForecast of forecast.weather) {
      const currentDescription = weatherInForecast.description;
      if (WEATHER_DICTIONARY[currentDescription] && 
          (cityWeather.weather === undefined || WEATHER_DICTIONARY[cityWeather.weather].importance < WEATHER_DICTIONARY[currentDescription].importance)) {
        cityWeather.weather = currentDescription;
      }
    }
  }
  return cityWeather;
}

export async function runWeatherfairyBot(isDryRun: boolean): Promise<BotRunResult<undefined>> {
  const runIdentifier = Math.random().toString(36).substring(7);
  console.log(`[weatherfairy-${runIdentifier}] Function start. dryRun=${isDryRun}`);

  const twitterClient = new TwitterClient(parseTwitterCredentials(process.env.X_CREDENTIALS_WEATHERFAIRY!));
  console.log(`[weatherfairy-${runIdentifier}] Clients initialized.`);

  const kstTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  const kstDate = new Date(kstTime);
  const today = kstDate.getUTCDate();
  const fullDateString = `${kstDate.getUTCFullYear()}년 ${kstDate.getUTCMonth() + 1}월 ${kstDate.getUTCDate()}일`;

  const weatherData: {[key: string]: WeatherData} = {};

  console.log(`[weatherfairy-${runIdentifier}] Attempting to fetch weather from OpenWeatherMap`);
  try {
    const weatherPromises = CITIES.map(city => 
      getWeatherDataForCity(city.id, today, process.env.OPENWEATHERMAP_API_KEY!)
    );
    const results = await Promise.all(weatherPromises);
    CITIES.forEach((city, index) => {
      weatherData[city.name] = results[index];
    });
    console.log(`[weatherfairy-${runIdentifier}] Successfully fetched weather data.`);
  } catch (apiError) {
    console.error(`[weatherfairy-${runIdentifier}] OpenWeatherMap API fetch failed:`, apiError);
  }

  const tweetLines = CITIES.map(city => {
    const data = weatherData[city.name];
    const icon = data?.weather ? WEATHER_DICTIONARY[data.weather]?.icon : '❓';
    const maxTemp = data?.temp?.max !== undefined ? Math.round(data.temp.max) : '❓';
    const minTemp = data?.temp?.min !== undefined ? Math.round(data.temp.min) : '❓';
    return `${city.name} ${icon} - 최고: ${maxTemp}℃ | 최저: ${minTemp}℃`;
  });

  const tweetContent = `${fullDateString}\n${tweetLines.join('\n')}`;

  if (isDryRun) {
    console.log(`[weatherfairy-${runIdentifier}] --- DRY RUN ---`);
    console.log(`[weatherfairy-${runIdentifier}] Tweet content (${twitterClient.calculateBytes(tweetContent)} bytes):\n${tweetContent}`);
  } else {
    console.log(`[weatherfairy-${runIdentifier}] Posting tweet...`);
    await twitterClient.postTweet(tweetContent);
    console.log(`[weatherfairy-${runIdentifier}] Successfully posted tweet.`);
  }

  return {
    success: true,
    dryRun: isDryRun,
    tweet: tweetContent,
  };
}
