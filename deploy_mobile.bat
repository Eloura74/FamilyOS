@echo off
echo ===================================================
echo   FamilyOS Mobile Deployer
echo ===================================================

REM 1. Configuration de l'environnement
set "JAVA_HOME=A:\Logiciels\Android_studio\App\jbr"

echo [1/2] Configuration de JAVA_HOME...
echo JAVA_HOME defini sur: %JAVA_HOME%

REM 2. Lancement de Capacitor
echo [2/2] Construction et lancement sur le telephone...
cd frontend
call npm run build
call npx cap sync
REM Construction de l'APK via Gradle (sans lancer l'emulateur)
cd android
call gradlew.bat assembleDebug
cd ..

echo [INFO] Copie de l'APK vers le dossier public...
copy "android\app\build\outputs\apk\debug\app-debug.apk" "public\familyos.apk" /Y
echo [OK] APK mis a jour ! Vous pouvez le telecharger sur http://192.168.1.10:5173/familyos.apk
pause
