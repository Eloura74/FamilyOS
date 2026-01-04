import edge_tts
import os
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
        # Voix française masculine de haute qualité (Multilingual Neural)
        # Options: fr-FR-RemyMultilingualNeural, fr-FR-HenriNeural
        voice = "fr-FR-RemyMultilingualNeural" 
        
        output_filename = "briefing_daily.mp3"
        output_path = AUDIO_DIR / output_filename
        
        communicate = edge_tts.Communicate(text, voice)
        
        await communicate.save(str(output_path))
        
        return f"/uploads/{output_filename}"
        
    except Exception as e:
        print(f"Erreur TTS: {e}")
        return None
