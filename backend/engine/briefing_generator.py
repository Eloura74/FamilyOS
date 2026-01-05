from typing import List, Dict, Any
from datetime import datetime, timedelta

def generate_daily_briefing(weather: Dict[str, Any], events: List[Dict[str, Any]], meals: Dict[str, Any] = {}, emails: List[Dict[str, Any]] = [], nickname: str = "la famille") -> str:
    """
    Génère un texte naturel résumant la météo, l'agenda (aujourd'hui et demain) et les préparations.
    """
    
    # 1. Salutation & Météo
    temp = round(weather['current']['temperature_2m'])
    weather_desc = "Il fait environ {} degrés.".format(temp)
    
    rec_summary = weather.get('recommendation', {}).get('summary', '')
    if rec_summary:
        weather_desc += f" {rec_summary}"

    briefing_parts = [
        f"Bonjour {nickname} !",
        weather_desc
    ]

    # Filtrage des événements (Aujourd'hui vs Demain)
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    today_events = []
    tomorrow_events = []

    for event in events:
        # Gestion start date (ISO ou Date simple)
        start = event.get('start', '')
        # On garde juste la partie date YYYY-MM-DD
        if 'T' in start:
            date_str = start.split('T')[0]
        else:
            date_str = start
        
        if date_str == today_str:
            today_events.append(event)
        elif date_str == tomorrow_str:
            tomorrow_events.append(event)

    # 2. Agenda Aujourd'hui
    if not today_events:
        briefing_parts.append("Rien de prévu au calendrier aujourd'hui. Profitez-en !")
    else:
        count = len(today_events)
        event_word = "événement" if count == 1 else "événements"
        briefing_parts.append(f"Aujourd'hui, vous avez {count} {event_word}.")
        
        for event in today_events:
            title = event.get('title', 'Sans titre')
            items = event.get('required_items', [])
            
            if items:
                items_str = ", ".join(items[:-1]) + " et " + items[-1] if len(items) > 1 else items[0]
                briefing_parts.append(f"Pour {title}, n'oubliez pas d'emporter : {items_str}.")
            else:
                briefing_parts.append(f"{title}.")

    # 3. Agenda Demain (Préparations & Aperçu)
    if tomorrow_events:
        briefing_parts.append("Pour demain :")
        for event in tomorrow_events:
            title = event.get('title', 'Sans titre')
            items = event.get('required_items', [])
            
            if items:
                items_str = ", ".join(items[:-1]) + " et " + items[-1] if len(items) > 1 else items[0]
                briefing_parts.append(f"Pour {title}, pensez à préparer : {items_str}.")
            else:
                briefing_parts.append(f"Vous avez {title}.")

    # 4. Repas (Midi)
    if today_str in meals and "lunch" in meals[today_str]:
        lunch_menu = meals[today_str]["lunch"]
        # Nettoyage pour le vocal : "Entrée, Plat et Dessert"
        if "+" in lunch_menu:
            parts = [p.strip() for p in lunch_menu.split("+")]
            if len(parts) > 1:
                lunch_menu = ", ".join(parts[:-1]) + " et " + parts[-1]
        
        briefing_parts.append(f"Ce midi, à la cantine, les enfants mangeront : {lunch_menu}.")

    # 5. Emails Importants
    if emails:
        count = len(emails)
        briefing_parts.append(f"Vous avez {count} emails importants en attente.")
        for email in emails:
            sender = email.get('sender', 'Inconnu')
            subject = email.get('subject', 'Sans objet')
            briefing_parts.append(f"Un message de {sender} concernant {subject}.")

    briefing_parts.append("Je vous souhaite une excellente journée !")

    return " ".join(briefing_parts)
