export type IslandWeather = 'sunny' | 'rain' | 'snow' | 'fog' | 'sunrise' | 'night';

export const HOME_WEATHER: Record<IslandWeather, { label: string; background: string; light: string; intensity: number; particle: string; message: string }> = {
  sunny: { label: 'Sunny', background: 'linear-gradient(180deg, #e0ecbd 0%, #d0e6d1 48%, #b6dbe5 100%)', light: '#fff2cd', intensity: 1, particle: '#eecb65', message: 'Your island is finding its light. Let’s take a few gentle steps to help it grow.' },
  rain: { label: 'Rain', background: 'linear-gradient(180deg, #c8d8d6 0%, #b1cbcb 48%, #93b7c4 100%)', light: '#becfe9', intensity: .66, particle: '#e1f3ff', message: 'A little rain is passing through. There’s room to slow down and recover today.' },
  snow: { label: 'Snow', background: 'linear-gradient(180deg, #e7eef1 0%, #d9e8e9 48%, #b8d3e6 100%)', light: '#e1efff', intensity: .83, particle: '#ffffff', message: 'Your island is wrapped in a quiet snowfall. Begin with one small moment of warmth.' },
  fog: { label: 'Misty', background: 'linear-gradient(180deg, #dce1ca 0%, #c8d7ce 48%, #b6ced5 100%)', light: '#dbe5d7', intensity: .73, particle: '#f0f6e9', message: 'Your island feels a little foggy today, so let’s take a few gentle steps to bring back the light.' },
  sunrise: { label: 'Sunrise', background: 'linear-gradient(180deg, #fff0b0 0%, #e9e5be 48%, #bedfe5 100%)', light: '#ffd3a0', intensity: .92, particle: '#ffd770', message: 'A new light is arriving on your island. Your next gentle step can start here.' },
  night: { label: 'Night', background: 'linear-gradient(180deg, #9eb9e9 0%, #8985be 53%, #5f6b87 100%)', light: '#a8b7ff', intensity: .38, particle: '#f4edba', message: 'Your island is settling into the evening. Let’s set the day down gently, one small step at a time.' },
};

export const WEATHER_ORDER: IslandWeather[] = ['sunny', 'rain', 'snow', 'fog', 'sunrise', 'night'];
export function nextWeather(current: IslandWeather): IslandWeather {
  return WEATHER_ORDER[(WEATHER_ORDER.indexOf(current) + 1) % WEATHER_ORDER.length];
}
