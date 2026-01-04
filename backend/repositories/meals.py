import json
import os
from typing import List, Dict, Any, Optional
from .base import BaseRepository

class MealRepository(BaseRepository):
    def __init__(self):
        self.file_path = "backend/data/meals.json"
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, 'w') as f:
                json.dump({}, f)

    def _load_data(self) -> Dict[str, Any]:
        try:
            with open(self.file_path, 'r') as f:
                return json.load(f)
        except:
            return {}

    def _save_data(self, data: Dict[str, Any]):
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def get_all(self) -> List[Dict[str, Any]]:
        # Pour compatibilité, on pourrait retourner une liste de {date: ..., content: ...}
        # Mais ici on retourne le dict brut car c'est ce que le frontend attend pour l'instant
        # TODO: Adapter le frontend pour recevoir une liste si on veut standardiser
        return [self._load_data()] 

    def get_all_dict(self) -> Dict[str, Any]:
        """Méthode spécifique pour récupérer le format dict attendu par le frontend actuel"""
        return self._load_data()

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        # Ici item_id serait la date "YYYY-MM-DD"
        data = self._load_data()
        return data.get(item_id)

    def add(self, item: Dict[str, Any]) -> Dict[str, Any]:
        # item attendu: {"date": "YYYY-MM-DD", "lunch": "...", "dinner": "..."}
        # OU directement le format de update_meals: {"YYYY-MM-DD": {...}}
        # On va supporter le format update global pour l'instant
        data = self._load_data()
        data.update(item)
        self._save_data(data)
        return item

    def update(self, item_id: str, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._load_data()
        if item_id in data:
            data[item_id].update(item)
            self._save_data(data)
            return data[item_id]
        return None

    def delete(self, item_id: str) -> bool:
        data = self._load_data()
        if item_id in data:
            del data[item_id]
            self._save_data(data)
            return True
        return False
