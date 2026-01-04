from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.api import weather, calendar, settings, auth, documents, meals, budget
from backend.engine.briefing_generator import generate_daily_briefing
from backend.integrations.openmeteo import get_weather_forecast
from backend.integrations.calendar_service import calendar_service
import os

app = FastAPI(title="Family OS API", version="0.1.0")

# Configuration CORS pour le frontend React
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
]

from starlette.middleware.sessions import SessionMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de session pour l'authentification
app.add_middleware(SessionMiddleware, secret_key="votre_secret_key_tres_secrete")

# Montage du dossier uploads pour servir les fichiers statiques
os.makedirs("backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

# Inclusion des routeurs
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(budget.router, prefix="/api/budget", tags=["budget"])

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API Family OS"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/briefing")
async def get_briefing():
    """
    Génère le briefing matinal (texte).
    """
    try:
        # Récupération parallèle (ou séquentielle rapide) des données
        weather_data = await get_weather_forecast()
        events_data = await calendar_service.fetch_events()
        
        briefing_text = generate_daily_briefing(weather_data, events_data)
        
        return {"text": briefing_text}
    except Exception as e:
        print(f"Erreur briefing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
