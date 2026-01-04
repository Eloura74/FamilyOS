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
