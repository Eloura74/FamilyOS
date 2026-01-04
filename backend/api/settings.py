from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.core.config import config_manager

router = APIRouter()

class SettingsUpdate(BaseModel):
    ical_url: str

@router.get("")
async def get_settings():
    return {
        "ical_url": config_manager.get("ICAL_URL", "")
    }

@router.post("")
async def update_settings(settings: SettingsUpdate):
    config_manager.set("ICAL_URL", settings.ical_url)
    return {"status": "success", "message": "Configuration mise à jour"}
