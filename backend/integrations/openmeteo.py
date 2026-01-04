import httpx
from typing import Dict, Any
from backend.engine.clothing import get_clothing_recommendation

# Coordonnées par défaut (Paris) - À rendre configurable plus tard
LATITUDE = 43.51667
LONGITUDE = 4.98333

async def get_weather_forecast() -> Dict[str, Any]:
    """
    Récupère la météo actuelle via OpenMeteo et ajoute les recommandations vestimentaires.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "current": ["temperature_2m", "apparent_temperature", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "wind_speed_10m"],
        "timezone": "auto"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Intégration du moteur de règles
        recommendation = get_clothing_recommendation(data)
        
        # Enrichissement de la réponse
        data["recommendation"] = recommendation.dict()
        
        return data
