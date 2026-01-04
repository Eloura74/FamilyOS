import json
import os
from typing import List, Dict, Any, Optional
from .base import BaseRepository

class JsonRepository(BaseRepository):
    def __init__(self, file_path: str):
        self.file_path = file_path
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, 'w') as f:
                json.dump([], f)

    def _load_data(self) -> List[Dict[str, Any]]:
        try:
            with open(self.file_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                return []
        except:
            return []

    def _save_data(self, data: Any):
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def get_all(self) -> List[Dict[str, Any]]:
        return self._load_data()

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        data = self._load_data()
        for item in data:
            if item.get('id') == item_id:
                return item
        return None

    def add(self, item: Dict[str, Any]) -> Dict[str, Any]:
        data = self._load_data()
        data.append(item)
        self._save_data(data)
        return item

    def update(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._load_data()
        for i, item in enumerate(data):
            if item.get('id') == item_id:
                data[i].update(updates)
                self._save_data(data)
                return data[i]
        return None

    def delete(self, item_id: str) -> bool:
        data = self._load_data()
        initial_len = len(data)
        data = [item for item in data if item.get('id') != item_id]
        if len(data) < initial_len:
            self._save_data(data)
            return True
        return False
