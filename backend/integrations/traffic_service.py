import WazeRouteCalculator
import logging
from typing import Dict, Any
from datetime import datetime, timedelta

class TrafficService:
    def __init__(self):
        # Logger pour éviter que WazeRouteCalculator ne pollue trop la console
        self.logger = logging.getLogger('WazeRouteCalculator.WazeRouteCalculator')
        self.logger.setLevel(logging.WARNING)

    async def get_commute_time(self, origin: str, destination: str, arrival_time_str: str) -> Dict[str, Any]:
        """
        Calcule le temps de trajet via Waze pour arriver à l'heure indiquée.
        Retourne un dict avec 'success': True/False et les données ou l'erreur.
        """
        if not origin or not destination:
            return {"success": False, "error": "Adresses manquantes"}

        try:
            # WazeRouteCalculator est synchrone, mais rapide. 
            # Pour une vraie appli async, on devrait le wrapper dans run_in_executor, 
            # mais pour l'instant ça ira.
            
            region = 'EU' # Important pour l'Europe
            route = WazeRouteCalculator.WazeRouteCalculator(origin, destination, region)
            
            # Calcul du temps de trajet (en minutes)
            # WazeRouteCalculator ne prend pas d'heure d'arrivée future précise pour la prediction,
            # il calcule le temps de trajet "maintenant" ou avec un offset simple.
            # On va utiliser le temps de trajet actuel comme estimation fiable.
            
            # Calcul du temps de trajet (en minutes)
            # WazeRouteCalculator retourne un tuple (temps_minutes, distance_km)
            route_time_minutes, distance_km = route.calc_route_info()
            
            # Calcul de l'heure de départ conseillée
            now = datetime.now()
            target_time = datetime.strptime(arrival_time_str, "%H:%M").replace(
                year=now.year, month=now.month, day=now.day
            )
            
            # Si l'heure est déjà passée, on vise demain
            if target_time < now:
                target_time += timedelta(days=1)
                
            departure_time = target_time - timedelta(minutes=route_time_minutes)
            
            return {
                "success": True,
                "duration_text": f"{int(route_time_minutes)} min",
                "departure_time": departure_time.strftime("%H:%M"),
                "target_arrival": arrival_time_str,
                "distance": f"{distance_km:.1f} km"
            }
                
        except Exception as e:
            return {"success": False, "error": f"Erreur Waze: {str(e)}"}

traffic_service = TrafficService()
