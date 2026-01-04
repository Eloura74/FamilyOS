from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from backend.api.auth import get_current_user
from backend.integrations.gmail_service import gmail_service

router = APIRouter()

@router.get("/important", response_model=List[Dict[str, Any]])
async def get_important_emails(current_user: dict = Depends(get_current_user)):
    """
    Récupère les emails importants et non lus de l'utilisateur connecté.
    """
    try:
        emails = gmail_service.fetch_important_emails(limit=5)
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
