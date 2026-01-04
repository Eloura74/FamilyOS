from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.integrations.calendar_service import calendar_service

router = APIRouter()

@router.get("/events")
async def get_events() -> List[Dict[str, Any]]:
    """
    Récupère les événements du jour et du lendemain.
    """
    events = await calendar_service.fetch_events()
    return events

@router.post("/events")
async def create_event(event_data: Dict[str, Any]):
    """
    Crée un événement dans le calendrier.
    """
    try:
        return await calendar_service.create_event(event_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
