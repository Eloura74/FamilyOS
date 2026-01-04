from fastapi import APIRouter, HTTPException
import httpx
from typing import Dict, Any
from backend.integrations.openmeteo import get_weather_forecast

router = APIRouter()

@router.get("/current")
async def get_current_weather() -> Dict[str, Any]:
    """
    Récupère la météo actuelle via OpenMeteo.
    """
    try:
        return await get_weather_forecast()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Erreur lors de la récupération de la météo: {str(e)}")
