import re
from typing import List, Dict, Set, Union

# --- CONSTANTES D'ITEMS COMMUNS (Pour éviter la répétition) ---
_BASE_TOILETTE = ["Trousse de toilette", "Brosse à dents", "Dentifrice", "Déo"]
_BASE_DOUCHE_SPORT = ["Serviette", "Gel douche", "Shampoing", "Deo", "Change propre"]
_BASE_PISCINE = ["Maillot de bain", "Bonnet", "Lunettes de nage", "Serviette microfibre", "Pièce casier ou Jeton"]
_BASE_ADMIN = ["Pièce d'identité", "Stylo noir", "Dossier complet"]
_TECH_NOMADE = ["Smartphone", "Câble de charge", "Powerbank", "Écouteurs"]

# --- DÉFINITION DES RÈGLES PAR CATÉGORIE ---
# Structure : "Catégorie": { "mot_clé": ["Item 1", ...], ... }
RAW_RULES = {
    # 1. SPORTS AQUATIQUES
    "aquatique": {
        "piscine|natation": _BASE_PISCINE + ["Gel douche anti-chlore"],
        "plage|mer": ["Maillot", "Grande serviette", "Crème solaire 50+", "Lunettes de soleil", "Chapeau", "Eau 1.5L", "Livre/Kindle"],
        "spa|thalasso": ["Maillot", "Sandales propres", "Peignoir (si non fourni)"],
        "plongée": ["Carnet de plongée", "Licence/Certificat", "Ordi de plongée", "Maillot", "Serviette"]
    },

    # 2. SPORTS TERRESTRES & COMBAT
    "sport": {
        "judo|jjb": ["Kimono (Gi)", "Ceinture", "Zoories", "Passeport sportif", "Strappal/Tape", "Gourde"],
        "karaté": ["Kimono", "Ceinture", "Protections", "Passeport sportif", "Gourde"],
        "boxe|muay": ["Gants", "Bandes/Sous-gants", "Protège-dents", "Coquille", "Protège-tibias", "Gourde", "Serviette"],
        "foot|football|futsal": ["Maillot", "Short", "Chaussettes", "Protège-tibias", "Crampons/Stabilisés", "Gourde"] + _BASE_DOUCHE_SPORT,
        "rugby": ["Maillot", "Short", "Crampons vissés/moulés", "Strappal", "Gourde"] + _BASE_DOUCHE_SPORT,
        "tennis|padel": ["Raquette", "Balles", "Chaussures terre/dur", "Gourde", "Poignets éponge", "Serviette"],
        "badminton|squash": ["Raquette", "Volants/Balles", "Chaussures indoor (semelle non marquante)", "Gourde", "Serviette"],
        "muscu|fitness|gym|crossfit": ["Tenue sport", "Chaussures propres", "Serviette obligatoire", "Cadenas", "Gourde/Shaker", "Maniques (si besoin)"],
        "yoga|pilates": ["Tapis personnel", "Tenue souple", "Bouteille d'eau", "Petite serviette"],
        "running|course à pied|jogging": ["Montre GPS", "Ceinture cardio", "Clés maison", "Écouteurs", "Bandeau/Casquette"],
        "escalade|bloc": ["Baudrier", "Chaussons", "Système d'assurage", "Magnésie", "Brosse", "Gourde"],
        "vélo|cyclisme|vtt": ["Casque", "Gants", "Bidon", "Kit réparation (Chambre à air/Démonte-pneu)", "Pompe/Co2", "Multi-tool", "Lunettes"],
        "athlétisme|athlé": ["Gourde", "Tee-shirt", "Baskette", "Veste"],
    }, 

    # 3. MAKER & TECH (Adapté à votre profil)
    "tech": {
        "hackathon|lan|coding": ["Laptop", "Chargeur PC", "Souris", "Support PC", "Multiprise", "Câble Ethernet", "Disque Dur Externe", "Clés USB", "Adaptateurs USB-C"],
        "fablab|maker|atelier": ["Pied à coulisse", "Carnet de croquis", "Crayon/Marqueur", "Laptop", "Clé USB (Gcode)", "Lunettes de protection"],
        "drone|fpv": ["Drone", "Radiocommande", "Lunettes FPV", "Batteries chargées (Lipo)", "Hélices de rechange", "Outils (Tournevis)", "Carte SD vide"],
        "photo|shooting": ["Appareil photo", "Objectifs", "Cartes SD vides", "Batteries chargées", "Trépied", "Kit nettoyage"],
        "impression 3d": ["Carte SD", "Spatule", "Pince coupante", "Isopropanol (si besoin)", "Clés Allen"]
    },

    # 4. VIE QUOTIDIENNE & FAMILLE
    "quotidien": {
        "école|ecole|primaire": ["Cartable", "Agenda", "Trousse", "Goûter", "Gourde"],
        "collège|lycée": ["Sac", "Livres/Cahiers", "Trousse", "Calculatrice", "Carte cantine/Bus", "Clés"],
        "crèche|nounou": ["Sac à langer", "Couches", "Doudou", "Tétine", "Biberon/Lait", "Vêtements de rechange", "Carnet santé"],
        "courses|supermarché": ["Liste de courses", "Sacs Cabas (x3)", "Jeton Caddie", "Consignes verre"],
        "déchetterie": ["Carte d'accès", "Gants épais", "Coffre vidé au préalable"],
        "bricolage|leroy merlin|castorama": ["Mesures/Plans", "Mètre ruban", "Crayon papier", "Échantillon couleur (si besoin)"],
        "chien|promenade chien": ["Sacs à crottes", "Laisse", "Friandises", "Balle/Jouet", "Eau (si longue balade)"]
    },

    # 5. SANTÉ
    "santé": {
        "médecin|docteur": ["Carte Vitale", "Carte Mutuelle", "Moyen de paiement", "Derniers résultats"],
        "pharmacie": ["Carte Vitale", "Mutuelle", "Ordonnance originale"],
        "pédiatre": ["Carnet de santé", "Carte Vitale", "Couche propre", "Doudou"],
        "hôpital|urgences": _BASE_ADMIN + ["Chargeur téléphone", "Bouteille d'eau", "Monnaie", "Liste médicaments actuels"],
        "ophtalmo": ["Lunettes actuelles", "Lentilles (boîtier)", "Carte Vitale", "Ancienne ordonnance"],
        "kinésithérapie|kiné": ["Carte Vitale", "Mutuelle", "Ordonnance originale"],
        "dentiste": ["Carte Vitale", "Mutuelle", "Ordonnance originale"]
    },

    # 6. VOYAGE & LOISIRS
    "voyage": {
        "voyage|avion": ["Passeport/CNI", "Billets", "Liquides <100ml", "Batterie externe", "Coussin nuque", "Bouchons d'oreilles", "Bas de contention"],
        "train|tgv": ["Billet (App)", "CNI", "Batterie externe", "Livre/Musique", "Repas/Snack", "Bouteille d'eau"],
        "rando|randonnée": ["Chaussures marche", "Sac à dos", "Eau (2L min)", "K-way", "Barres céréales", "Couteau suisse", "Trousse secours", "GPS/Carte"],
        "ski|neige": ["Skis/Snowboard", "Chaussures/Boots", "Bâtons", "Casque", "Masque/Lunettes", "Gants", "Crème solaire montagne", "Forfait", "Baume lèvres"],
        "camping": ["Tente", "Duvet", "Matelas", "Lampe torche", "Maillet", "Papier toilette", "Réchaud/Gaz", "Vaisselle camping"],
        "soirée|fête": ["Tenue de soirée", "Bouteille/Cadeau hôte", "Clés", "Téléphone chargé", "Moyens de paiement"],
        "pluie|mauvais temps": ["Parapluie solide", "Veste imperméable", "Chaussures étanches"]
    }
}

