import json
import os
from typing import Dict, Any
from .json_repo import JsonRepository

class SettingsRepository(JsonRepository):
    def __init__(self):
        super().__init__("backend/data/settings.json")

    def _ensure_file_exists(self):
        """Override to initialize with empty dict instead of list."""
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, 'w') as f:
                json.dump({}, f)

    def get_settings(self) -> Dict[str, Any]:
        """Récupère tous les paramètres."""
        try:
            with open(self.file_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                return {}
        except:
            return {}

    def update_setting(self, key: str, value: Any) -> Dict[str, Any]:
        """Met à jour un paramètre spécifique."""
        settings = self.get_settings()
        settings[key] = value
        self._save_data(settings)
        return settings

    def save_settings(self, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        """Sauvegarde l'ensemble des paramètres."""
        self._save_data(new_settings)
        return new_settings
