import subprocess
import sys
import os

def install_requirements():
    print("Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Requirements installed successfully.")
    except Exception as e:
        print(f"Error installing requirements: {e}")
        sys.exit(1)

def run_gui():
    print("Launching GUI...")
    try:
        subprocess.Popen([sys.executable, "gui_app.py"])
    except Exception as e:
        print(f"Error launching GUI: {e}")

if __name__ == "__main__":
    # Check if requirements are installed
    try:
        import selenium
        import requests
        import unidecode
        import fp
    except ImportError:
        install_requirements()
    
    run_gui()
