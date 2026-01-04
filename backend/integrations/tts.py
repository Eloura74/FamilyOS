import edge_tts
import os
import time
from pathlib import Path

# Dossier de stockage des fichiers audio
AUDIO_DIR = Path("backend/uploads")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

async def generate_audio_briefing(text: str) -> str:
    """
    Génère un fichier audio à partir du texte du briefing en utilisant edge-tts.
    Retourne le chemin relatif du fichier généré.
    """
    try:
        # Voix française plus fluide et naturelle (Denise)
        voice = "fr-FR-DeniseNeural" 
        
        # Nom de fichier unique pour éviter le cache navigateur
        timestamp = int(time.time())
        output_filename = f"briefing_{timestamp}.mp3"
        output_path = AUDIO_DIR / output_filename
        
        # Nettoyage des anciens fichiers (optionnel mais propre)
        for file in AUDIO_DIR.glob("briefing_*.mp3"):
            try:
                file.unlink()
            except:
                pass
        
        # On enlève le rate pour garder la fluidité native
        communicate = edge_tts.Communicate(text, voice)
        
        await communicate.save(str(output_path))
        
        return f"/uploads/{output_filename}"
    except Exception as e:
        print(f"Erreur TTS: {e}")
        return None
