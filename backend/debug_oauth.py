import os
import json
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def check_oauth_config():
    print("\n--- Vérification Configuration Google OAuth ---")
    
    # 1. Vérifier le fichier credentials.json
    creds_file = "credentials.json"
    if os.path.exists(creds_file):
        print(f"[OK] Fichier {creds_file} trouvé.")
        try:
            with open(creds_file, 'r') as f:
                creds = json.load(f)
                web_config = creds.get('web', {})
                client_id = web_config.get('client_id', 'NON TROUVÉ')
                redirect_uris = web_config.get('redirect_uris', [])
                
                print(f"Client ID dans le fichier: {client_id}")
                print(f"Redirect URIs dans le fichier: {redirect_uris}")
        except Exception as e:
            print(f"[ERREUR] Impossible de lire {creds_file}: {e}")
    else:
        print(f"[ATTENTION] Fichier {creds_file} non trouvé. Le backend utilisera les variables d'environnement.")

    # 2. Vérifier les variables d'environnement
    env_client_id = os.getenv("GOOGLE_CLIENT_ID")
    env_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    print(f"\nClient ID (Env): {env_client_id if env_client_id else 'NON DÉFINI'}")
    print(f"Redirect URI utilisé par le code: {env_redirect_uri}")
    
    print("\n--- ACTION REQUISE ---")
    print("1. Allez sur https://console.cloud.google.com/apis/credentials")
    print("2. Sélectionnez votre projet et le client OAuth.")
    print(f"3. Assurez-vous que '{env_redirect_uri}' est EXACTEMENT présent dans 'Authorized redirect URIs'.")
    print("4. Si vous avez modifié le port ou le domaine, mettez à jour la console Google.")

if __name__ == "__main__":
    check_oauth_config()