# Aplatissement des règles pour le traitement (Expansion des synonymes séparés par "|")
ACTIVITY_RULES: Dict[str, List[str]] = {}
for category, items_dict in RAW_RULES.items():
    for keys, items in items_dict.items():
        for key in keys.split("|"):
            ACTIVITY_RULES[key] = items

def analyze_event_for_tags(title: str) -> Dict[str, Union[List[str], List[str]]]:
    """
    Analyse intelligente utilisant des Regex pour éviter les faux positifs.
    Ex: Empêche 'car' de matcher dans 'cartable'.
    """
    if not title:
        return {"tags": [], "items": []}

    title_clean = title.lower().strip()
    found_tags = []
    required_items: Set[str] = set()

    for keyword, items in ACTIVITY_RULES.items():
        # Utilisation de \b pour délimiter les mots entiers (Word Boundaries)
        # Permet de trouver "foot" mais pas dans "foothold" (exemple anglais) ou éviter des erreurs partielles
        # Echappement du keyword pour éviter les erreurs de regex si caractères spéciaux
        pattern = r"\b" + re.escape(keyword) + r"\b"
        
        if re.search(pattern, title_clean):
            tag_name = keyword.capitalize()
            found_tags.append(tag_name)
            required_items.update(items)

    # Tri alphabétique pour un affichage propre
    sorted_items = sorted(list(required_items))

    return {
        "tags": found_tags,
        "items": sorted_items
    }
