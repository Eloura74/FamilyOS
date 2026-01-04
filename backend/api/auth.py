import os
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, Any, Optional
from pydantic import BaseModel
import uuid
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

from backend.security import verify_password, get_password_hash, create_access_token, decode_access_token
from backend.repositories.users import UserRepository
from backend.core.config import config_manager

router = APIRouter()
repo = UserRepository()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Configuration JWT ---
class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "user"

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Configuration Google OAuth ---
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1' # Dev only
SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]
# Utiliser une variable d'environnement pour l'URI de redirection, avec une valeur par défaut
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

# Définition des chemins absolus pour éviter les erreurs de dossier courant
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")

# --- Routes JWT (App Auth) ---

@router.post("/register", response_model=Dict[str, Any])
async def register(user: UserCreate):
    if repo.get_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "role": user.role,
        "is_active": True
    }
    repo.add(new_user)
    return {"id": new_user["id"], "email": new_user["email"], "role": new_user["role"]}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = repo.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=401, detail="Token invalide")
        
    user = repo.get_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

async def get_current_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user

@router.get("/me")
async def read_users_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"], "role": current_user["role"]}

# --- Routes Google OAuth (Unified Login) ---

@router.get("/google/login")
async def google_login():
    """Initie le flux OAuth2 pour Google Calendar & Login App."""
    if not os.path.exists(CREDENTIALS_FILE):
        # Fallback config
        client_id = config_manager.get("GOOGLE_CLIENT_ID")
        client_secret = config_manager.get("GOOGLE_CLIENT_SECRET")
        if client_id and client_secret:
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
        else:
             return JSONResponse(status_code=500, content={"error": "Credentials Google manquants"})

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

@router.get("/google/callback")
async def google_callback(request: Request):
    print(f"DEBUG: Google Callback hit. Params: {request.query_params}")
    code = request.query_params.get('code')
    if not code:
        print("DEBUG: No code in callback")
        raise HTTPException(status_code=400, detail="Code manquant")

    try:
        print("DEBUG: Building flow...")
        flow = Flow.from_client_secrets_file(
            CREDENTIALS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        print("DEBUG: Fetching token...")
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        # 1. Sauvegarde du token pour le Calendar Service (Backend)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
            
        # 2. Récupération infos user (via id_token ou userinfo)
        # google-auth-oauthlib gère automatiquement le id_token si openid est demandé
        # Mais on peut aussi utiliser la session pour récupérer les infos
        from google.auth.transport.requests import Request as GoogleRequest
        from google.oauth2 import id_token
        
        # On doit valider le id_token
        # Note: flow.fetch_token a déjà récupéré le id_token dans creds.id_token
        
        if not creds.id_token:
             # Fallback si pas d'id_token (ne devrait pas arriver avec scope openid)
             raise HTTPException(status_code=400, detail="Pas d'ID Token Google")

        # On décode le id_token (sans vérifier la signature car on vient de le recevoir de Google via TLS)
        # Ou mieux, on le vérifie.
        # Pour simplifier ici, on fait confiance au canal TLS direct
        decoded_token = id_token.verify_oauth2_token(
            creds.id_token, 
            GoogleRequest(), 
            audience=creds.client_id
        )
        
        email = decoded_token.get('email')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email introuvable dans le token Google")

        # 3. Gestion User Local (Find or Create)
        user = repo.get_by_email(email)
        if not user:
            # Création automatique
            new_user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "hashed_password": get_password_hash(str(uuid.uuid4())), # Mot de passe aléatoire
                "role": "admin" if email in ["votre_email@gmail.com"] else "user", # TODO: Configurer liste admin
                "is_active": True
            }
            repo.add(new_user)
            user = new_user
            
        # 4. Génération JWT App
        access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
        
        # 5. Redirection Frontend avec Token
        return RedirectResponse(f"http://localhost:5173/auth/callback?token={access_token}")
        
    except Exception as e:
        print(f"Erreur Google Callback: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur Google Auth: {str(e)}")

@router.get("/google/status")
async def google_status():
    """Vérifie le token Google Calendar."""
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            return {"authenticated": True, "valid": creds.valid}
        except:
            return {"authenticated": False}
    return {"authenticated": False}
