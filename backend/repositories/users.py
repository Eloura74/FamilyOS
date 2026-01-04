from typing import List, Dict, Any, Optional
from .json_repo import JsonRepository

class UserRepository(JsonRepository):
    def __init__(self):
        super().__init__("backend/data/users.json")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        users = self.get_all()
        for user in users:
            if user.get('email') == email:
                return user
        return None
