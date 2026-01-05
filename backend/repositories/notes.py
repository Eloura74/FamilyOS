import json
import os
from typing import List, Dict, Any
from datetime import datetime
import uuid

DATA_FILE = "backend/data/notes.json"

class NotesRepository:
    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self):
        if not os.path.exists(os.path.dirname(DATA_FILE)):
            os.makedirs(os.path.dirname(DATA_FILE))
        if not os.path.exists(DATA_FILE):
            with open(DATA_FILE, "w") as f:
                json.dump([], f)

    def get_all_notes(self) -> List[Dict[str, Any]]:
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def add_note(self, content: str, author: str = "Famille") -> Dict[str, Any]:
        notes = self.get_all_notes()
        new_note = {
            "id": str(uuid.uuid4()),
            "content": content,
            "author": author,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "timestamp": datetime.now().timestamp()
        }
        notes.append(new_note)
        self._save_notes(notes)
        return new_note

    def delete_note(self, note_id: str) -> bool:
        notes = self.get_all_notes()
        initial_len = len(notes)
        notes = [n for n in notes if n["id"] != note_id]
        if len(notes) < initial_len:
            self._save_notes(notes)
            return True
        return False

    def _save_notes(self, notes: List[Dict[str, Any]]):
        with open(DATA_FILE, "w") as f:
            json.dump(notes, f, indent=2)
