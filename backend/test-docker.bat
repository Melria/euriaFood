@echo off
echo 🐳 Test du build Docker...

:: Nettoyage
docker system prune -f

:: Test avec Dockerfile simple d'abord
echo 📦 Test avec Dockerfile simple...
docker build -f Dockerfile.simple -t test-simple .

if %errorlevel% equ 0 (
    echo ✅ Build simple réussi!
    
    :: Test du container
    echo 🚀 Test du container...
    docker run -d -p 8080:8000 --name test-container test-simple
    
    :: Attendre le démarrage
    timeout /t 10 /nobreak > nul
    
    :: Test de l'API
    curl -f http://localhost:8080/docs
    
    if %errorlevel% equ 0 (
        echo ✅ API fonctionne!
    ) else (
        echo ❌ API ne répond pas
        docker logs test-container
    )
    
    :: Nettoyage
    docker stop test-container
    docker rm test-container
    
) else (
    echo ❌ Build simple échoué
    echo 🔍 Tentative avec requirements simplifiés...
    
    :: Backup du requirements original
    copy requirements.txt requirements-original.txt
    copy requirements-simple.txt requirements.txt
    
    :: Nouveau test
    docker build -f Dockerfile.simple -t test-simple-req .
    
    if %errorlevel% equ 0 (
        echo ✅ Build avec requirements simplifiés réussi!
    ) else (
        echo ❌ Échec total - vérifier manuellement
    )
    
    :: Restaurer l'original
    copy requirements-original.txt requirements.txt
)

pause
