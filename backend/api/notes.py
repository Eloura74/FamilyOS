from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.repositories.notes import NotesRepository

router = APIRouter()
notes_repo = NotesRepository()

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
