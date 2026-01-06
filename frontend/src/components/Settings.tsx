import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BriefingConfig {
  id: string;
  title: string;
  time: string;
  enabled: bool;
  content: {
    weather: boolean;
    calendar: boolean;
    meals: boolean;
    emails: boolean;
    budget: boolean;
    traffic: boolean;
    notes: boolean;
  };
}

interface Settings {
  nickname: string;
  briefing_time: string; // Deprecated but kept for compatibility
  briefings?: BriefingConfig[];
  budget_limit: number;
  auto_play_briefing: boolean;
  home_address?: string;
  work_address?: string;
  work_arrival_time?: string;
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
}

interface TuyaCredentials {
  api_key: string;
  api_secret: string;
  region: string;
}

interface TuyaDevice {
  id: string;
  name: string;
  category: string;
  product_name: string;
  online: boolean;
  wakeup_routine: boolean; // Deprecated
  briefing_ids: string[]; // New
  wakeup_action: string;
}

// Sortable Device Item Component
function SortableDeviceItem({
  device,
  briefings,
  handleToggleBriefing,
  handleClearBriefings,
  handleTestDevice,
}: {
  device: TuyaDevice;
  briefings: BriefingConfig[];
  handleToggleBriefing: (device: TuyaDevice, briefingId: string) => void;
  handleClearBriefings: (device: TuyaDevice) => void;
  handleTestDevice: (deviceId: string, action: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: device.id });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showBriefingSelect, setShowBriefingSelect] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || showBriefingSelect ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const activeBriefingsCount = device.briefing_ids?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-950 rounded-xl border border-slate-800 transition-all relative"
    >
      {/* Header Compact (Always visible) */}
      <div className="p-3 flex items-center justify-between gap-3">
        {/* Drag Handle & Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 touch-none"
          >
            ☰
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-white truncate">
                {device.name}
              </p>
              <div
                className={`h-2 w-2 rounded-full shrink-0 ${
                  device.online ? "bg-green-500" : "bg-red-500"
                }`}
                title={device.online ? "En ligne" : "Hors ligne"}
              />
            </div>
          </div>
        </div>

        {/* Quick Action (Briefing Link) */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBriefingSelect(!showBriefingSelect);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${
              activeBriefingsCount > 0
                ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
            }`}
            title="Lier aux briefings"
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeBriefingsCount > 0
                ? `${activeBriefingsCount} Briefing${
                    activeBriefingsCount > 1 ? "s" : ""
                  }`
                : "Aucun"}
            </span>
            <span className="text-xs">🔗</span>
          </button>

          {/* Briefing Selection Popover */}
          {showBriefingSelect && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-xs font-bold text-slate-400 px-2 py-1 mb-1 uppercase tracking-wider">
                Activer pour :
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearBriefings(device);
                  setShowBriefingSelect(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors mb-1 ${
                  activeBriefingsCount === 0
                    ? "bg-slate-800 text-slate-300"
                    : "hover:bg-slate-800 text-slate-400"
                }`}
              >
                <span>Aucun</span>
                {activeBriefingsCount === 0 && <span>✓</span>}
              </button>

              {briefings.length === 0 ? (
                <div className="text-xs text-slate-500 px-2 py-1 italic">
                  Aucun briefing créé.
                </div>
              ) : (
                <div className="space-y-1 border-t border-slate-800 pt-1">
                  {briefings.map((briefing) => {
                    const isActive = device.briefing_ids?.includes(briefing.id);
                    return (
                      <button
                        key={briefing.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBriefing(device, briefing.id);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                          isActive
                            ? "bg-blue-600/20 text-blue-300"
                            : "hover:bg-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="truncate">{briefing.title}</span>
                        {isActive && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand/Collapse Chevron */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-500 p-1"
        >
          <span
            className={`block transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
          <div className="h-px bg-slate-800 mb-3" />

          {/* Technical Info */}
          <div className="mb-3 text-xs text-slate-500 space-y-1">
            <p>
              Modèle:{" "}
              <span className="text-slate-400">{device.product_name}</span>
            </p>
            <p>
              ID: <span className="text-slate-400 font-mono">{device.id}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleTestDevice(device.id, "ON")}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg transition-colors font-medium"
            >
              Allumer
            </button>
            <button
              onClick={() => handleTestDevice(device.id, "OFF")}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg transition-colors font-medium"
            >
              Eteindre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    nickname: "",
    briefing_time: "07:00",
    budget_limit: 1000,
    auto_play_briefing: false,
    briefings: [],
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Tuya State
  const [tuyaCredentials, setTuyaCredentials] = useState<TuyaCredentials>({
    api_key: "",
    api_secret: "",
    region: "eu",
  });
  const [tuyaDevices, setTuyaDevices] = useState<TuyaDevice[]>([]);
  const [syncingTuya, setSyncingTuya] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Briefing Modal State
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<BriefingConfig | null>(
    null
  );
  const [briefingForm, setBriefingForm] = useState<BriefingConfig>({
    id: "",
    title: "",
    time: "07:00",
    enabled: true,
    content: {
      weather: true,
      calendar: true,
      meals: true,
      emails: true,
      budget: true,
      traffic: true,
      notes: true,
    },
  });

  // UI State
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "profile"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
    fetchTuyaDevices();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [settingsRes, expensesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/settings/`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/budget/`, { headers }),
      ]);

      if (settingsRes.status === 401 || expensesRes.status === 401) {
        throw new Error("Unauthorized");
      }

      const settingsData = await settingsRes.json();
      const expensesData = await expensesRes.json();

      // Ensure briefings array exists
      if (!settingsData.briefings) {
        settingsData.briefings = [];
      }

      setSettings(settingsData);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error: any) {
      console.error("Erreur chargement settings:", error);
      if (error.message === "Unauthorized") {
        setError("Session expirée. Veuillez vous reconnecter.");
      } else {
        setError("Impossible de charger les paramètres.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTuyaDevices = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tuya/devices`
      );
      if (res.ok) {
        const data = await res.json();
        setTuyaDevices(data);
      }

      // Fetch credentials too
      const credsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tuya/credentials`
      );
      if (credsRes.ok) {
        const creds = await credsRes.json();
        if (creds && creds.api_key) {
          setTuyaCredentials(creds);
        }
      }
    } catch (error) {
      console.error("Erreur chargement Tuya:", error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetch(`${import.meta.env.VITE_API_URL}/api/settings/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(settings),
      });

      alert("Paramètres sauvegardés !");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncTuya = async () => {
    setSyncingTuya(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tuya/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tuyaCredentials),
      });
      if (res.ok) {
        const devices = await res.json();
        setTuyaDevices(devices);
        alert(`Succès ! ${devices.length} appareils trouvés.`);
      } else {
        const err = await res.json();
        alert("Erreur de synchronisation : " + err.detail);
      }
    } catch (error) {
      alert("Erreur de connexion au serveur.");
    } finally {
      setSyncingTuya(false);
    }
  };

  const handleToggleBriefing = async (
    device: TuyaDevice,
    briefingId: string
  ) => {
    const currentIds = device.briefing_ids || [];
    let newIds: string[];

    if (currentIds.includes(briefingId)) {
      newIds = currentIds.filter((id) => id !== briefingId);
    } else {
      newIds = [...currentIds, briefingId];
    }

    // Optimistic update
    setTuyaDevices(
      tuyaDevices.map((d) =>
        d.id === device.id ? { ...d, briefing_ids: newIds } : d
      )
    );

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/tuya/device/${device.id}/settings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ briefing_ids: newIds }),
        }
      );
    } catch (error) {
      console.error("Erreur update device:", error);
      // Rollback
      setTuyaDevices(
        tuyaDevices.map((d) =>
          d.id === device.id ? { ...d, briefing_ids: currentIds } : d
        )
      );
    }
  };

  const handleClearBriefings = async (device: TuyaDevice) => {
    const currentIds = device.briefing_ids || [];

    // Optimistic update
    setTuyaDevices(
      tuyaDevices.map((d) =>
        d.id === device.id ? { ...d, briefing_ids: [] } : d
      )
    );

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/tuya/device/${device.id}/settings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ briefing_ids: [] }),
        }
      );
    } catch (error) {
      console.error("Erreur update device:", error);
      // Rollback
      setTuyaDevices(
        tuyaDevices.map((d) =>
          d.id === device.id ? { ...d, briefing_ids: currentIds } : d
        )
      );
    }
  };

  const handleTestDevice = async (deviceId: string, action: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tuya/device/${deviceId}/command`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) alert("Commande envoyée !");
        else alert("Echec de la commande (appareil hors ligne ?)");
      }
    } catch (error) {
      alert("Erreur réseau");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budget/expenses/${id}`,
        {
          method: "DELETE",
          headers: headers,
        }
      );

      if (res.ok) {
        setExpenses(expenses.filter((e) => e.id !== id));
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Erreur suppression dépense:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTuyaDevices((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Briefing Management
  const openBriefingModal = (briefing?: BriefingConfig) => {
    if (briefing) {
      setEditingBriefing(briefing);
      setBriefingForm(briefing);
    } else {
      setEditingBriefing(null);
      setBriefingForm({
        id: crypto.randomUUID(),
        title: "",
        time: "07:00",
        enabled: true,
        content: {
          weather: true,
          calendar: true,
          meals: true,
          emails: true,
          budget: true,
          traffic: true,
          notes: true,
        },
      });
    }
    setShowBriefingModal(true);
  };

  const saveBriefing = () => {
    if (!briefingForm.title) {
      alert("Veuillez donner un titre au briefing.");
      return;
    }

    let updatedBriefings = [...(settings.briefings || [])];

    if (editingBriefing) {
      updatedBriefings = updatedBriefings.map((b) =>
        b.id === editingBriefing.id ? briefingForm : b
      );
    } else {
      updatedBriefings.push(briefingForm);
    }

    setSettings({ ...settings, briefings: updatedBriefings });
    setShowBriefingModal(false);
  };

  const deleteBriefing = (id: string) => {
    if (!confirm("Supprimer ce briefing ?")) return;
    const updatedBriefings = (settings.briefings || []).filter(
      (b) => b.id !== id
    );
    setSettings({ ...settings, briefings: updatedBriefings });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // Reusable Section Component
  const SettingsSection = ({
    id,
    title,
    icon,
    children,
    colorFrom = "from-slate-800",
    colorTo = "to-slate-900",
  }: {
    id: string;
    title: string;
    icon: string;
    children: React.ReactNode;
    colorFrom?: string;
    colorTo?: string;
  }) => {
    const isExpanded = expandedSection === id;

    return (
      <div
        className={`relative group rounded-3xl transition-all duration-500 ease-out select-none ${
          isExpanded
            ? "bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-3xl"
            : "overflow-hidden bg-linear-to-br from-slate-800/30 to-slate-900/30 border-t border-l border-white/10 border-b border-r border-black/20 shadow-lg hover:shadow-xl hover:bg-slate-800/40 hover:scale-[1.02] backdrop-blur-2xl"
        }`}
      >
        <button
          onClick={() => toggleSection(id)}
          className={`w-full p-5 flex items-center justify-between cursor-pointer group relative z-40 transition-all duration-300 ${
            isExpanded
              ? "sticky top-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 rounded-t-3xl shadow-lg"
              : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-10 w-10 rounded-xl bg-linear-to-br ${colorFrom} ${colorTo} flex items-center justify-center text-xl text-white shadow-lg ring-1 ring-white/10`}
            >
              {icon}
            </div>
            <h2 className="font-medium text-white text-base tracking-wide">
              {title}
            </h2>
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
          <div className="p-5 pt-0 animate-in slide-in-from-top-2 duration-300 cursor-default relative z-10">
            <div className="mt-4 space-y-4">{children}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Inter'] pb-32">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            ⬅️
          </Link>
          <h1 className="text-xl font-bold">Paramètres</h1>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          title="Sauvegarder"
        >
          💾
        </button>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Profil */}
        <SettingsSection
          id="profile"
          title="Profil"
          icon="👤"
          colorFrom="from-blue-600"
          colorTo="to-indigo-600"
        >
          <div>
            <label className="block text-sm text-slate-400 mb-1">Pseudo</label>
            <input
              type="text"
              value={settings.nickname}
              onChange={(e) =>
                setSettings({ ...settings, nickname: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>
        </SettingsSection>

        {/* Domotique (Tuya) */}
        <SettingsSection
          id="tuya"
          title="Domotique (Tuya)"
          icon="🏠"
          colorFrom="from-cyan-600"
          colorTo="to-blue-700"
        >
          {/* Configuration API */}
          <div className="space-y-4 mb-6 border-b border-slate-800 pb-6">
            <p className="text-xs text-slate-400">
              Connectez votre compte Tuya IoT pour piloter vos appareils.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Access ID (Client ID)"
                value={tuyaCredentials.api_key}
                onChange={(e) =>
                  setTuyaCredentials({
                    ...tuyaCredentials,
                    api_key: e.target.value,
                  })
                }
                className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
              />
              <input
                type="password"
                placeholder="Access Secret"
                value={tuyaCredentials.api_secret}
                onChange={(e) =>
                  setTuyaCredentials({
                    ...tuyaCredentials,
                    api_secret: e.target.value,
                  })
                }
                className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
              />
              <select
                value={tuyaCredentials.region}
                onChange={(e) =>
                  setTuyaCredentials({
                    ...tuyaCredentials,
                    region: e.target.value,
                  })
                }
                className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="eu">Europe (EU)</option>
                <option value="us">Americas (US)</option>
                <option value="cn">China (CN)</option>
                <option value="in">India (IN)</option>
              </select>
            </div>
            <button
              onClick={handleSyncTuya}
              disabled={
                syncingTuya ||
                !tuyaCredentials.api_key ||
                !tuyaCredentials.api_secret
              }
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {syncingTuya
                ? "Synchronisation..."
                : "🔄 Synchroniser les appareils"}
            </button>
          </div>

          {/* Liste des appareils */}
          <div className="space-y-3">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                Appareils détectés ({tuyaDevices.length})
              </h3>
              <p className="text-xs text-slate-500">
                Liez vos appareils aux briefings (Matin, Soir...) pour qu'ils
                s'activent automatiquement.
              </p>
            </div>
            {tuyaDevices.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Aucun appareil configuré.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tuyaDevices.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tuyaDevices.map((device) => (
                      <SortableDeviceItem
                        key={device.id}
                        device={device}
                        briefings={settings.briefings || []}
                        handleToggleBriefing={handleToggleBriefing}
                        handleClearBriefings={handleClearBriefings}
                        handleTestDevice={handleTestDevice}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </SettingsSection>

        {/* Briefing */}
        <SettingsSection
          id="briefing"
          title="Briefing Vocal"
          icon="📢"
          colorFrom="from-purple-600"
          colorTo="to-fuchsia-600"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">
                Lecture automatique
              </span>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    auto_play_briefing: !settings.auto_play_briefing,
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.auto_play_briefing ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.auto_play_briefing ? "left-7" : "left-1"
                  }`}
                ></div>
              </button>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Briefing List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Mes Briefings
                </h3>
                <button
                  onClick={() => openBriefingModal()}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg transition-colors"
                >
                  + Nouveau
                </button>
              </div>

              {(!settings.briefings || settings.briefings.length === 0) && (
                <p className="text-sm text-slate-500 italic">
                  Aucun briefing configuré.
                </p>
              )}

              {settings.briefings?.map((briefing) => (
                <div
                  key={briefing.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg text-lg">
                      ⏰
                    </div>
                    <div>
                      <p className="font-bold text-white">{briefing.title}</p>
                      <p className="text-xs text-slate-500">{briefing.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openBriefingModal(briefing)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteBriefing(briefing.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Budget */}
        <SettingsSection
          id="budget"
          title="Budget"
          icon="💰"
          colorFrom="from-emerald-600"
          colorTo="to-teal-600"
        >
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Limite Mensuelle (€)
            </label>
            <input
              type="number"
              value={settings.budget_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  budget_limit: parseInt(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Dernières Dépenses
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {expenses.length > 0 ? (
                expenses.slice(0, 10).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <div>
                      <p className="font-medium text-sm">{expense.merchant}</p>
                      <p className="text-xs text-slate-500">{expense.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400">
                        {expense.amount}€
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Aucune dépense récente.
                </p>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* Trafic & Trajet */}
        <SettingsSection
          id="traffic"
          title="Trafic & Trajet"
          icon="🚗"
          colorFrom="from-orange-600"
          colorTo="to-red-600"
        >
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Adresse Domicile
            </label>
            <input
              type="text"
              placeholder="10 rue de la Paix, Paris"
              value={settings.home_address || ""}
              onChange={(e) =>
                setSettings({ ...settings, home_address: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Adresse Travail
            </label>
            <input
              type="text"
              placeholder="La Défense, Puteaux"
              value={settings.work_address || ""}
              onChange={(e) =>
                setSettings({ ...settings, work_address: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Heure d'arrivée souhaitée
            </label>
            <input
              type="time"
              value={settings.work_arrival_time || "09:00"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  work_arrival_time: e.target.value,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Le calcul du trafic utilise Waze (gratuit, sans clé API).
          </p>

          <button
            onClick={async () => {
              try {
                const res = await fetch(
                  `${import.meta.env.VITE_API_URL}/api/settings/test-traffic`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                  }
                );
                if (res.ok) {
                  const data = await res.json();
                  alert(
                    `Succès ! Trajet estimé : ${data.duration_text}. Départ conseillé : ${data.departure_time}`
                  );
                } else {
                  const err = await res.json();
                  alert("Erreur : " + err.detail);
                }
              } catch (e) {
                alert("Erreur de connexion au serveur");
              }
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-slate-700"
          >
            Tester la configuration
          </button>
        </SettingsSection>
      </div>

      {/* Sticky Footer Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex justify-center z-50">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full max-w-md py-4 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Sauvegarde...
            </>
          ) : (
            <>
              <span>💾</span> Enregistrer les modifications
            </>
          )}
        </button>
      </div>

      {/* Briefing Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingBriefing ? "Modifier le briefing" : "Nouveau briefing"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Titre (ex: Matin, Soir)
                </label>
                <input
                  type="text"
                  value={briefingForm.title}
                  onChange={(e) =>
                    setBriefingForm({ ...briefingForm, title: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="Mon Briefing"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Heure de déclenchement
                </label>
                <input
                  type="time"
                  value={briefingForm.time}
                  onChange={(e) =>
                    setBriefingForm({ ...briefingForm, time: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-400 mb-1">
                  Contenu du briefing
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "weather", label: "Météo", icon: "🌤️" },
                    { key: "calendar", label: "Agenda", icon: "📅" },
                    { key: "meals", label: "Repas", icon: "🍽️" },
                    { key: "emails", label: "Emails", icon: "📧" },
                    { key: "budget", label: "Budget", icon: "💰" },
                    { key: "traffic", label: "Trafic", icon: "🚗" },
                    { key: "notes", label: "Notes", icon: "📝" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() =>
                        setBriefingForm({
                          ...briefingForm,
                          content: {
                            ...briefingForm.content,
                            [item.key]:
                              !briefingForm.content[
                                item.key as keyof typeof briefingForm.content
                              ],
                          },
                        })
                      }
                      className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                        briefingForm.content[
                          item.key as keyof typeof briefingForm.content
                        ]
                          ? "bg-blue-600/20 border-blue-500 text-blue-200"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBriefingModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveBriefing}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
