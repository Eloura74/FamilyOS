import json
import os
from typing import Any, Dict
from dotenv import load_dotenv

load_dotenv()

CONFIG_FILE = "config.json"

class ConfigManager:
    def __init__(self):
        self._config: Dict[str, Any] = {}
        self._load()

    def _load(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    self._config = json.load(f)
            except Exception as e:
                print(f"Erreur lors du chargement de la config: {e}")
                self._config = {}
        else:
            self._config = {}

    def _save(self):
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self._config, f, indent=4)
        except Exception as e:
            print(f"Erreur lors de la sauvegarde de la config: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        # Priorité : Config JSON > Variable d'environnement > Valeur par défaut
        val = self._config.get(key)
        if val is not None:
            return val
        
        env_val = os.getenv(key)
        if env_val is not None:
            return env_val
            
        return default

    def set(self, key: str, value: Any):
        self._config[key] = value
        self._save()

config_manager = ConfigManager()
