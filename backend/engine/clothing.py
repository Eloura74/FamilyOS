from typing import List, Dict, Any
from pydantic import BaseModel

class ClothingRecommendation(BaseModel):
    summary: str
    items: List[str]
    icon: str  # emoji ou nom d'icône

def get_clothing_recommendation(weather_data: Dict[str, Any]) -> ClothingRecommendation:
    """
    Génère une recommandation vestimentaire basée sur la météo actuelle.
    """
    # Extraction des données météo (OpenMeteo structure)
    # current_units = weather_data.get("current_units", {})
    current = weather_data.get("current", {})
    
    temp = current.get("temperature_2m", 20)
    is_raining = current.get("rain", 0) > 0 or current.get("showers", 0) > 0
    is_snowing = current.get("snowfall", 0) > 0
    wind_speed = current.get("wind_speed_10m", 0)

    items = []
    summary = ""
    icon = "🙂"

    # Logique simple de température
    if temp < 5:
        summary = "Il fait très froid ! Pensez à vous couvrir chaudement."
        items.extend(["Gros manteau", "Bonnet", "Echarpe", "Gants"])
        icon = "🥶"
    elif temp < 12:
        summary = "Le fond de l'air est frais, prévoyez une veste chaude."
        items.extend(["Manteau", "Pull chaud"])
        icon = "😬"
    elif temp < 18:
        summary = "Température douce, une petite laine suffit."
        items.extend(["Veste légère", "Sweat"])
        icon = "🙂"
    elif temp < 25:
        summary = "Il fait bon !"
        items.extend(["T-shirt", "Pantalon léger"])
        icon = "😎"
    else:
        summary = "Il fait chaud ! Pensez à vous hydrater."
        items.extend(["T-shirt", "Short", "Casquette"])
        icon = "🥵"

    # Conditions spécifiques
    if is_raining:
        summary += " Et n'oubliez pas le parapluie !"
        items.append("Imperméable")
        items.append("Parapluie")
        if temp < 15:
            items.append("Bottes de pluie")
    
    if is_snowing:
        summary += " Attention ça glisse !"
        items.append("Bottes de neige")

    return ClothingRecommendation(
        summary=summary,
        items=items,
        icon=icon
    )
