export default function Login() {
  const handleLogin = () => {
    // Redirection vers le backend pour initier OAuth
    window.location.href = `${
      import.meta.env.VITE_API_URL
    }/api/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Inter']">
      <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 max-w-md w-full text-center backdrop-blur-xl">
        <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-lg shadow-blue-500/20">
          🏠
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
        <p className="text-slate-400 mb-8">
          Connectez-vous pour accéder à votre Family OS
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Continuer avec Google
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-slate-700 flex-1" />
          <span className="text-slate-500 text-sm">OU</span>
          <div className="h-px bg-slate-700 flex-1" />
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);
            try {
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                {
                  method: "POST",
                  body: formData,
                }
              );
              if (res.ok) {
                const data = await res.json();
                window.location.href = `/auth/callback?token=${data.access_token}`;
              } else {
                alert("Erreur de connexion");
              }
            } catch (err) {
              alert("Erreur réseau");
            }
          }}
          className="space-y-3"
        >
          <input
            name="username"
            type="email"
            placeholder="Email"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-500">
          En continuant, vous acceptez notre{" "}
          <a href="/privacy" className="underline hover:text-slate-400">
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
}
