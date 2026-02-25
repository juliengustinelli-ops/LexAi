@echo off
cd /d "%~dp0"
call venv\Scripts\activate
python chat.py
pause
