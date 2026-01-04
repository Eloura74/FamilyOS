from typing import List, Dict, Any
from datetime import datetime

def generate_daily_briefing(weather: Dict[str, Any], events: List[Dict[str, Any]], meals: Dict[str, Any] = {}) -> str:
    """
    Génère un texte naturel résumant la météo, l'agenda et les repas.
    """
    
    # 1. Salutation & Météo
    temp = round(weather['current']['temperature_2m'])
    weather_desc = "Il fait environ {} degrés.".format(temp)
    
    rec_summary = weather.get('recommendation', {}).get('summary', '')
    if rec_summary:
        weather_desc += f" {rec_summary}"

    briefing_parts = [
        "Bonjour la famille !",
        weather_desc
    ]

    # 2. Agenda
    if not events:
        briefing_parts.append("Rien de prévu au calendrier aujourd'hui. Profitez-en !")
    else:
        count = len(events)
        event_word = "événement" if count == 1 else "événements"
        briefing_parts.append(f"Vous avez {count} {event_word} aujourd'hui.")

        # 3. Focus Sacs & Détails
        for event in events:
            title = event.get('title', 'Sans titre')
            
            items = event.get('required_items', [])
            if items:
                items_str = ", ".join(items[:-1]) + " et " + items[-1] if len(items) > 1 else items[0]
                briefing_parts.append(f"Pour {title}, n'oubliez pas de préparer : {items_str}.")

    # 4. Repas (Midi)
    today = datetime.now().strftime("%Y-%m-%d")
    if today in meals and "lunch" in meals[today]:
        lunch_menu = meals[today]["lunch"]
        briefing_parts.append(f"Ce midi, à la cantine, les enfants mangeront : {lunch_menu}.")

    return " ".join(briefing_parts)
