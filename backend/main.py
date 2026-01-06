from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from fastapi import HTTPException

from backend.api import weather, calendar, meals, budget, documents, auth, gmail, settings
from backend.integrations.tts import generate_audio_briefing
from backend.integrations.calendar_service import calendar_service
from backend.integrations.openmeteo import get_weather_forecast
from backend.integrations.gmail_service import gmail_service
from backend.repositories.meals import MealRepository
from backend.engine.briefing_generator import generate_daily_briefing
from backend.integrations.tuya_manager import TuyaManager

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod, restreindre à l'URL du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montage des fichiers statiques (sons, images uploadées)
# Assurez-vous que le dossier existe
Path("backend/uploads").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

# Managers
tuya_manager = TuyaManager()

# Inclusion des routeurs
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(meals.router, prefix="/api/meals", tags=["Meals"])
app.include_router(budget.router, prefix="/api/budget", tags=["Budget"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(gmail.router, prefix="/api/gmail", tags=["Gmail"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
from backend.api import notes
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])

# --- Routes Tuya ---

@app.post("/api/tuya/sync")
async def sync_tuya(credentials: dict):
    try:
        tuya_manager.connect_cloud(
            credentials["api_key"],
            credentials["api_secret"],
            credentials["region"]
        )
        devices = tuya_manager.sync_devices()
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tuya/devices")
async def get_tuya_devices():
    return tuya_manager.get_devices()

@app.get("/api/tuya/credentials")
async def get_tuya_credentials():
    creds = tuya_manager.get_credentials()
    # On renvoie tout pour que le user n'ait pas à retaper, 
    # mais en prod on pourrait masquer le secret.
    # Ici le user veut que ça reste enregistré pour resynchro.
    return creds

@app.post("/api/tuya/device/{device_id}/settings")
async def update_tuya_settings(device_id: str, settings: dict):
    updated = tuya_manager.update_device_settings(device_id, settings)
    if not updated:
        raise HTTPException(status_code=404, detail="Device not found")
    return updated

@app.post("/api/tuya/device/{device_id}/command")
async def send_tuya_command(device_id: str, command: dict):
    # command expects {"action": "ON" | "OFF"}
    success = tuya_manager.send_command(device_id, command.get("action"))
    return {"success": success}

@app.post("/api/tuya/wakeup")
async def trigger_wakeup():
    results = tuya_manager.execute_wakeup_routine()
    return results

# --- Fin Routes Tuya ---

@app.get("/")
def read_root():
    return {"message": "FamilyOS Backend is running"}

@app.get("/api/briefing")
async def get_briefing():
    try:
        # 1. Récupération des données
        weather_data = await get_weather_forecast()
        events = await calendar_service.fetch_events()
        
        meal_repo = MealRepository()
        meals_data = meal_repo.get_all_dict()
        
        # Récupération des emails importants
        emails = gmail_service.fetch_important_emails(limit=3)

        # Récupération des paramètres pour le pseudo et le trafic
        from backend.repositories.settings import SettingsRepository
        from backend.integrations.traffic_service import traffic_service
        
        settings_repo = SettingsRepository()
        settings = settings_repo.get_settings()
        nickname = settings.get("nickname", "la famille")
        
        # Récupération du temps de trajet si configuré
        commute_info = None
        if settings.get("home_address") and settings.get("work_address"):
            traffic_result = await traffic_service.get_commute_time(
                settings["home_address"],
                settings["work_address"],
                settings.get("work_arrival_time", "09:00")
            )
            if traffic_result.get("success"):
                commute_info = traffic_result

        # Récupération des notes du frigo
        from backend.repositories.notes import NotesRepository
        notes_repo = NotesRepository()
        notes_data = notes_repo.get_all_notes()

        # 2. Génération du texte
        briefing_text = generate_daily_briefing(weather_data, events, meals_data, emails, nickname, commute_info, notes_data)
        
        # 3. Génération Audio (TTS)
        audio_url = await generate_audio_briefing(briefing_text)
        
        # 4. Déclenchement Domotique (Réveil)
        # On lance la routine domotique en tâche de fond (ou on attend, c'est rapide)
        # Ici on l'appelle simplement pour qu'elle s'exécute au moment du briefing
        try:
            tuya_manager.execute_wakeup_routine()
        except Exception as e:
            print(f"Erreur domotique: {e}")
        
        return {
            "text": briefing_text,
            "audio_url": audio_url
        }
    except Exception as e:
        print(f"Erreur briefing: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
