import os
import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from backend.core.config import config_manager

router = APIRouter()

# Configuration OAuth
# Note: En prod, il faudra passer en HTTPS
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]
REDIRECT_URI = "http://localhost:8000/api/auth/callback"
CREDENTIALS_FILE = "credentials.json" # Fichier téléchargé depuis Google Console
TOKEN_FILE = "token.json" # Fichier généré après login

@router.get("/login")
async def login():
    """
    Initie le flux OAuth2 et redirige l'utilisateur vers Google.
    """
    # On vérifie d'abord si on a les credentials
    if not os.path.exists(CREDENTIALS_FILE):
        # On essaie de les charger depuis le .env si le fichier n'existe pas
        # (Pour simplifier le déploiement, mais idéalement fichier json)
        client_id = config_manager.get("GOOGLE_CLIENT_ID")
        client_secret = config_manager.get("GOOGLE_CLIENT_SECRET")
        
        if not client_id or not client_secret:
             return JSONResponse(
                status_code=500, 
                content={"error": "Configuration Google manquante. Veuillez configurer GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET ou ajouter credentials.json"}
            )
        
        # Création temporaire du fichier credentials.json pour la lib Google
        # C'est un peu hacky mais la lib google-auth-oauthlib préfère les fichiers
        creds_data = {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        }
        with open(CREDENTIALS_FILE, 'w') as f:
            json.dump(creds_data, f)

    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    return RedirectResponse(authorization_url)

@router.get("/callback")
async def callback(request: Request):
    """
    Gère le retour de Google avec le code d'autorisation.
    """
    code = request.query_params.get('code')
    if not code:
        raise HTTPException(status_code=400, detail="Code manquant")

    try:
        flow = Flow.from_client_secrets_file(
            CREDENTIALS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        # Sauvegarde du token pour utilisation future
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
            
        # Redirection vers le frontend
        return RedirectResponse("http://localhost:5173/")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'authentification: {str(e)}")

@router.get("/status")
async def auth_status():
    """
    Vérifie si l'utilisateur est connecté (token valide).
    """
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            print(f"[DEBUG] Token file found. Valid: {creds.valid}")
            if not creds.valid and creds.expired and creds.refresh_token:
                try:
                    from google.auth.transport.requests import Request as GoogleRequest
                    creds.refresh(GoogleRequest())
                    # Sauvegarde du token rafraîchi
                    with open(TOKEN_FILE, 'w') as token:
                        token.write(creds.to_json())
                except Exception as e:
                    print(f"[DEBUG] Error refreshing token: {e}")
                    os.remove(TOKEN_FILE)
                    return {"authenticated": False}
            
            return {"authenticated": True, "valid": creds.valid}
        except Exception as e:
            print(f"[DEBUG] Error loading token: {e}")
            # Si le token est corrompu (ex: pas de refresh token), on le supprime
            os.remove(TOKEN_FILE)
            return {"authenticated": False}
    print("[DEBUG] Token file NOT found")
    return {"authenticated": False}

@router.post("/logout")
async def logout():
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
    return {"status": "success"}
