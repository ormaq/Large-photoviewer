@echo off
REM Navigate to the directory where the .bat file is located
cd /d "%~dp0"

REM Start the Python HTTP server
REM This works for Python 3. Use python3 if python is not set for Python 3.
python -m http.server 8000

REM Pause to keep the window open (optional)
pause
