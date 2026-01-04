import { useEffect, useState, useRef } from "react";

interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  recommendation?: {
    summary: string;
    items: string[];
    icon: string;
  };
}

interface CalendarEvent {
  title: string;
  start: string;
  end: string | null;
  all_day: boolean;
  location: string;
  tags: string[];
  required_items: string[];
}

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [meals, setMeals] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État pour les accordéons.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // État pour le briefing
  const [briefingPlaying, setBriefingPlaying] = useState(false);

  // État pour l'upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const playBriefing = async () => {
    try {
      setBriefingPlaying(true);
      const res = await fetch("http://localhost:8000/api/briefing");
      if (!res.ok) throw new Error("Erreur briefing");
      const data = await res.json();

      // Pour l'instant, on utilise l'API Web Speech native du navigateur
      const utterance = new SpeechSynthesisUtterance(data.text);
      utterance.lang = "fr-FR";
      utterance.rate = 1.0;
      utterance.onend = () => setBriefingPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(err);
      setBriefingPlaying(false);
      alert("Impossible de lire le briefing.");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAnalysisResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur upload");

      const data = await res.json();
      console.log("Fichier uploadé:", data);
      setAnalysisResult(data.analysis);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du document.");
    } finally {
      setUploading(false);
    }
  };

  const handleMenuUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true); // On réutilise l'état uploading global pour simplifier
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/meals/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur upload menu");

      const data = await res.json();
      console.log("Menu analysé:", data);
      setMeals(data.full_planning);
      alert("Menu analysé et mis à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse du menu.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weatherRes, eventsRes, mealsRes] = await Promise.all([
          fetch("http://localhost:8000/api/weather/current"),
          fetch("http://localhost:8000/api/calendar/events"),
          fetch("http://localhost:8000/api/meals"),
        ]);

        if (!weatherRes.ok || !eventsRes.ok) throw new Error("Erreur réseau");

        const weatherData = await weatherRes.json();
        const eventsData = await eventsRes.json();
        const mealsData = mealsRes.ok ? await mealsRes.json() : {};

        setWeather(weatherData);
        setEvents(eventsData);
        setMeals(mealsData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-200 w-full max-w-md text-center">
          <p className="font-bold mb-2">Oups !</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Inter'] selection:bg-blue-500/30 pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header Compact */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Bonjour !
            </h1>
            <p className="text-slate-400 text-sm capitalize">{today}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={playBriefing}
              disabled={briefingPlaying}
              className={`p-2 rounded-full border transition-all ${
                briefingPlaying
                  ? "bg-green-500/20 border-green-500 text-green-400 animate-pulse"
                  : "bg-slate-800/50 border-slate-700 text-slate-400"
              }`}
              title="Écouter le briefing"
            >
              {briefingPlaying ? "🔊" : "▶️"}
            </button>
            <a
              href="/settings"
              className="p-2 bg-slate-800/50 rounded-full border border-slate-700 text-slate-400"
            >
              ⚙️
            </a>
          </div>
        </header>

        <div className="space-y-4">
          {/* Carte Météo Ultra-Compacte */}
          <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4">
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
                      Ressenti{" "}
                      {Math.round(weather?.current.temperature_2m || 0)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>💨 {weather?.current.wind_speed_10m} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carte Repas */}
          <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🍽️ Menu du Jour
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSection("meals")}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
                  >
                    📅 Planning
                  </button>
                  <button
                    onClick={() => menuInputRef.current?.click()}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
                  >
                    📷 Scanner
                  </button>
                </div>
                <input
                  type="file"
                  ref={menuInputRef}
                  onChange={handleMenuUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Vue Planning Complet (Accordéon) */}
              {expandedSection === "meals" ? (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {Object.keys(meals).length === 0 ? (
                    <p className="text-slate-500 text-sm italic text-center">
                      Aucun menu scanné.
                    </p>
                  ) : (
                    Object.entries(meals)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([date, meal]: [string, any]) => {
                        const dateObj = new Date(date);
                        const dateLabel = dateObj.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        });
                        const isToday =
                          date === new Date().toISOString().split("T")[0];

                        return (
                          <div
                            key={date}
                            className={`p-3 rounded-xl border ${
                              isToday
                                ? "bg-blue-500/10 border-blue-500/30"
                                : "bg-slate-800/50 border-slate-700/50"
                            }`}
                          >
                            <h3
                              className={`text-xs font-bold uppercase mb-2 ${
                                isToday ? "text-blue-300" : "text-slate-400"
                              }`}
                            >
                              {dateLabel} {isToday && "(Aujourd'hui)"}
                            </h3>
                            <div className="space-y-2">
                              {meal.lunch && (
                                <div className="flex items-start gap-2">
                                  <span className="text-orange-400 text-[10px] font-bold uppercase mt-0.5 w-8 shrink-0">
                                    Midi
                                  </span>
                                  <p className="text-slate-300 text-sm">
                                    {meal.lunch}
                                  </p>
                                </div>
                              )}
                              {meal.dinner && (
                                <div className="flex items-start gap-2">
                                  <span className="text-indigo-400 text-[10px] font-bold uppercase mt-0.5 w-8 shrink-0">
                                    Soir
                                  </span>
                                  <p className="text-slate-300 text-sm">
                                    {meal.dinner}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              ) : (
                /* Vue Compacte (Aujourd'hui uniquement) */
                (() => {
                  const todayKey = new Date().toISOString().split("T")[0];
                  const todayMeal = meals[todayKey];

                  if (!todayMeal)
                    return (
                      <p className="text-slate-500 text-sm italic">
                        Rien de prévu aujourd'hui.
                      </p>
                    );

                  return (
                    <div className="space-y-2">
                      {todayMeal.lunch && (
                        <div className="flex items-start gap-2">
                          <span className="text-orange-400 text-xs font-bold uppercase mt-0.5 w-10 shrink-0">
                            Midi
                          </span>
                          <p className="text-slate-300 text-sm">
                            {todayMeal.lunch}
                          </p>
                        </div>
                      )}
                      {todayMeal.dinner && (
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-400 text-xs font-bold uppercase mt-0.5 w-10 shrink-0">
                            Soir
                          </span>
                          <p className="text-slate-300 text-sm">
                            {todayMeal.dinner}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Accordéon Tenue */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection("clothing")}
              className="w-full p-4 flex items-center justify-between bg-slate-800/30 active:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👕</span>
                <div className="text-left">
                  <h2 className="font-bold text-white text-sm">
                    Tenue conseillée
                  </h2>
                  {!expandedSection && (
                    <p className="text-xs text-purple-300 truncate max-w-[200px]">
                      {weather?.recommendation?.summary}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`transform transition-transform ${
                  expandedSection === "clothing" ? "rotate-180" : ""
                } text-slate-500`}
              >
                ▼
              </span>
            </button>

            {expandedSection === "clothing" && (
              <div className="p-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200">
                <p className="text-lg font-light text-slate-200 leading-relaxed mb-4 mt-4">
                  "{weather?.recommendation?.summary}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {weather?.recommendation?.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accordéon Agenda */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection("calendar")}
              className="w-full p-4 flex items-center justify-between bg-slate-800/30 active:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div className="text-left">
                  <h2 className="font-bold text-white text-sm">
                    Agenda Familial
                  </h2>
                  <p className="text-xs text-emerald-300">
                    {events.length} événement(s) à venir
                  </p>
                </div>
              </div>
              <span
                className={`transform transition-transform ${
                  expandedSection === "calendar" ? "rotate-180" : ""
                } text-slate-500`}
              >
                ▼
              </span>
            </button>

            {expandedSection === "calendar" && (
              <div className="p-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-3 mt-4">
                  {events.length === 0 ? (
                    <p className="text-slate-400 italic text-sm text-center py-2">
                      Rien de prévu pour le moment.
                    </p>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(
                        events.reduce((groups, event) => {
                          const date = event.start.split("T")[0];
                          if (!groups[date]) groups[date] = [];
                          groups[date].push(event);
                          return groups;
                        }, {} as Record<string, typeof events>)
                      ).map(([date, dayEvents]) => {
                        const dateObj = new Date(date);
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        let dateLabel = dateObj.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        });

                        if (dateObj.toDateString() === today.toDateString()) {
                          dateLabel = "Aujourd'hui";
                        } else if (
                          dateObj.toDateString() === tomorrow.toDateString()
                        ) {
                          dateLabel = "Demain";
                        }

                        // Capitalize first letter
                        dateLabel =
                          dateLabel.charAt(0).toUpperCase() +
                          dateLabel.slice(1);

                        return (
                          <div key={date}>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 pl-2 border-b border-slate-800 pb-2">
                              {dateLabel}
                            </h3>
                            <div className="relative border-l-2 border-slate-800 ml-3 space-y-6 py-2 my-2">
                              {dayEvents.map((event, idx) => {
                                const eventDate = new Date(event.start);
                                const isPast = event.end
                                  ? new Date(event.end) < new Date()
                                  : eventDate < new Date();

                                return (
                                  <div key={idx} className="relative pl-6">
                                    {/* Point sur la ligne */}
                                    <div
                                      className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                                        isPast
                                          ? "bg-slate-900 border-slate-700"
                                          : "bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                      }`}
                                    ></div>

                                    {/* Heure */}
                                    <div
                                      className={`text-xs font-bold mb-1 ${
                                        isPast
                                          ? "text-slate-600"
                                          : "text-blue-400"
                                      }`}
                                    >
                                      {event.all_day
                                        ? "JOURNÉE"
                                        : eventDate.toLocaleTimeString(
                                            "fr-FR",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )}
                                    </div>

                                    {/* Carte Événement */}
                                    <div
                                      className={`p-3 rounded-xl border transition-all ${
                                        isPast
                                          ? "bg-slate-900/50 border-slate-800 opacity-60 grayscale-[0.5]"
                                          : "bg-slate-800 border-slate-700 shadow-lg"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <h3
                                            className={`font-bold text-sm ${
                                              isPast
                                                ? "text-slate-400"
                                                : "text-white"
                                            }`}
                                          >
                                            {event.title}
                                          </h3>
                                          {event.location && (
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                              📍 {event.location}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Tags */}
                                      {event.tags && event.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {event.tags.map((tag) => (
                                            <span
                                              key={tag}
                                              className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] rounded uppercase font-bold tracking-wider border border-blue-500/20"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* Sac d'activité */}
                                      {event.required_items &&
                                        event.required_items.length > 0 && (
                                          <div
                                            className={`mt-3 rounded-lg p-2 border ${
                                              isPast
                                                ? "bg-slate-800/50 border-slate-700/50"
                                                : "bg-blue-500/10 border-blue-500/20"
                                            }`}
                                          >
                                            <div
                                              className={`flex items-center gap-2 mb-2 ${
                                                isPast
                                                  ? "text-slate-500"
                                                  : "text-blue-300"
                                              }`}
                                            >
                                              <span className="text-base">
                                                🎒
                                              </span>
                                              <span className="text-[10px] font-bold uppercase">
                                                Sac à préparer
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                              {event.required_items.map(
                                                (item, i) => (
                                                  <span
                                                    key={i}
                                                    className="px-2 py-1 bg-slate-900/80 text-slate-300 text-[10px] rounded border border-slate-700/50"
                                                  >
                                                    {item}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton Flottant Scanner */}
        <button
          onClick={() => {
            setShowUploadModal(true);
            setAnalysisResult(null);
          }}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 transition-all active:scale-95 z-50"
        >
          <span className="text-2xl">📷</span>
        </button>

        {/* Modale Upload & Analyse */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold text-white mb-4">
                {analysisResult ? "Analyse terminée" : "Scanner un document"}
              </h2>

              {!analysisResult ? (
                <>
                  <p className="text-slate-400 text-sm mb-6">
                    Prenez en photo un menu de cantine, une invitation ou une
                    facture. L'IA l'analysera pour vous.
                  </p>

                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      uploading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-blue-500 hover:bg-slate-800/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="text-4xl mb-2">
                      {uploading ? "⏳" : "📄"}
                    </div>
                    <p className="text-blue-400 font-medium">
                      {uploading ? "Analyse en cours..." : "Choisir un fichier"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {uploading
                        ? "Cela peut prendre quelques secondes"
                        : "ou prendre une photo"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {analysisResult.error ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                      {analysisResult.error}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded font-bold uppercase">
                          {analysisResult.type || "Document"}
                        </span>
                        {analysisResult.date && (
                          <span className="text-slate-400 text-xs">
                            📅 {analysisResult.date}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-white">
                        {analysisResult.title}
                      </h3>

                      <p className="text-slate-300 text-sm leading-relaxed">
                        {analysisResult.summary}
                      </p>

                      {analysisResult.action_items &&
                        analysisResult.action_items.length > 0 && (
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase">
                              À retenir
                            </p>
                            <ul className="space-y-1">
                              {analysisResult.action_items.map(
                                (item: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="text-sm text-slate-300 flex items-start gap-2"
                                  >
                                    <span className="text-blue-500 mt-0.5">
                                      •
                                    </span>
                                    {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setShowUploadModal(false)}
                          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                        >
                          Fermer
                        </button>
                        {analysisResult.date && (
                          <button
                            onClick={async () => {
                              try {
                                // Conversion de la date (ex: 06/01/2026 -> ISO)
                                let startIso = new Date().toISOString();
                                const dateParts =
                                  analysisResult.date.split("/");
                                if (dateParts.length === 3) {
                                  // Format JJ/MM/AAAA
                                  const d = new Date(
                                    `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T09:00:00`
                                  );
                                  startIso = d.toISOString();
                                }

                                const res = await fetch(
                                  "http://localhost:8000/api/calendar/events",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      summary: analysisResult.title,
                                      description:
                                        analysisResult.summary +
                                        "\n\n" +
                                        (analysisResult.action_items?.join(
                                          "\n"
                                        ) || ""),
                                      start: startIso,
                                    }),
                                  }
                                );

                                if (!res.ok) throw new Error("Erreur création");

                                alert("Événement ajouté au calendrier !");
                                setShowUploadModal(false);
                                window.location.reload(); // Recharger pour voir l'événement
                              } catch (e) {
                                console.error(e);
                                alert("Erreur lors de l'ajout au calendrier.");
                              }
                            }}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                          >
                            📅 Ajouter
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
