import { IceStatus } from './supabase';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

export interface WeatherData {
    temperature: number;
    description: string;
    humidity: number;
    icon: string;
    feelsLike: number;
}

/**
 * Fetch current weather for a location
 */
export async function getWeather(lat: number, lon: number): Promise<WeatherData | null> {
    if (!OPENWEATHER_API_KEY) {
        console.error('OpenWeatherMap API key not configured');
        return null;
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        console.log('Fetching weather for:', lat, lon);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            // console.error('Weather API error:', response.status, errorText);
            // throw new Error(`Weather API request failed: ${response.status}`);
            console.warn(`Weather API warning: ${response.status} (Check API Key)`);
            return null;
        }

        const data = await response.json();

        return {
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            icon: data.weather[0].icon,
            feelsLike: Math.round(data.main.feels_like),
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

/**
 * Determine ice status based on temperature
 * Logic:
 * - Below -10°C: frozen (perfect for skating)
 * - -10°C to 0°C: good (ideal conditions)
 * - 0°C to 5°C: slush (deteriorating)
 * - Above 5°C: melted (unsafe)
 */
export function getIceStatus(temperature: number): IceStatus {
    if (temperature < -10) return 'frozen';
    if (temperature < 0) return 'good';
    if (temperature < 5) return 'slush';
    return 'melted';
}

/**
 * Get ice status with weather data
 */
export async function getIceStatusForLocation(
    lat: number,
    lon: number
): Promise<{ status: IceStatus; temperature: number } | null> {
    const weather = await getWeather(lat, lon);

    if (!weather) {
        return null;
    }

    return {
        status: getIceStatus(weather.temperature),
        temperature: weather.temperature,
    };
}

/**
 * Get a user-friendly ice prediction message
 */
export function getIcePredictionMessage(temperature: number, status: IceStatus): string {
    if (temperature < -10) {
        return `Perfect skating conditions! Ice is frozen solid at ${temperature}°C.`;
    }
    if (temperature < 0) {
        return `Great conditions! Ice should be good at ${temperature}°C.`;
    }
    if (temperature < 5) {
        return `Deteriorating conditions. Ice may be slushy at ${temperature}°C.`;
    }
    return `Too warm for skating. Ice is likely melted at ${temperature}°C.`;
}
