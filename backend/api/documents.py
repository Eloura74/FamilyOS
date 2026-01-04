from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from pathlib import Path
from typing import List
import uuid
from backend.integrations.gemini_vision import analyze_image_with_gemini

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
            
        # Analyse IA (Asynchrone idéalement, mais synchrone pour le MVP pour avoir le résultat direct)
        analysis_result = await analyze_image_with_gemini(str(file_path))

        return {
            "id": file_id,
            "filename": new_filename,
            "original_filename": file.filename,
            "path": str(file_path),
            "message": "Fichier uploadé et analysé",
            "analysis": analysis_result
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
