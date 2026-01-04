import { useState } from "react";

interface WeatherCardProps {
  weather: any;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const [showForecast, setShowForecast] = useState(false);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "⛅";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95 && code <= 99) return "⛈️";
    return "❓";
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 select-none">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur"></div>
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{weather?.recommendation?.icon}</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {Math.round(weather?.current.temperature_2m || 0)}°
                </span>
                <span className="text-sm text-slate-400">
                  Ressenti {Math.round(weather?.current.temperature_2m || 0)}°
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>💨 {weather?.current.wind_speed_10m} km/h</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowForecast(!showForecast);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Prévisions"
            >
              📅
            </button>
            <a
              href="https://www.windy.com/?43.517,4.983,10"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
              title="Carte Météo"
            >
              🗺️
            </a>
          </div>
        </div>

        {/* Prévisions sur 3 jours */}
        {showForecast && weather?.daily && (
          <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-3 gap-2">
              {weather.daily.time
                .slice(1, 4)
                .map((date: string, idx: number) => {
                  const index = idx + 1; // On saute aujourd'hui (index 0)
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString("fr-FR", {
                    weekday: "short",
                  });
                  const code = weather.daily.weather_code[index];
                  const maxTemp = Math.round(
                    weather.daily.temperature_2m_max[index]
                  );
                  const minTemp = Math.round(
                    weather.daily.temperature_2m_min[index]
                  );
                  const rainProb =
                    weather.daily.precipitation_probability_max[index];

                  return (
                    <div
                      key={date}
                      className="flex flex-col items-center p-2 bg-slate-800/50 rounded-xl border border-slate-700/50"
                    >
                      <span className="text-xs text-slate-400 uppercase font-bold mb-1">
                        {dayName}
                      </span>
                      <span className="text-2xl mb-1">
                        {getWeatherIcon(code)}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <span className="text-white">{maxTemp}°</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{minTemp}°</span>
                      </div>
                      {rainProb > 0 && (
                        <span className="text-[10px] text-blue-400 mt-1">
                          💧 {rainProb}%
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
