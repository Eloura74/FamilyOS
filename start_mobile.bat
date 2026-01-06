@echo off
echo ===================================================
echo   FamilyOS Mobile Dev Launcher
echo ===================================================

REM 1. Configuration de l'environnement
set "JAVA_HOME=A:\Logiciels\Android_studio\App\jbr"
set "ADB_PATH=C:\Users\faber\AppData\Local\Android\Sdk\platform-tools\adb.exe"
REM 2. Configuration du Tunnel ADB (Optionnel)
echo [2/4] Tentative d'activation du Tunnel ADB...
"%ADB_PATH%" reverse tcp:8000 tcp:8000
if %errorlevel% neq 0 (
    echo [INFO] Pas de telephone detecte en USB. Mode Wi-Fi uniquement.
) else (
    "%ADB_PATH%" reverse tcp:5173 tcp:5173
    echo [OK] Tunnels ADB actifs via USB.
)
echo Tunnels actifs ! (Le telephone peut maintenant voir localhost)

REM 3. Lancement du serveur Frontend
echo [3/4] Lancement du serveur Frontend...
echo L'application va demarrer. Gardez cette fenetre ouverte !
echo.
echo.
echo [2.5/4] Liberation du port 5173...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find ":5173" ^| find "LISTENING"') DO taskkill /f /pid %%a >nul 2>&1
cd frontend
call npm run dev
if %errorlevel% neq 0 (
    echo [ERREUR] Le serveur n'a pas pu demarrer.
    pause
)
pause
