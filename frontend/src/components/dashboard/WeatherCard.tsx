interface WeatherCardProps {
  weather: any;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 select-none">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur"></div>
      <div className="relative flex items-center justify-between">
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
      </div>
    </div>
  );
}
