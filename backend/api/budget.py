import json
import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, Any, List
from backend.integrations.gemini_vision import analyze_receipt_image

router = APIRouter()

DATA_FILE = "backend/data/expenses.json"

def load_expenses() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_expenses(expenses: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(expenses, f, indent=2)

@router.get("/")
async def get_expenses():
    """
    Récupère toutes les dépenses.
    """
    return load_expenses()

@router.get("/stats")
async def get_budget_stats():
    """
    Calcule les stats du mois courant.
    """
    expenses = load_expenses()
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    monthly_total = 0.0
    categories = {}
    
    for expense in expenses:
        try:
            date_obj = datetime.strptime(expense['date'], "%Y-%m-%d")
            if date_obj.month == current_month and date_obj.year == current_year:
                amount = float(expense['amount'])
                monthly_total += amount
                
                cat = expense.get('category', 'Autre')
                categories[cat] = categories.get(cat, 0) + amount
        except:
            continue
            
    return {
        "monthly_total": round(monthly_total, 2),
        "categories": categories,
        "month_label": now.strftime("%B %Y")
    }

@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...)):
    """
    Upload un ticket de caisse, l'analyse et ajoute la dépense.
    """
    try:
        # 1. Sauvegarde temporaire
        file_location = f"backend/uploads/temp_receipt_{file.filename}"
        os.makedirs("backend/uploads", exist_ok=True)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # 2. Analyse IA
        analysis = await analyze_receipt_image(file_location)
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
            
        # 3. Création de l'objet dépense
        new_expense = {
            "id": str(uuid.uuid4()),
            "date": analysis.get("date", datetime.now().strftime("%Y-%m-%d")),
            "amount": analysis.get("amount", 0.0),
            "merchant": analysis.get("merchant", "Inconnu"),
            "category": analysis.get("category", "Autre"),
            "items": analysis.get("items", [])
        }
        
        # 4. Sauvegarde
        expenses = load_expenses()
        expenses.append(new_expense)
        save_expenses(expenses)
        
        return {"status": "success", "expense": new_expense}
        
    except Exception as e:
        print(f"Erreur Upload Ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))
