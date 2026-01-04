export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 p-8 font-['Inter']">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Politique de Confidentialité
        </h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              1. Collecte des données
            </h2>
            <p>
              Family OS est conçu pour respecter votre vie privée. Aucune donnée
              personnelle n'est envoyée à des serveurs tiers non autorisés. Les
              données météo sont récupérées via OpenMeteo de manière anonyme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              2. Stockage local
            </h2>
            <p>
              Vos préférences et configurations sont stockées localement sur
              votre appareil ou sur votre serveur personnel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">
              3. Permissions
            </h2>
            <p>
              L'application peut demander l'accès à :
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>La géolocalisation (pour la météo locale)</li>
                <li>Les notifications (pour les rappels)</li>
              </ul>
            </p>
          </section>

          <div className="pt-8 border-t border-slate-800">
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Retour au Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
