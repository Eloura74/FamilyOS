import os
from typing import List, Dict, Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import base64
from bs4 import BeautifulSoup

# Scopes (doit correspondre à auth.py)
SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly'
]
TOKEN_FILE = "token.json"

class GmailService:
    def __init__(self):
        pass

    def _get_credentials(self):
        creds = None
        if os.path.exists(TOKEN_FILE):
            try:
                creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            except ValueError:
                # Si les scopes ont changé, le token peut être invalide pour ce set
                return None
        
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                return None
            
        return creds

    def fetch_important_emails(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Récupère les emails non lus et importants.
        """
        creds = self._get_credentials()
        if not creds or not creds.valid:
            print("GmailService: Non authentifié ou token invalide")
            return []

        try:
            service = build('gmail', 'v1', credentials=creds)

            # Requête : non lu ET (Important OU Starred)
            # 'is:unread is:important' ou 'is:unread label:IMPORTANT'
            query = 'is:unread is:important'
            
            results = service.users().messages().list(userId='me', q=query, maxResults=limit).execute()
            messages = results.get('messages', [])
            
            emails = []
            for msg in messages:
                msg_detail = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                
                payload = msg_detail.get('payload', {})
                headers = payload.get('headers', [])
                
                subject = "Sans objet"
                sender = "Inconnu"
                
                for h in headers:
                    if h['name'] == 'Subject':
                        subject = h['value']
                    if h['name'] == 'From':
                        sender = h['value']
                
                snippet = msg_detail.get('snippet', '')
                
                # Nettoyage simple de l'expéditeur (ex: "Google <no-reply@google.com>" -> "Google")
                if "<" in sender:
                    sender = sender.split("<")[0].strip().replace('"', '')

                emails.append({
                    "id": msg['id'],
                    "subject": subject,
                    "sender": sender,
                    "snippet": snippet
                })
                
            return emails

        except Exception as e:
            print(f"Erreur API Gmail: {e}")
            return []

gmail_service = GmailService()
