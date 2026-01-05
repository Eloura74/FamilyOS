from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.repositories.settings import SettingsRepository

router = APIRouter()
settings_repo = SettingsRepository()

class SettingsUpdate(BaseModel):
    nickname: str | None = None
    briefing_time: str | None = None
    budget_limit: int | None = None
    auto_play_briefing: bool | None = None
    home_address: str | None = None
    work_address: str | None = None
    work_arrival_time: str | None = None
    google_maps_key: str | None = None

@router.get("/")
def get_settings():
    return settings_repo.get_settings()

@router.post("/")
def update_settings(settings: SettingsUpdate):
    current_settings = settings_repo.get_settings()
    
    # Mise à jour dynamique de tous les champs présents
    update_data = settings.dict(exclude_unset=True)
    current_settings.update(update_data)
        
    return settings_repo.save_settings(current_settings)

@router.post("/test-traffic")
async def test_traffic(settings: SettingsUpdate):
    """Teste la configuration trafic avec les paramètres fournis."""
    from backend.integrations.traffic_service import traffic_service
    
    if not settings.home_address or not settings.work_address:
        raise HTTPException(status_code=400, detail="Adresses manquantes")
        
    result = await traffic_service.get_commute_time(
        settings.home_address,
        settings.work_address,
        settings.work_arrival_time or "09:00"
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Erreur inconnue"))
        
    return result
