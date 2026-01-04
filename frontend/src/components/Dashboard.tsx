import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import WeatherCard from "./dashboard/WeatherCard";
import MealsCard from "./dashboard/MealsCard";
import BudgetCard from "./dashboard/BudgetCard";
import ClothingCard from "./dashboard/ClothingCard";
import CalendarCard from "./dashboard/CalendarCard";
import SortableWidget from "./dashboard/SortableWidget";

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
  const [budgetStats, setBudgetStats] = useState<any>(null);
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
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // État pour l'ordre des widgets
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    "weather",
    "meals",
    "budget",
    "clothing",
    "calendar",
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Nécessite un mouvement de 8px pour commencer le drag (évite les clics accidentels)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const savedOrder = localStorage.getItem("dashboardWidgetOrder");
    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Erreur parsing ordre widgets", e);
      }
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("dashboardWidgetOrder", JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

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

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/meals/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

  const handleReceiptUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/budget/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur upload ticket");

      const data = await res.json();
      console.log("Ticket analysé:", data);

      // Recharger les stats
      const statsRes = await fetch("http://localhost:8000/api/budget/stats");
      const statsData = await statsRes.json();
      setBudgetStats(statsData);

      alert(
        `Ticket ajouté : ${data.expense.amount}€ (${data.expense.merchant})`
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse du ticket.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [weatherRes, eventsRes, mealsRes, budgetRes] = await Promise.all([
          fetch("http://localhost:8000/api/weather/current"), // Public ?
          fetch("http://localhost:8000/api/calendar/events", { headers }),
          fetch("http://localhost:8000/api/meals", { headers }),
          fetch("http://localhost:8000/api/budget/stats", { headers }),
        ]);

        if (
          weatherRes.status === 401 ||
          eventsRes.status === 401 ||
          mealsRes.status === 401 ||
          budgetRes.status === 401
        ) {
          throw new Error("Unauthorized");
        }

        if (!weatherRes.ok || !eventsRes.ok) throw new Error("Erreur réseau");

        const weatherData = await weatherRes.json();
        const eventsData = await eventsRes.json();
        const mealsData = mealsRes.ok ? await mealsRes.json() : {};
        const budgetData = budgetRes.ok ? await budgetRes.json() : null;

        setWeather(weatherData);
        setEvents(eventsData);
        setMeals(mealsData);
        setBudgetStats(budgetData);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Impossible de charger les données");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gestion globale des erreurs 401 (Token expiré)
  useEffect(() => {
    if (error === "Unauthorized") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }, [error]);

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

  const renderWidget = (id: string) => {
    switch (id) {
      case "weather":
        return <WeatherCard weather={weather} />;
      case "meals":
        return (
          <MealsCard
            meals={meals}
            toggleSection={toggleSection}
            expandedSection={expandedSection}
            menuInputRef={menuInputRef}
            handleMenuUpload={handleMenuUpload}
          />
        );
      case "budget":
        return (
          <BudgetCard
            budgetStats={budgetStats}
            receiptInputRef={receiptInputRef}
            handleReceiptUpload={handleReceiptUpload}
          />
        );
      case "clothing":
        return (
          <ClothingCard
            weather={weather}
            toggleSection={toggleSection}
            expandedSection={expandedSection}
          />
        );
      case "calendar":
        return (
          <CalendarCard
            events={events}
            toggleSection={toggleSection}
            expandedSection={expandedSection}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Inter'] selection:bg-blue-500/30 pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header Compact */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={widgetOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {widgetOrder.map((id) => (
                <SortableWidget key={id} id={id}>
                  {renderWidget(id)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>

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

                  <div className="space-y-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📸</span> Prendre une photo
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                      {JSON.stringify(analysisResult, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-blue-200 animate-pulse">
                      Analyse en cours...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
