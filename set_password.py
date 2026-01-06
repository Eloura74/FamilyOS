import sys
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import json

# Charger l'environnement
load_dotenv()

# Configurer le hachage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def set_user_password(email, password):
    file_path = "backend/data/users.json"
    
    if not os.path.exists(file_path):
        print(f"Erreur: Le fichier {file_path} n'existe pas.")
        return

    try:
        with open(file_path, 'r') as f:
            users = json.load(f)
    except json.JSONDecodeError:
        users = []

    user_found = False
    for user in users:
        if user.get('email') == email:
            print(f"Utilisateur trouvé: {email}")
            user['hashed_password'] = get_password_hash(password)
            user_found = True
            break
    
    if not user_found:
        print(f"Utilisateur non trouvé. Création de l'utilisateur {email}...")
        import uuid
        new_user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "hashed_password": get_password_hash(password),
            "role": "admin",
            "is_active": True
        }
        users.append(new_user)

    with open(file_path, 'w') as f:
        json.dump(users, f, indent=2)
    
    print(f"✅ Mot de passe défini avec succès pour {email} !")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python set_password.py <email> <password>")
    else:
        set_user_password(sys.argv[1], sys.argv[2])
