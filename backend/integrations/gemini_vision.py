import os
import google.generativeai as genai
import mimetypes
import mimetypes
from pathlib import Path
from typing import Dict, Any
from datetime import datetime, timedelta
import json

# Configuration de l'API Key
# Elle doit être définie dans les variables d'environnement : GOOGLE_API_KEY
def configure_gemini():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("WARNING: GOOGLE_API_KEY not found in environment variables.")
        return False
    genai.configure(api_key=api_key)
    return True

async def analyze_image_with_gemini(image_path: str) -> Dict[str, Any]:
    """
    Analyse une image avec Gemini Flash pour extraire des informations structurées.
    """
    if not configure_gemini():
        return {
            "error": "Clé API Google manquante. Veuillez configurer GOOGLE_API_KEY dans le fichier .env"
        }

    try:
        # Chargement du modèle (Flash Latest - Version stable gratuite)
        model_name = 'gemini-flash-latest'
        model = genai.GenerativeModel(model_name)

        # Détection du type MIME
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type:
            mime_type = 'image/jpeg' # Fallback

        # Chargement de l'image
        image_data = Path(image_path).read_bytes()
        
        # Préparation de l'image pour l'API
        cookie_picture = {
            'mime_type': mime_type,
            'data': image_data
        }

        prompt = """
        Tu es un assistant personnel intelligent pour une famille.
        Analyse ce document ou cette image.
        
        TA MISSION :
        1. Identifie le type de document en cherchant des mots-clés spécifiques.
        2. Détermine l'action de routage appropriée.
        
        RÈGLES DE ROUTAGE (Priorité Absolue) :
        
        --- CAS SPÉCIAL : NOTES MANUSCRITES / POST-ITS ---
        Si c'est une note manuscrite ou un post-it, analyse le CONTENU :
        A. Si ça contient une ACTION ou un RDV (ex: "Appeler Docteur", "Prendre RDV", "Aller chez...", "Réserver", "Penser à...") -> Type = "Event" (Routing: add_event)
        B. Si c'est juste une info passive, une liste de courses, ou une pensée (ex: "Acheter du lait", "Code wifi...", "Idée cadeau") -> Type = "Note" (Routing: add_note)
        
        --- AUTRES CAS ---
        - "Facture", "Ticket", "Total", "TTC" -> Type = "Facture" (Routing: add_expense)
        - "Rendez-vous", "RDV", "Meeting", "Consultation" (Document officiel) -> Type = "Event" (Routing: add_event)
        - "Menu", "Cantine", "Repas" -> Type = "Menu" (Routing: add_menu)
        
        Extrais les informations clés sous format JSON strict :
        {
            "type": "Note | Facture | Event | Menu | Autre",
            "routing_action": "add_note | add_expense | add_event | none",
            
            "title": "Titre principal ou résumé court",
            "date": "Date de l'événement ou du document (YYYY-MM-DD) ou null",
            "summary": "Résumé en 1 ou 2 phrases.",
            "action_items": ["Liste", "des choses", "à faire"],
            
            // CHAMPS SPÉCIFIQUES
            "amount": 0.00, // (Si Facture)
            "merchant": "Nom du magasin", // (Si Facture)
            "category": "Catégorie", // (Si Facture)
            
            "note_content": "Contenu complet du texte" // (Si Note)
        }
        
        Réponds UNIQUEMENT le JSON.
        """

        response = model.generate_content([prompt, cookie_picture])
        
        # Nettoyage de la réponse pour extraire le JSON
        text_response = response.text.strip()
        
        # Tentative d'extraction plus robuste (cherche le premier { et le dernier })
        try:
            start_idx = text_response.find('{')
            end_idx = text_response.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = text_response[start_idx : end_idx + 1]
                return json.loads(json_str)
            else:
                # Fallback si pas de JSON détecté
                raise ValueError("Pas de structure JSON trouvée")
                
        except json.JSONDecodeError as json_err:
            print(f"Erreur de parsing JSON: {json_err}")
            print(f"Réponse brute reçue: {text_response}")
            return {
                "error": "L'IA n'a pas renvoyé un format valide.",
                "raw_response": text_response
            }

    except Exception as e:
        print(f"Erreur Gemini Vision ({model_name}): {e}")
        
        # Debug: Lister les modèles disponibles
        try:
            print("Modèles disponibles :")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f"- {m.name}")
        except Exception as list_error:
            print(f"Impossible de lister les modèles: {list_error}")

        return {
            "error": f"Erreur lors de l'analyse : {str(e)}",
            "raw_response": str(e)
        }

