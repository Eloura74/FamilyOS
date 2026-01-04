from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from pathlib import Path
from typing import List
import uuid
from backend.integrations.gemini_vision import analyze_image_with_gemini
from backend.integrations.calendar_service import calendar_service

router = APIRouter()

# Dossier de stockage des uploads
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload un document (image ou PDF) pour analyse.
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

        # AUTOMATISATION : Création d'événement si une date est détectée
        event_created = False
        if "date" in analysis_result and analysis_result["date"]:
            try:
                # Formatage de la description avec les items
                description = analysis_result.get("summary", "")
                action_items = analysis_result.get("action_items", [])
                
                if action_items:
                    items_str = ", ".join(action_items)
                    description += f"\n\n[ITEMS]: {items_str}"

                event_data = {
                    "summary": analysis_result.get("title", "Document scanné"),
                    "start": analysis_result["date"], # Format YYYY-MM-DD attendu pour all-day
                    "description": description
                }
                
                await calendar_service.create_event(event_data)
                event_created = True
                print(f"Événement créé : {event_data['summary']} pour le {event_data['start']}")
                
            except Exception as e:
                print(f"Erreur création événement automatique : {e}")

        return {
            "id": file_id,
            "filename": new_filename,
            "original_filename": file.filename,
            "path": str(file_path),
            "message": "Fichier uploadé et analysé" + (" (Événement ajouté au calendrier)" if event_created else ""),
            "analysis": analysis_result,
            "event_created": event_created
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
