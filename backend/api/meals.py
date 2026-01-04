import json
import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Dict, Any
from backend.integrations.gemini_vision import analyze_menu_image
from backend.repositories.meals import MealRepository
from backend.api.auth import get_current_user

router = APIRouter()
repo = MealRepository()

@router.get("/")
async def get_meals(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Récupère tous les repas planifiés.
    """
    return repo.get_all_dict()

@router.post("/")
async def update_meals(meals_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Met à jour les repas.
    Format attendu: { "YYYY-MM-DD": { "lunch": "...", "dinner": "..." } }
    """
    # On utilise add qui gère le merge dans notre implémentation actuelle
    repo.add(meals_data)
    return {"status": "success", "meals": repo.get_all_dict()}

@router.post("/upload")
async def upload_menu(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Upload une photo de menu, l'analyse avec l'IA et met à jour le planning.
    """
    try:
        # 1. Sauvegarde temporaire
        file_location = f"backend/uploads/temp_menu_{file.filename}"
        os.makedirs("backend/uploads", exist_ok=True)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # 2. Analyse IA
        analyzed_meals = await analyze_menu_image(file_location)
        
        if "error" in analyzed_meals:
            raise HTTPException(status_code=500, detail=analyzed_meals["error"])
            
        # 3. Mise à jour de la base via Repository
        repo.add(analyzed_meals)
        
        return {"status": "success", "analyzed_meals": analyzed_meals, "full_planning": repo.get_all_dict()}
        
    except Exception as e:
        print(f"Erreur Upload Menu: {e}")
        raise HTTPException(status_code=500, detail=str(e))
