import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

class TrafficService:
    def __init__(self):
        self.base_url = "https://maps.googleapis.com/maps/api/distancematrix/json"

    async def get_commute_time(self, api_key: str, origin: str, destination: str, arrival_time_str: str) -> Dict[str, Any]:
        """
        Calcule le temps de trajet pour arriver à l'heure indiquée.
        Retourne un dict avec 'success': True/False et les données ou l'erreur.
        """
        if not api_key or not origin or not destination:
            return {"success": False, "error": "Configuration incomplète (Clé ou adresses manquantes)"}

        try:
            # Calcul du timestamp pour le prochain arrival_time
            now = datetime.now()
            target_time = datetime.strptime(arrival_time_str, "%H:%M").replace(
                year=now.year, month=now.month, day=now.day
            )
            
            # Si l'heure est déjà passée aujourd'hui, on regarde pour demain
            if target_time < now:
                target_time += timedelta(days=1)
            
            arrival_timestamp = int(target_time.timestamp())

            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params={
                    "origins": origin,
                    "destinations": destination,
                    "key": api_key,
                    "arrival_time": arrival_timestamp,
                    "mode": "driving",
                    "language": "fr"
                })
                
                if response.status_code != 200:
                    return {"success": False, "error": f"Erreur HTTP {response.status_code}"}
                
                data = response.json()
                
                if data["status"] != "OK":
                    error_msg = data.get("error_message", data["status"])
                    return {"success": False, "error": f"Erreur API Google: {error_msg}"}
                
                element = data["rows"][0]["elements"][0]
                if element["status"] != "OK":
                    return {"success": False, "error": f"Trajet impossible: {element['status']}"}
                
                duration_in_traffic = element.get("duration_in_traffic", element["duration"])
                duration_seconds = duration_in_traffic["value"]
                duration_text = duration_in_traffic["text"]
                
                # Calcul de l'heure de départ
                departure_time = target_time - timedelta(seconds=duration_seconds)
                
                return {
                    "success": True,
                    "duration_text": duration_text,
                    "departure_time": departure_time.strftime("%H:%M"),
                    "target_arrival": arrival_time_str
                }
                
        except Exception as e:
            return {"success": False, "error": f"Exception: {str(e)}"}

traffic_service = TrafficService()
