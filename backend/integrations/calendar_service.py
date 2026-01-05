import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from backend.engine.activity_tags import analyze_event_for_tags

# Scopes requis
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]
TOKEN_FILE = "token.json"

class CalendarService:
    def __init__(self):
        pass

    def _get_credentials(self):
        creds = None
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        # Si les credentials sont expirés, on essaie de refresh
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            
        return creds

    async def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée un événement dans le calendrier principal.
        event_data attendu: {
            "summary": "Titre",
            "start": "ISO string" OU "YYYY-MM-DD" (All day),
            "end": "ISO string" OU "YYYY-MM-DD" (optionnel),
            "description": "Description" (optionnel)
        }
        """
        creds = self._get_credentials()
        if not creds or not creds.valid:
            raise Exception("Non authentifié")

        service = build('calendar', 'v3', credentials=creds)

        # Détection All Day (si la date fait 10 caractères YYYY-MM-DD)
        is_all_day = len(event_data['start']) == 10
        
        event = {
            'summary': event_data.get('summary', 'Nouvel événement'),
            'description': event_data.get('description', ''),
        }

        if is_all_day:
            event['start'] = {'date': event_data['start']}
            # Pour Google Calendar, la fin d'un événement all-day est le jour suivant
            if 'end' in event_data and event_data['end']:
                 event['end'] = {'date': event_data['end']}
            else:
                 # Par défaut le même jour (donc fin = start + 1 jour)
                 start_date = datetime.strptime(event_data['start'], "%Y-%m-%d")
                 end_date = start_date + timedelta(days=1)
                 event['end'] = {'date': end_date.strftime("%Y-%m-%d")}
        else:
            # Format DateTime
            start_dt = datetime.fromisoformat(event_data['start'].replace('Z', '+00:00'))
            if 'end' in event_data and event_data['end']:
                 end_dt = datetime.fromisoformat(event_data['end'].replace('Z', '+00:00'))
            else:
                 end_dt = start_dt + timedelta(hours=1)
            
            event['start'] = {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Europe/Paris',
            }
            event['end'] = {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Europe/Paris',
            }

        created_event = service.events().insert(calendarId='primary', body=event).execute()
        return created_event

    async def fetch_events(self) -> List[Dict[str, Any]]:
        """
        Récupère les événements via l'API Google Calendar.
        """
        creds = self._get_credentials()
        if not creds or not creds.valid:
            return []

        try:
            service = build('calendar', 'v3', credentials=creds)

            # Fenêtre de temps : Maintenant à Demain fin de journée
            now = datetime.utcnow().isoformat() + 'Z'
            tomorrow = datetime.utcnow() + timedelta(days=7)
            tomorrow_end = tomorrow.replace(hour=23, minute=59, second=59).isoformat() + 'Z'

            events_result = service.events().list(
                calendarId='primary', 
                timeMin=now,
                timeMax=tomorrow_end,
                maxResults=20, 
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            google_events = events_result.get('items', [])
            events = []

            for event in google_events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                summary = event.get('summary', 'Sans titre')
                description = event.get('description', '')
                
                all_day = 'T' not in start
                
                # Analyse des tags
                analysis = analyze_event_for_tags(summary)
                required_items = analysis["items"]

                # Extraction des items depuis la description (format [ITEMS]: item1; item2)
                if description and "[ITEMS]:" in description:
                    try:
                        # On prend tout ce qui est après [ITEMS]:
                        items_part = description.split("[ITEMS]:")[1].strip()
                        # On s'arrête à la fin de la ligne ou du bloc
                        items_part = items_part.split("\n")[0]
                        # On sépare par des points-virgules ou virgules
                        manual_items = [item.strip() for item in items_part.replace(";", ",").split(",") if item.strip()]
                        required_items.extend(manual_items)
                        # Dédoublonnage
                        required_items = list(set(required_items))
                    except Exception as e:
                        print(f"Erreur parsing items description: {e}")

                events.append({
                    "id": event['id'],
                    "title": summary,
                    "start": start,
                    "end": end,
                    "all_day": all_day,
                    "location": event.get('location', ''),
                    "tags": analysis["tags"],
                    "required_items": sorted(required_items)
                })

            return events

        except Exception as e:
            print(f"Erreur API Google Calendar: {e}")
            return []

    async def update_event_description(self, event_id: str, new_description: str) -> bool:
        """Met à jour la description d'un événement."""
        creds = self._get_credentials()
        if not creds or not creds.valid:
            return False

        try:
            service = build('calendar', 'v3', credentials=creds)
            event = service.events().get(calendarId='primary', eventId=event_id).execute()
            
            event['description'] = new_description
            
            service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
            return True
        except Exception as e:
            print(f"Erreur update event: {e}")
            return False

    async def add_item_to_event(self, event_id: str, item: str) -> bool:
        """Ajoute un item à la liste [ITEMS] dans la description."""
        creds = self._get_credentials()
        if not creds or not creds.valid:
            return False

        try:
            service = build('calendar', 'v3', credentials=creds)
            event = service.events().get(calendarId='primary', eventId=event_id).execute()
            
            description = event.get('description', '')
            
            # Parsing existant
            current_items = []
            if "[ITEMS]:" in description:
                parts = description.split("[ITEMS]:")
                pre_items = parts[0]
                items_part = parts[1].split("\n")[0] # Juste la ligne des items
                post_items = "\n".join(parts[1].split("\n")[1:]) if len(parts[1].split("\n")) > 1 else ""
                
                current_items = [i.strip() for i in items_part.replace(";", ",").split(",") if i.strip()]
            else:
                pre_items = description + "\n" if description else ""
                post_items = ""
            
            if item not in current_items:
                current_items.append(item)
                
            new_items_str = ", ".join(current_items)
            new_description = f"{pre_items}[ITEMS]: {new_items_str}\n{post_items}".strip()
            
            event['description'] = new_description
            service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
            return True
        except Exception as e:
            print(f"Erreur add item: {e}")
            return False

    async def remove_item_from_event(self, event_id: str, item: str) -> bool:
        """Retire un item de la liste [ITEMS] dans la description."""
        creds = self._get_credentials()
        if not creds or not creds.valid:
            return False

        try:
            service = build('calendar', 'v3', credentials=creds)
            event = service.events().get(calendarId='primary', eventId=event_id).execute()
            
            description = event.get('description', '')
            
            if "[ITEMS]:" not in description:
                return False

            parts = description.split("[ITEMS]:")
            pre_items = parts[0]
            items_part = parts[1].split("\n")[0]
            post_items = "\n".join(parts[1].split("\n")[1:]) if len(parts[1].split("\n")) > 1 else ""
            
            current_items = [i.strip() for i in items_part.replace(";", ",").split(",") if i.strip()]
            
            if item in current_items:
                current_items.remove(item)
                
            if current_items:
                new_items_str = ", ".join(current_items)
                new_description = f"{pre_items}[ITEMS]: {new_items_str}\n{post_items}".strip()
            else:
                # Plus d'items, on enlève le tag [ITEMS]
                new_description = f"{pre_items}\n{post_items}".strip()
            
            event['description'] = new_description
            service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
            return True
        except Exception as e:
            print(f"Erreur remove item: {e}")
            return False

calendar_service = CalendarService()
