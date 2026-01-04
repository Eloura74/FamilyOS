import json
import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, Any
from backend.integrations.gemini_vision import analyze_menu_image

router = APIRouter()

DATA_FILE = "backend/data/meals.json"

def load_meals():
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_meals(meals):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(meals, f, indent=2)

@router.get("/")
async def get_meals():
    """
    Récupère tous les repas planifiés.
    """
    return load_meals()

@router.post("/")
async def update_meals(meals_data: Dict[str, Any]):
    """
    Met à jour les repas.
    Format attendu: { "YYYY-MM-DD": { "lunch": "...", "dinner": "..." } }
    """
    current_meals = load_meals()
    # On fusionne les nouvelles données
    current_meals.update(meals_data)
    save_meals(current_meals)
    return {"status": "success", "meals": current_meals}

@router.post("/upload")
async def upload_menu(file: UploadFile = File(...)):
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
            
        # 3. Mise à jour de la base
        current_meals = load_meals()
        current_meals.update(analyzed_meals)
        save_meals(current_meals)
        
        return {"status": "success", "analyzed_meals": analyzed_meals, "full_planning": current_meals}
        
    except Exception as e:
        print(f"Erreur Upload Menu: {e}")
        raise HTTPException(status_code=500, detail=str(e))
