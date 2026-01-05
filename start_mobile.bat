@echo off
echo ===================================================
echo   FamilyOS Mobile Dev Launcher
echo ===================================================

REM 1. Configuration de l'environnement
set "JAVA_HOME=A:\Logiciels\Android_studio\App\jbr"
set "ADB_PATH=C:\Users\faber\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "DEVICE_ID=RZCY61HQLTB"

echo [1/4] Configuration de JAVA_HOME...
echo JAVA_HOME defini sur: %JAVA_HOME%

REM 2. Configuration du Tunnel ADB
echo [2/4] Activation du Tunnel Magique (ADB Reverse)...
"%ADB_PATH%" -s %DEVICE_ID% reverse tcp:8000 tcp:8000
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible d'activer le tunnel pour le port 8000. Verifiez que le telephone est branche.
    pause
    exit /b
)

"%ADB_PATH%" -s %DEVICE_ID% reverse tcp:5173 tcp:5173
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible d'activer le tunnel pour le port 5173.
    pause
    exit /b
)
echo Tunnels actifs ! (Le telephone peut maintenant voir localhost)

REM 3. Lancement du serveur Frontend
echo [3/4] Lancement du serveur Frontend...
echo L'application va demarrer. Gardez cette fenetre ouverte !
echo.
cd frontend
npm run dev
