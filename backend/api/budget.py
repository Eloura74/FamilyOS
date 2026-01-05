import json
import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Dict, Any, List
from backend.integrations.gemini_vision import analyze_receipt_image
from backend.repositories.budget import BudgetRepository
from backend.api.auth import get_current_user

router = APIRouter()
repo = BudgetRepository()

@router.get("/")
async def get_expenses(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Récupère toutes les dépenses.
    """
    return repo.get_all()

@router.get("/stats")
async def get_budget_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Calcule les stats du mois courant.
    """
    now = datetime.now()
    
    # Utilisation de la méthode spécifique du repository
    monthly_expenses = repo.get_by_month(now.month, now.year)
    
    monthly_total = 0.0
    categories = {}
    
    for expense in monthly_expenses:
        try:
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

@router.post("/")
async def create_expense(expense_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Crée une nouvelle dépense manuellement (ou via analyse générique).
    """
    new_expense = {
        "id": str(uuid.uuid4()),
        "date": expense_data.get("date", datetime.now().strftime("%Y-%m-%d")),
        "amount": expense_data.get("amount", 0.0),
        "merchant": expense_data.get("merchant", "Inconnu"),
        "category": expense_data.get("category", "Autre"),
        "items": expense_data.get("items", [])
    }
    repo.add(new_expense)
    return {"status": "success", "expense": new_expense}

@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
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
        
        # 4. Sauvegarde via Repository
        repo.add(new_expense)
        
        return {"status": "success", "expense": new_expense}
        
    except Exception as e:
        print(f"Erreur Upload Ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Supprime une dépense.
    """
    success = repo.delete_expense(expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dépense non trouvée")
    return {"status": "success", "message": "Dépense supprimée"}
