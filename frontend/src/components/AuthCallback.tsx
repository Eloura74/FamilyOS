import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      // On force un rechargement pour que App.tsx prenne en compte le token
      // Ou on pourrait utiliser un contexte, mais le reload est simple et efficace ici
      window.location.href = "/";
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-['Inter']">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-200 font-medium">Connexion en cours...</p>
      </div>
    </div>
  );
}
