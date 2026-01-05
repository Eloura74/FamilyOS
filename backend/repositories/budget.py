from typing import List, Dict, Any
from .json_repo import JsonRepository

class BudgetRepository(JsonRepository):
    def __init__(self):
        super().__init__("backend/data/expenses.json")

    def get_by_month(self, month: int, year: int) -> List[Dict[str, Any]]:
        all_expenses = self.get_all()
        monthly_expenses = []
        for expense in all_expenses:
            try:
                date_str = expense.get('date')
                if date_str:
                    # On suppose format YYYY-MM-DD
                    y, m, d = map(int, date_str.split('-'))
                    if y == year and m == month:
                        monthly_expenses.append(expense)
            except:
                continue
        return monthly_expenses

    def delete_expense(self, expense_id: str) -> bool:
        """Supprime une dépense par son ID."""
        all_expenses = self.get_all()
        initial_len = len(all_expenses)
        
        # Filtrer pour garder tout sauf l'ID donné
        # On suppose que les dépenses ont un champ 'id' unique généré par JsonRepository ou manuellement
        # Si JsonRepository utilise une liste, il faut s'assurer que les items ont des IDs.
        # Pour l'instant, on va supposer que 'id' est présent.
        new_expenses = [e for e in all_expenses if e.get('id') != expense_id]
        
        if len(new_expenses) < initial_len:
            self.save(new_expenses)
            return True
        return False
