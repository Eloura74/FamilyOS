from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from backend.repositories.notes import NotesRepository
import shutil
import os
from pathlib import Path
import uuid
from backend.integrations.gemini_vision import analyze_note_image

router = APIRouter()
notes_repo = NotesRepository()

UPLOAD_DIR = Path("backend/uploads/notes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_note_image(file: UploadFile = File(...)):
    """
    Upload une photo de note et retourne le texte transcrit.
    """
    try:
        file_extension = os.path.splitext(file.filename)[1]
        file_id = str(uuid.uuid4())
        new_filename = f"{file_id}{file_extension}"
        file_path = UPLOAD_DIR / new_filename

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        analysis = await analyze_note_image(str(file_path))
        return analysis

    except Exception as e:
        print(f"Erreur upload note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class NoteCreate(BaseModel):
    content: str
    author: str = "Famille"

@router.get("/")
def get_notes():
    return notes_repo.get_all_notes()

@router.post("/")
def add_note(note: NoteCreate):
    return notes_repo.add_note(note.content, note.author)

@router.delete("/{note_id}")
def delete_note(note_id: str):
    success = notes_repo.delete_note(note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    return {"status": "success"}

class NoteUpdate(BaseModel):
    content: str

@router.put("/{note_id}")
def update_note(note_id: str, note: NoteUpdate):
    updated_note = notes_repo.update_note(note_id, note.content)
    if not updated_note:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    return updated_note
