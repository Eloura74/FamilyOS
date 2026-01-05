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

@router.get("/")
def get_settings():
    return settings_repo.get_settings()

@router.post("/")
def update_settings(settings: SettingsUpdate):
    current_settings = settings_repo.get_settings()
    
    if settings.nickname is not None:
        current_settings["nickname"] = settings.nickname
    if settings.briefing_time is not None:
        current_settings["briefing_time"] = settings.briefing_time
    if settings.budget_limit is not None:
        current_settings["budget_limit"] = settings.budget_limit
    if settings.auto_play_briefing is not None:
        current_settings["auto_play_briefing"] = settings.auto_play_briefing
        
    return settings_repo.save_settings(current_settings)
