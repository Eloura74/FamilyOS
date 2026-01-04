import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [icalUrl, setIcalUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setIcalUrl(data.ical_url || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMessage({
          type: "error",
          text: "Impossible de charger la configuration",
        });
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:8000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ical_url: icalUrl }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      setMessage({ type: "success", text: "Configuration sauvegardée !" });

      // Petit délai pour que l'utilisateur voie le message
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Chargement...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-['Inter'] p-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Réglages</h1>
        </header>

        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="icalUrl"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                URL du Calendrier (iCal / ICS)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Lien privé vers votre Google Agenda, iCloud ou autre. Doit se
                terminer par .ics
              </p>
              <input
                type="text"
                id="icalUrl"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl ${
                  message.type === "success"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
