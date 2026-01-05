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

from pydantic import BaseModel

class ItemRequest(BaseModel):
    item: str

@router.post("/events/{event_id}/items")
async def add_item(event_id: str, request: ItemRequest):
    success = await calendar_service.add_item_to_event(event_id, request.item)
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de l'ajout de l'item")
    return {"message": "Item ajouté"}

@router.delete("/events/{event_id}/items/{item}")
async def remove_item(event_id: str, item: str):
    success = await calendar_service.remove_item_from_event(event_id, item)
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression de l'item")
    return {"message": "Item supprimé"}
