from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from pathlib import Path
from typing import List
import uuid
from backend.integrations.gemini_vision import analyze_image_with_gemini
from backend.integrations.calendar_service import calendar_service
from backend.repositories.notes import NotesRepository
from backend.repositories.budget import BudgetRepository
from backend.repositories.meals import MealRepository
from datetime import datetime

router = APIRouter()

# Repositories
notes_repo = NotesRepository()
budget_repo = BudgetRepository()
meal_repo = MealRepository()

# Dossier de stockage des uploads
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload un document, l'analyse et le route vers le bon module (Agenda, Frigo, Budget, Menus).
    """
    try:
        # Génération d'un nom de fichier unique
        file_extension = os.path.splitext(file.filename)[1]
        file_id = str(uuid.uuid4())
        new_filename = f"{file_id}{file_extension}"
        file_path = UPLOAD_DIR / new_filename

        # Sauvegarde du fichier
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Analyse IA
        analysis_result = await analyze_image_with_gemini(str(file_path))
        
        routing_action = analysis_result.get("routing_action", "none")
        doc_type = analysis_result.get("type", "Autre")
        
        action_taken = "Analyzed only"
        
        # --- ROUTAGE INTELLIGENT ---
        
        # 1. ROUTAGE VERS FRIGO (Notes/Post-its)
        if routing_action == "add_note" or doc_type in ["Note", "Post-it"]:
            content = analysis_result.get("note_content") or analysis_result.get("summary") or "Note sans contenu"
            notes_repo.add_note(content, author="IA Assistant")
            action_taken = "Added to Fridge"
            
        # 2. ROUTAGE VERS BUDGET (Factures/Tickets)
        elif routing_action == "add_expense" or doc_type in ["Facture", "Ticket"]:
            new_expense = {
                "id": str(uuid.uuid4()),
                "date": analysis_result.get("date", datetime.now().strftime("%Y-%m-%d")),
                "amount": analysis_result.get("amount", 0.0),
                "merchant": analysis_result.get("merchant", "Inconnu"),
                "category": analysis_result.get("category", "Autre"),
                "items": analysis_result.get("items", [])
            }
            budget_repo.add(new_expense)
            action_taken = "Added to Budget"

        # 3. ROUTAGE VERS MENUS (Cantine/Repas)
        elif routing_action == "add_menu" or doc_type in ["Menu", "Cantine"]:
            # Note: Pour les menus, l'analyse générique n'est peut-être pas aussi détaillée que analyze_menu_image
            # Mais on tente quand même d'extraire ce qu'on peut ou on redirige
            # Pour l'instant, on stocke juste l'info si possible, mais le format JSON des menus est complexe.
            # Idéalement, il faudrait rappeler analyze_menu_image si on détecte un menu, 
            # mais pour simplifier on va supposer que l'utilisateur utilise le bouton dédié pour les menus complexes.
            # Si Gemini a extrait des repas (format spécifique), on pourrait les ajouter.
            pass 
            # TODO: Implémenter le parsing complexe des menus ici si besoin.
            action_taken = "Identified as Menu (Manual review suggested)"

        # 4. ROUTAGE VERS AGENDA (Events/RDV) - Fallback par défaut si date détectée
        elif routing_action == "add_event" or (analysis_result.get("date") and doc_type not in ["Facture", "Ticket"]):
            try:
                # Construction de la date de début (ISO pour datetime-local)
                start_date = analysis_result.get("date")
                start_time = analysis_result.get("time")
                
                if start_date and start_time:
                    start_iso = f"{start_date}T{start_time}"
                elif start_date:
                    start_iso = f"{start_date}T09:00" # Heure par défaut si non précisée
                else:
                    start_iso = datetime.now().strftime("%Y-%m-%dT%H:%M")

                description = analysis_result.get("summary", "")
                
                # Actions à faire (Texte simple dans la description)
                action_items = analysis_result.get("action_items", [])
                if action_items:
                    actions_str = "\n- ".join(action_items)
                    description += f"\n\nACTIONS :\n- {actions_str}"
                
                # Matériel à apporter (Tag spécial [ITEMS] pour le Sac à préparer)
                required_equipment = analysis_result.get("required_equipment", [])
                if required_equipment:
                    items_str = ", ".join(required_equipment)
                    description += f"\n\n[ITEMS]: {items_str}"

                # On prépare les données mais on ne crée PAS l'événement automatiquement
                # On laisse le frontend demander confirmation à l'utilisateur
                event_data = {
                    "summary": analysis_result.get("title", "Document scanné"),
                    "start": start_iso,
                    "description": description
                }
                
                # await calendar_service.create_event(event_data) <-- Désactivé pour confirmation manuelle
                action_taken = "Proposed Event"
                
                # On ajoute les données structurées à la réponse pour le pré-remplissage
                analysis_result["proposed_event"] = event_data
                
            except Exception as e:
                print(f"Erreur préparation événement : {e}")

        return {
            "id": file_id,
            "filename": new_filename,
            "original_filename": file.filename,
            "path": str(file_path),
            "message": f"Document analysé et traité : {action_taken}",
            "analysis": analysis_result,
            "action_taken": action_taken
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@router.get("/list")
async def list_documents():
    """
    Liste les documents uploadés.
    """
    files = []
    for file_path in UPLOAD_DIR.glob("*"):
        if file_path.is_file():
            files.append({
                "filename": file_path.name,
                "path": str(file_path)
            })
    return files
