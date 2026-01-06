import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import GmailCard from "./dashboard/GmailCard";
import NotesCard from "./dashboard/NotesCard";
import SortableWidget from "./dashboard/SortableWidget";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
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
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État pour les accordéons.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // État pour le briefing
  const [briefingPlaying, setBriefingPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Preload de la musique d'ambiance
  useEffect(() => {
    const music = new Audio("/sounds/ambientWithoutVoice.mp3");
    music.volume = 0.4;
    music.loop = true;
    music.preload = "auto";
    musicRef.current = music;
  }, []);

  // État pour l'upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // État pour la confirmation d'événement (IA)
  const [showEventModal, setShowEventModal] = useState(false);
  const [proposedEvent, setProposedEvent] = useState<any>(null);

  const handleConfirmEvent = async () => {
    if (!proposedEvent) return;

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/calendar/events`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(proposedEvent),
        }
      );

      if (res.ok) {
        setShowEventModal(false);
        setProposedEvent(null);
        await fetchData(false);
        alert("📅 Événement confirmé et ajouté !");
      } else {
        throw new Error("Erreur création événement");
      }
    } catch (error) {
      console.error("Erreur confirmation event:", error);
      alert("Erreur lors de la création de l'événement.");
    }
  };

  // État pour l'ordre des widgets
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    "weather",
    "notes",
    "gmail",
    "meals",
    "budget",
    "clothing",
    "calendar",
  ]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
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
        const parsedOrder = JSON.parse(savedOrder);
        // Ajout de gmail si pas présent (migration)
        if (!parsedOrder.includes("gmail")) {
          parsedOrder.splice(1, 0, "gmail");
        }
        // Ajout de notes si pas présent (migration)
        if (!parsedOrder.includes("notes")) {
          parsedOrder.splice(1, 0, "notes");
        }
        setWidgetOrder(parsedOrder);
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

  const playBriefing = async (briefingId?: string) => {
    try {
      setBriefingPlaying(true);

      // Démarrage immédiat de la musique via la ref préchargée
      if (musicRef.current) {
        musicRef.current.volume = 0.4;
        const playPromise = musicRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Erreur lecture musique:", error);
          });
        }
      }

      let url = `${import.meta.env.VITE_API_URL}/api/briefing`;
      if (briefingId) {
        url += `?briefing_id=${briefingId}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur briefing");
      const data = await res.json();

      if (data.audio_url) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(
          `${import.meta.env.VITE_API_URL}${data.audio_url}`
        );
        audioRef.current = audio;

        audio.onended = () => {
          setBriefingPlaying(false);
          // Fade out music
          if (musicRef.current) {
            const fadeOut = setInterval(() => {
              if (musicRef.current && musicRef.current.volume > 0.01) {
                musicRef.current.volume -= 0.01;
              } else {
                clearInterval(fadeOut);
                musicRef.current?.pause();
              }
            }, 100);
          }
        };

        await audio.play();
      } else {
        // Fallback TTS navigateur
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.lang = "fr-FR";
        utterance.rate = 1.0;
        utterance.onend = () => {
          setBriefingPlaying(false);
          musicRef.current?.pause();
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      setBriefingPlaying(false);
      musicRef.current?.pause();
      alert("Impossible de lire le briefing.");
    }
  };

  const [settings, setSettings] = useState<any>(null);

  const fetchData = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [
        weatherRes,
        eventsRes,
        mealsRes,
        budgetRes,
        gmailRes,
        settingsRes,
      ] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/weather/current`),
        fetch(`${import.meta.env.VITE_API_URL}/api/calendar/events`, {
          headers,
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/meals`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/budget/stats`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/gmail/important`, {
          headers,
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/settings/`, { headers }),
      ]);

      if (
        weatherRes.status === 401 ||
        eventsRes.status === 401 ||
        mealsRes.status === 401 ||
        budgetRes.status === 401 ||
        gmailRes.status === 401 ||
        settingsRes.status === 401
      ) {
        throw new Error("Unauthorized");
      }

      if (!weatherRes.ok || !eventsRes.ok) throw new Error("Erreur réseau");

      const weatherData = await weatherRes.json();
      const eventsData = await eventsRes.json();
      const mealsData = mealsRes.ok ? await mealsRes.json() : {};
      const budgetData = budgetRes.ok ? await budgetRes.json() : null;
      const emailsData = gmailRes.ok ? await gmailRes.json() : [];
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;

      setWeather(weatherData);
      setEvents(eventsData);
      setMeals(mealsData);
      setBudgetStats(budgetData);
      setEmails(emailsData);
      setSettings(settingsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-play briefing logic
  useEffect(() => {
    if (!settings?.auto_play_briefing || !settings?.briefings) return;

    const checkTime = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Check if any enabled briefing matches current time
      const matchingBriefing = settings.briefings.find(
        (b: any) => b.enabled && b.time === currentTime
      );

      if (matchingBriefing && !briefingPlaying) {
        console.log("Auto-playing briefing:", matchingBriefing.title);
        playBriefing(matchingBriefing.id);
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    checkTime(); // Check immediately

    return () => clearInterval(interval);
  }, [settings, briefingPlaying]);

  // Gestion globale des erreurs 401 (Token expiré)
  useEffect(() => {
    if (error === "Unauthorized") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }, [error]);

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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Erreur upload");

      const data = await res.json();
      console.log("Fichier uploadé:", data);
      setAnalysisResult(data.analysis);

      // Si l'IA propose un événement, on ouvre la modale de confirmation
      if (
        data.action_taken === "Proposed Event" &&
        data.analysis.proposed_event
      ) {
        setProposedEvent(data.analysis.proposed_event);
        setShowEventModal(true);
        setShowUploadModal(false); // On ferme la modale d'upload pour afficher celle de l'event
      } else if (data.event_created) {
        // Cas legacy ou fallback
        await fetchData(false);
        setTimeout(() => alert("📅 Événement ajouté à l'agenda !"), 500);
      }
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/meals/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budget/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Erreur upload ticket");

      const data = await res.json();
      console.log("Ticket analysé:", data);

      // Recharger les stats
      const statsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budget/stats`
      );
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
        return (
          <WeatherCard
            weather={weather}
            toggleSection={toggleSection}
            expandedSection={expandedSection}
          />
        );
      case "gmail":
        return (
          <GmailCard
            emails={emails}
            toggleSection={toggleSection}
            expandedSection={expandedSection}
          />
        );
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
            budgetLimit={settings?.budget_limit || 1000}
            receiptInputRef={receiptInputRef}
            handleReceiptUpload={handleReceiptUpload}
            toggleSection={toggleSection}
            expandedSection={expandedSection}
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
      case "notes":
        return (
          <NotesCard
            toggleSection={toggleSection}
            expandedSection={expandedSection}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white font-['Inter'] selection:bg-blue-500/30 pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header Compact */}
        <header className="mb-8 flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white drop-shadow-sm">
              Bonjour{" "}
              <span className="font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-300 via-indigo-300 to-purple-300">
                {settings?.nickname ? settings.nickname : ""}
              </span>
            </h1>
            <p className="text-slate-400 text-sm capitalize mt-1 font-medium tracking-wide opacity-80">
              {today}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={playBriefing}
              disabled={briefingPlaying}
              className={`p-3 rounded-full border transition-all duration-300 shadow-lg ${
                briefingPlaying
                  ? "bg-green-500/20 border-green-500 text-green-400 animate-pulse shadow-green-500/20"
                  : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white backdrop-blur-md"
              }`}
              title="Écouter le briefing"
            >
              {briefingPlaying ? "🔊" : "▶️"}
            </button>
            <a
              href="/settings"
              className="p-3 bg-slate-800/40 rounded-full border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-300 backdrop-blur-md shadow-lg"
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
          className="fixed bottom-6 right-6 p-4 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full shadow-lg shadow-blue-600/30 transition-all active:scale-95 z-50 border border-white/10"
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
                      onClick={async () => {
                        try {
                          // Masquer la modale pour éviter les conflits de z-index avec la caméra
                          setShowUploadModal(false);

                          const image = await Camera.getPhoto({
                            quality: 90,
                            allowEditing: false,
                            resultType: CameraResultType.Uri,
                            source: CameraSource.Prompt, // Retour au menu de choix : Caméra ou Galerie
                          });

                          if (image.webPath) {
                            // Conversion de l'URI en Blob pour l'upload
                            const response = await fetch(image.webPath);
                            const blob = await response.blob();
                            const file = new File(
                              [blob],
                              "camera_capture.jpg",
                              {
                                type: "image/jpeg",
                              }
                            );

                            // Simulation de l'event pour réutiliser la logique existante
                            const event = {
                              target: { files: [file] },
                            } as unknown as React.ChangeEvent<HTMLInputElement>;

                            // Réafficher la modale avant de traiter (ou laisser le traitement le faire)
                            setShowUploadModal(true);
                            handleFileUpload(event);
                          } else {
                            // Si pas d'image (ex: fermeture sans photo), on réaffiche la modale
                            setShowUploadModal(true);
                          }
                        } catch (e) {
                          console.log("Camera cancelled or error", e);
                          // En cas d'erreur ou d'annulation, on réaffiche la modale
                          setShowUploadModal(true);
                        }
                      }}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📸</span> Prendre une photo
                    </button>
                    {/* Input file caché conservé en fallback si besoin, ou supprimé si on veut full natif */}
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
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">
                        ✅
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {analysisResult.title || "Document analysé"}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {analysisResult.type}
                        </p>
                      </div>
                    </div>

                    {analysisResult.summary && (
                      <p className="text-sm text-slate-300 mb-3 bg-slate-900/50 p-3 rounded-lg">
                        {analysisResult.summary}
                      </p>
                    )}

                    {analysisResult.action_items &&
                      analysisResult.action_items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-400 uppercase">
                            Actions détectées
                          </p>
                          <ul className="space-y-1">
                            {analysisResult.action_items.map(
                              (item: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="text-sm text-slate-300 flex items-start gap-2"
                                >
                                  <span className="text-blue-400 mt-1">•</span>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
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

        {/* Modale Confirmation Événement */}
        {showEventModal && proposedEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl shadow-blue-900/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📅</span> Confirmer le RDV
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={proposedEvent.summary}
                    onChange={(e) =>
                      setProposedEvent({
                        ...proposedEvent,
                        summary: e.target.value,
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">
                    Date & Heure
                  </label>
                  <input
                    type="datetime-local"
                    value={proposedEvent.start}
                    onChange={(e) =>
                      setProposedEvent({
                        ...proposedEvent,
                        start: e.target.value,
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">
                    Description
                  </label>
                  <textarea
                    value={proposedEvent.description}
                    onChange={(e) =>
                      setProposedEvent({
                        ...proposedEvent,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white mt-1 focus:border-blue-500 outline-none h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmEvent}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
