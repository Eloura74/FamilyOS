# Guide de Déploiement Android - FamilyOS

Ce document détaille la procédure standard pour développer et déployer l'application sur Android en utilisant les scripts automatisés du projet.

## 1. Vue d'ensemble du Workflow

Le processus se déroule en 3 étapes simples :

1.  **Lancer le Serveur de Développement** (`start_mobile.bat`) : Pour que l'application tourne et soit accessible.
2.  **Construire et Déployer l'APK** (`deploy_mobile.bat`) : Pour créer l'application Android et la rendre téléchargeable.
3.  **Installer sur le Téléphone** : Télécharger l'APK depuis le téléphone via le Wi-Fi.

---

## 2. Procédure Détaillée

### Étape 1 : Lancer le "Dev Launcher"

Ce script démarre le serveur Vite et configure les tunnels ADB si un téléphone est branché.

1.  Double-cliquez sur **`start_mobile.bat`** à la racine du projet.
2.  Une fenêtre noire va s'ouvrir avec le titre "FamilyOS Mobile Dev Launcher".
3.  Attendez de voir les lignes :
    ```
    ➜  Local:   http://localhost:5173/
    ➜  Network: http://192.168.1.XX:5173/
    ```
4.  **IMPORTANT : NE FERMEZ PAS CETTE FENÊTRE.**
    - **Pourquoi ?** Cette fenêtre fait tourner le "cerveau" de votre application (le serveur Vite).
    - Si vous la fermez, l'application sur le téléphone ne pourra plus charger les pages ni recevoir les mises à jour.
    - Les lignes qui défilent (`hmr update`) vous montrent que vos modifications de code sont envoyées en direct au téléphone !

### Étape 2 : Construire l'APK

Ce script compile la dernière version de votre code et met à jour le fichier d'installation.

1.  Double-cliquez sur **`deploy_mobile.bat`** à la racine (vous pouvez le lancer même si le Launcher tourne déjà).
2.  Le script va :
    - Construire le site web (`npm run build`).
    - Mettre à jour le projet Android (`npx cap sync`).
    - Créer le fichier `.apk` (`gradlew assembleDebug`).
    - Copier ce fichier pour qu'il soit téléchargeable.
3.  À la fin, il affichera : `[OK] APK mis a jour !`.
4.  Vous pouvez fermer cette fenêtre une fois terminé.

### Étape 3 : Installer sur Android

1.  Assurez-vous que votre téléphone est connecté au **même réseau Wi-Fi** que votre PC.
2.  Sur votre téléphone, ouvrez Chrome (ou un autre navigateur).
3.  Tapez l'adresse affichée à la fin du script `deploy_mobile.bat` (souvent de la forme `http://192.168.1.XX:5173/familyos.apk`).
    - _Note : L'adresse IP (192.168...) est aussi visible dans la fenêtre du "Dev Launcher" à la ligne "Network"._
4.  Téléchargez le fichier `familyos.apk`.
5.  Ouvrez-le et installez l'application (acceptez les sources inconnues si demandé).

---

## 3. Développement au Quotidien

- **Si vous modifiez juste du code (JS/CSS/HTML)** :

  - Sauvegardez vos fichiers.
  - Le "Dev Launcher" (s'il est ouvert) mettra à jour l'application sur votre téléphone instantanément (Hot Reload) sans rien faire d'autre !
  - _Si ça ne se met pas à jour, secouez le téléphone ou relancez l'app._

- **Si vous voulez tester une version "propre" ou si vous changez des plugins** :
  - Relancez l'Étape 2 (`deploy_mobile.bat`) pour reconstruire l'APK.
  - Réinstallez l'APK sur le téléphone (Étape 3).

## 4. Dépannage

- **"Site inaccessible" sur le téléphone** : Vérifiez que le PC et le téléphone sont sur le même Wi-Fi et que le pare-feu Windows n'a pas bloqué Node.js/Vite.
- **Erreur JAVA_HOME** : Si `deploy_mobile.bat` échoue, vérifiez le chemin de Java dans le fichier (clic droit > Modifier).
