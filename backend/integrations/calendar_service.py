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
            "start": "ISO string",
            "end": "ISO string" (optionnel, défaut +1h),
            "description": "Description" (optionnel)
        }
        """
        creds = self._get_credentials()
        if not creds or not creds.valid:
            raise Exception("Non authentifié")

        service = build('calendar', 'v3', credentials=creds)

        # Construction de l'objet événement Google
        start_dt = datetime.fromisoformat(event_data['start'].replace('Z', '+00:00'))
        
        # Si pas de fin, on met +1h par défaut
        if 'end' in event_data and event_data['end']:
             end_dt = datetime.fromisoformat(event_data['end'].replace('Z', '+00:00'))
        else:
             end_dt = start_dt + timedelta(hours=1)

        event = {
            'summary': event_data.get('summary', 'Nouvel événement'),
            'description': event_data.get('description', ''),
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Europe/Paris',
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Europe/Paris',
            },
        }

        created_event = service.events().insert(calendarId='primary', body=event).execute()
        return created_event

    async def fetch_events(self) -> List[Dict[str, Any]]:
        """
        Récupère les événements via l'API Google Calendar.
        """
        creds = self._get_credentials()
        if not creds or not creds.valid:
            # Si pas de credentials valides, on retourne une liste vide
            # Le frontend détectera qu'on n'est pas connecté via /api/auth/status
            return []

        try:
            service = build('calendar', 'v3', credentials=creds)

            # Fenêtre de temps : Maintenant à Demain fin de journée
            now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
            
            # Calcul de la fin de la période (7 jours)
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
                
                # Détection all_day (si la date n'a pas de T)
                all_day = 'T' not in start
                
                # Analyse des tags et items
                analysis = analyze_event_for_tags(summary)

                events.append({
                    "title": summary,
                    "start": start,
                    "end": end,
                    "all_day": all_day,
                    "location": event.get('location', ''),
                    "tags": analysis["tags"],
                    "required_items": analysis["items"]
                })

            return events

        except Exception as e:
            print(f"Erreur API Google Calendar: {e}")
            return []

calendar_service = CalendarService()
