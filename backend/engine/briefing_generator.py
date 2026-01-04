from typing import List, Dict, Any

def generate_daily_briefing(weather: Dict[str, Any], events: List[Dict[str, Any]]) -> str:
    """
    Génère un texte naturel résumant la météo et l'agenda.
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
            # On nettoie un peu le titre pour l'oral (ex: enlever les emojis si besoin, mais les TTS gèrent souvent bien)
            
            items = event.get('required_items', [])
            if items:
                items_str = ", ".join(items[:-1]) + " et " + items[-1] if len(items) > 1 else items[0]
                briefing_parts.append(f"Pour {title}, n'oubliez pas de préparer : {items_str}.")
            
            # Optionnel : dire l'heure si ce n'est pas toute la journée
            # if not event.get('all_day'): ...

    return " ".join(briefing_parts)
