import { useState } from "react";

interface WeatherCardProps {
  weather: any;
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function WeatherCard({
  weather,
  toggleSection,
  expandedSection,
}: WeatherCardProps) {
  const [showForecast, setShowForecast] = useState(false);
  const isExpanded = expandedSection === "weather";

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
    <div
      className={`relative group rounded-3xl transition-all duration-500 ease-out select-none ${
        isExpanded
          ? "bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-3xl"
          : "overflow-hidden bg-linear-to-br from-slate-800/30 to-slate-900/30 border-t border-l border-white/10 border-b border-r border-black/20 shadow-lg hover:shadow-xl hover:bg-slate-800/40 hover:scale-[1.02] backdrop-blur-2xl"
      }`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600/20 to-slate-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none rounded-3xl"></div>

      <button
        onClick={() => toggleSection("weather")}
        className={`w-full p-5 flex items-center justify-between cursor-pointer group relative z-40 transition-all duration-300 ${
          isExpanded
            ? "sticky top-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 rounded-t-3xl shadow-lg"
            : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl drop-shadow-md filter">
            {weather?.recommendation?.icon}
          </div>
          <div className="text-left">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white drop-shadow-sm">
                {Math.round(weather?.current.temperature_2m || 0)}°
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Ressenti {Math.round(weather?.current.temperature_2m || 0)}°
              </span>
            </div>
            {!isExpanded && (
              <div className="text-xs text-blue-300 font-medium mt-0.5">
                Voir les détails
              </div>
            )}
          </div>
        </div>

        <span
          className={`transform transition-transform duration-300 ${
            isExpanded
              ? "rotate-180 text-white"
              : "text-slate-500 group-hover:text-slate-300"
          }`}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="p-5 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300 cursor-default relative z-10">
          <div className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                <span>💨 Vent: {weather?.current.wind_speed_10m} km/h</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowForecast(!showForecast);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`p-2 rounded-xl border transition-all duration-200 ${
                    showForecast
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
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
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-colors flex items-center justify-center"
                  title="Carte Météo"
                >
                  🗺️
                </a>
              </div>
            </div>

            {/* Prévisions sur 3 jours */}
            {showForecast && weather?.daily && (
              <div className="pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-3 gap-3">
                  {weather.daily.time
                    .slice(1, 4)
                    .map((date: string, idx: number) => {
                      const index = idx + 1;
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
                          className="flex flex-col items-center p-3 bg-white/5 rounded-2xl border border-white/5"
                        >
                          <span className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-wider">
                            {dayName}
                          </span>
                          <span className="text-2xl mb-2 drop-shadow-sm">
                            {getWeatherIcon(code)}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span className="text-white">{maxTemp}°</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-400">{minTemp}°</span>
                          </div>
                          {rainProb > 0 && (
                            <span className="text-[10px] text-blue-400 mt-1 font-medium">
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
      )}
    </div>
  );
}