async def analyze_menu_image(image_path: str) -> Dict[str, Any]:
    """
    Analyse une image de menu (cantine/planning) pour extraire les repas par date.
    """
    if not configure_gemini():
        return {"error": "Clé API manquante"}

    try:
        model_name = 'gemini-flash-latest'
        model = genai.GenerativeModel(model_name)

        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type: mime_type = 'image/jpeg'
        
        image_data = Path(image_path).read_bytes()
        cookie_picture = {'mime_type': mime_type, 'data': image_data}

        today = datetime.now()
        today_str = today.strftime("%Y-%m-%d")
        current_year = today.year
        
        # Calcul du lundi de la semaine en cours
        start_of_week = today - timedelta(days=today.weekday())
        start_of_week_str = start_of_week.strftime("%Y-%m-%d")
        
        # Calcul du lundi de la semaine prochaine
        next_week = start_of_week + timedelta(weeks=1)
        next_week_str = next_week.strftime("%Y-%m-%d")

        prompt = f"""
        Analyse ce menu de cantine ou ce planning de repas.
        
        CONTEXTE TEMPOREL CRITIQUE :
        - Nous sommes le : {today_str} (Année {current_year})
        - Le Lundi de cette semaine était le : {start_of_week_str}
        - Le Lundi de la semaine prochaine sera le : {next_week_str}
        
        TA MISSION :
        Extrais les repas pour chaque jour visible en trouvant la DATE EXACTE (YYYY-MM-DD).
        
        RÈGLES DE DÉDUCTION DES DATES :
        1. Le document mentionne souvent juste "Lundi 6", "Mardi 7".
        2. Compare ce numéro de jour (ex: 6) avec les dates de référence ci-dessus.
        3. Choisis la date la plus logique (celle qui correspond au numéro du jour dans le mois courant ou proche).
        4. EXEMPLE : Si on est le 04/01 et que le menu dit "Lundi 6", c'est le 06/01/2026 (Semaine prochaine).
        5. EXEMPLE : Si on est le 04/01 et que le menu dit "Lundi 30", c'est probablement le 30/12/2025 (Semaine passée).
        
        Format de sortie JSON attendu :
        {{
            "YYYY-MM-DD": {{
                "lunch": "Entrée + Plat + Dessert",
                "dinner": "Plat du soir (si indiqué)"
            }}
        }}
        
        Règles :
        - Si un jour n'a pas de repas, ne l'inclus pas.
        - Réponds UNIQUEMENT le JSON.
        """

        response = model.generate_content([prompt, cookie_picture])
        
        text_response = response.text.strip()
        start_idx = text_response.find('{')
        end_idx = text_response.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = text_response[start_idx : end_idx + 1]
            return json.loads(json_str)
        else:
            raise ValueError("Pas de JSON trouvé")

    except Exception as e:
        print(f"Erreur Analyse Menu: {e}")
        return {"error": str(e)}

async def analyze_receipt_image(image_path: str) -> Dict[str, Any]:
    """
    Analyse une image de ticket de caisse pour extraire montant, date et catégorie.
    """
    if not configure_gemini():
        return {"error": "Clé API manquante"}

    try:
        model_name = 'gemini-flash-latest'
        model = genai.GenerativeModel(model_name)

        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type: mime_type = 'image/jpeg'
        
        image_data = Path(image_path).read_bytes()
        cookie_picture = {'mime_type': mime_type, 'data': image_data}

        prompt = """
        Analyse ce ticket de caisse.
        
        Extrais les informations suivantes au format JSON :
        {
            "merchant": "Nom du magasin",
            "date": "YYYY-MM-DD (Date de l'achat)",
            "amount": 0.00 (Montant total TTC, float),
            "category": "Catégorie (Alimentation, Maison, Transport, Loisirs, Santé, Autre)",
            "items": ["Liste", "des", "articles", "principaux"]
        }
        
        Règles :
        1. Si la date est illisible, utilise la date d'aujourd'hui.
        2. Pour la catégorie, déduis-la des articles achetés.
        3. Réponds UNIQUEMENT le JSON.
        """

        response = model.generate_content([prompt, cookie_picture])
        
        text_response = response.text.strip()
        start_idx = text_response.find('{')
        end_idx = text_response.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = text_response[start_idx : end_idx + 1]
            return json.loads(json_str)
        else:
            raise ValueError("Pas de JSON trouvé")

    except Exception as e:
        print(f"Erreur Analyse Ticket: {e}")
        return {"error": str(e)}

async def analyze_note_image(image_path: str) -> Dict[str, Any]:
    """
    Analyse une image de note/post-it pour transcrire le texte.
    """
    if not configure_gemini():
        return {"error": "Clé API manquante"}

    try:
        model_name = 'gemini-flash-latest'
        model = genai.GenerativeModel(model_name)

        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type: mime_type = 'image/jpeg'
        
        image_data = Path(image_path).read_bytes()
        cookie_picture = {'mime_type': mime_type, 'data': image_data}

        prompt = """
        Tu es un expert en OCR (Reconnaissance Optique de Caractères).
        Ta mission est de transcrire le texte présent sur cette image (post-it, note manuscrite, papier).
        
        Règles :
        1. Transcris EXACTEMENT ce qui est écrit.
        2. Corrige uniquement les fautes d'orthographe évidentes si le mot est mal écrit mais compréhensible.
        3. Ignore le texte d'arrière-plan non pertinent (marques, logos) si ce n'est pas le message principal.
        4. Si c'est une liste, utilise des tirets.
        
        Format de sortie JSON :
        {
            "content": "Le texte transcrit ici...",
            "confidence": "high/medium/low"
        }
        
        Réponds UNIQUEMENT le JSON.
        """

        response = model.generate_content([prompt, cookie_picture])
        
        text_response = response.text.strip()
        start_idx = text_response.find('{')
        end_idx = text_response.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = text_response[start_idx : end_idx + 1]
            return json.loads(json_str)
        else:
            raise ValueError("Pas de JSON trouvé")

    except Exception as e:
        print(f"Erreur Analyse Note: {e}")
        return {"error": str(e)}
