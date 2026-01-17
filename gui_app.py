import tkinter as tk
from tkinter import ttk, messagebox
import threading
import subprocess
import sys
import os
import random
import time
import json

# Try to import the original script's functions
try:
    import auto_gmail_creator as agc
except ImportError:
    pass

class GmailCreatorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Auto-Gmail-Creator GUI")
        self.root.geometry("600x500")
        
        self.setup_ui()
        
    def setup_ui(self):
        # Main Frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="Auto-Gmail-Creator", font=("Helvetica", 16, "bold"))
        title_label.pack(pady=10)
        
        # Settings Frame
        settings_frame = ttk.LabelFrame(main_frame, text="Settings", padding="10")
        settings_frame.pack(fill=tk.X, pady=10)
        
        # Number of accounts
        ttk.Label(settings_frame, text="Number of Accounts:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.num_accounts = tk.IntVar(value=5)
        ttk.Entry(settings_frame, textvariable=self.num_accounts, width=10).grid(row=0, column=1, sticky=tk.W, pady=5)
        
        # Password
        ttk.Label(settings_frame, text="Default Password:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.password = tk.StringVar(value="ShadowHacker##$$%%^^&&")
        ttk.Entry(settings_frame, textvariable=self.password, width=30).grid(row=1, column=1, sticky=tk.W, pady=5)
        
        # Log Area
        log_frame = ttk.LabelFrame(main_frame, text="Activity Log", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        self.log_text = tk.Text(log_frame, height=10, state=tk.DISABLED)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # Buttons
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill=tk.X, pady=10)
        
        self.install_btn = ttk.Button(btn_frame, text="Install Dependencies", command=self.install_dependencies)
        self.install_btn.pack(side=tk.LEFT, padx=5)
        
        self.start_btn = ttk.Button(btn_frame, text="Start Creation", command=self.start_creation)
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        self.stop_btn = ttk.Button(btn_frame, text="Stop", command=self.stop_creation, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=5)
        
        self.running = False

    def log(self, message):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {message}\n")
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)

    def install_dependencies(self):
        def run_install():
            self.log("Starting installation...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
                self.log("Dependencies installed successfully!")
                messagebox.showinfo("Success", "All dependencies installed!")
            except Exception as e:
                self.log(f"Installation failed: {str(e)}")
                messagebox.showerror("Error", f"Installation failed: {str(e)}")
        
        threading.Thread(target=run_install, daemon=True).start()

    def start_creation(self):
        if self.running:
            return
        
        self.running = True
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.ENABLED)
        
        threading.Thread(target=self.creation_loop, daemon=True).start()

    def stop_creation(self):
        self.running = False
        self.log("Stopping... (will finish current account)")
        self.stop_btn.config(state=tk.DISABLED)

    def creation_loop(self):
        try:
            import auto_gmail_creator as agc
            # Update password in the module
            agc.your_password = self.password.get()
            
            count = self.num_accounts.get()
            self.log(f"Starting to create {count} accounts...")
            
            for i in range(count):
                if not self.running:
                    break
                
                self.log(f"Creating account {i+1}/{count}...")
                # Redirect print to our log
                # This is a simplified version; in a real app, we'd wrap the agc functions
                try:
                    # We call the logic from agc but with our own driver management if needed
                    # For now, we'll just use the existing function
                    agc.create_multiple_accounts(1)
                    self.log(f"Finished account {i+1}")
                except Exception as e:
                    self.log(f"Error on account {i+1}: {str(e)}")
                
                time.sleep(random.randint(2, 5))
                
            self.log("Process completed.")
        except ImportError:
            self.log("Error: auto_gmail_creator.py not found or dependencies not installed.")
        except Exception as e:
            self.log(f"Critical Error: {str(e)}")
        finally:
            self.running = False
            self.root.after(0, lambda: self.start_btn.config(state=tk.NORMAL))
            self.root.after(0, lambda: self.stop_btn.config(state=tk.DISABLED))

if __name__ == "__main__":
    root = tk.Tk()
    app = GmailCreatorGUI(root)
    root.mainloop()
