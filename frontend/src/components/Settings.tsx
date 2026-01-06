import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Settings {
  nickname: string;
  briefing_time: string;
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
  wakeup_routine: boolean;
  wakeup_action: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    nickname: "",
    briefing_time: "07:00",
    budget_limit: 1000,
    auto_play_briefing: false,
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

  // UI State
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "profile"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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

  const handleToggleWakeup = async (device: TuyaDevice) => {
    const newStatus = !device.wakeup_routine;
    // Optimistic update
    setTuyaDevices(
      tuyaDevices.map((d) =>
        d.id === device.id ? { ...d, wakeup_routine: newStatus } : d
      )
    );

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/tuya/device/${device.id}/settings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wakeup_routine: newStatus }),
        }
      );
    } catch (error) {
      console.error("Erreur update device:", error);
      // Rollback
      setTuyaDevices(
        tuyaDevices.map((d) =>
          d.id === device.id ? { ...d, wakeup_routine: !newStatus } : d
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
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              Appareils détectés ({tuyaDevices.length})
            </h3>
            {tuyaDevices.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Aucun appareil configuré.
              </p>
            ) : (
              tuyaDevices.map((device) => (
                <div
                  key={device.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-white">
                        {device.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {device.product_name}
                      </p>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        device.online ? "bg-green-500" : "bg-red-500"
                      }`}
                      title={device.online ? "En ligne" : "Hors ligne"}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg">
                    <span className="text-xs text-slate-300 font-medium">
                      Activer au réveil
                    </span>
                    <button
                      onClick={() => handleToggleWakeup(device)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        device.wakeup_routine ? "bg-green-500" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${
                          device.wakeup_routine ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestDevice(device.id, "ON")}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg transition-colors"
                    >
                      Allumer
                    </button>
                    <button
                      onClick={() => handleTestDevice(device.id, "OFF")}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg transition-colors"
                    >
                      Eteindre
                    </button>
                  </div>
                </div>
              ))
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
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Heure du briefing auto
            </label>
            <input
              type="time"
              value={settings.briefing_time}
              onChange={(e) =>
                setSettings({ ...settings, briefing_time: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Lecture automatique</span>
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
    </div>
  );
}
