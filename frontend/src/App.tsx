import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import Privacy from "./components/Privacy";
import Settings from "./components/Settings";
import Login from "./components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/auth/status")
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-['Inter']">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-200 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
        />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
