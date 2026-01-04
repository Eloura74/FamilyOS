from typing import List, Dict, Optional

# Règles de base pour les sacs d'activités
# Format: "Mot clé": ["Item 1", "Item 2", ...]
ACTIVITY_RULES = {
    "piscine": ["Maillot de bain", "Bonnet", "Lunettes", "Serviette", "Shampoing"],
    "natation": ["Maillot de bain", "Bonnet", "Lunettes", "Serviette", "Shampoing"],
    "judo": ["Kimono", "Ceinture", "Gourde", "Zoories"],
    "karaté": ["Kimono", "Ceinture", "Gourde", "Protections"],
    "football": ["Maillot", "Short", "Chaussettes hautes", "Protège-tibias", "Crampons", "Gourde"],
    "foot": ["Maillot", "Short", "Chaussettes hautes", "Protège-tibias", "Crampons", "Gourde"],
    "danse": ["Tenue de danse", "Chaussons", "Bouteille d'eau"],
    "gym": ["Tenue de sport", "Baskets propres", "Gourde"],
    "tennis": ["Raquette", "Balles", "Tenue de sport", "Gourde"],
    "école": ["Cartable", "Agenda", "Trousse", "Goûter"],
    "ecole": ["Cartable", "Agenda", "Trousse", "Goûter"],
    "randonnée": ["Chaussures de marche", "Sac à dos", "Gourde", "K-way", "En-cas"],
    "rando": ["Chaussures de marche", "Sac à dos", "Gourde", "K-way", "En-cas"],
}

def analyze_event_for_tags(title: str) -> Dict[str, any]:
    """
    Analyse le titre d'un événement pour trouver des tags et des items associés.
    Retourne un dictionnaire avec 'tags' (liste de noms) et 'items' (liste d'objets).
    """
    title_lower = title.lower()
    found_tags = []
    required_items = set() # Utilisation d'un set pour éviter les doublons

    for keyword, items in ACTIVITY_RULES.items():
        if keyword in title_lower:
            # On utilise le mot clé comme "Tag" (en majuscule pour l'affichage)
            tag_name = keyword.capitalize()
            found_tags.append(tag_name)
            for item in items:
                required_items.add(item)

    return {
        "tags": found_tags,
        "items": list(required_items)
    }
