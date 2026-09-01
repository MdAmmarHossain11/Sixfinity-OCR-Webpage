@echo off
cd /d "%~dp0"
echo.
echo Installing dependencies (if needed)...
python -m pip install -r requirements.txt -q
echo.
echo Starting server...
python app.py
echo.
echo Server stopped.
pause
