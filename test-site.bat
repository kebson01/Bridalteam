@echo off
echo 🚀 Testing Bridalteam Site...
echo.

echo Checking Docker status...
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo.
echo Starting development environment...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo Checking container status...
docker-compose ps

echo.
echo 🎉 Site should be available at: http://localhost
echo.
echo Press any key to open the site in your browser...
pause > nul

start http://localhost

echo.
echo To stop the site, run: docker-compose down
pause
