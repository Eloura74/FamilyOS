from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def add(self, item: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update(self, item_id: str, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete(self, item_id: str) -> bool:
        pass
