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

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    nickname: "",
    briefing_time: "07:00",
    budget_limit: 1000,
    auto_play_briefing: false,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
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
      // Ensure expensesData is an array before setting
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error: any) {
      console.error("Erreur chargement settings:", error);
      if (error.message === "Unauthorized") {
        setError("Session expirée. Veuillez vous reconnecter.");
        // Optionnel: Redirection vers login
        // window.location.href = "/login";
      } else {
        setError("Impossible de charger les paramètres.");
      }
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Inter'] p-4 pb-20">
      <header className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="p-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          ⬅️
        </Link>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </header>

      <div className="space-y-8 max-w-md mx-auto">
        {/* Profil */}
        <section className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            👤 Profil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Pseudo
              </label>
              <input
                type="text"
                value={settings.nickname}
                onChange={(e) =>
                  setSettings({ ...settings, nickname: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Briefing */}
        <section className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            📢 Briefing Vocal
          </h2>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* Budget */}
        <section className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            💰 Budget
          </h2>
          <div className="space-y-4">
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
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {expenses.length > 0 ? (
                  expenses.slice(0, 10).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {expense.merchant}
                        </p>
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
          </div>
        </section>

        {/* Trafic & Trajet */}
        <section className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            🚗 Trafic & Trajet
          </h2>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
