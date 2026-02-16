import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import threading
import time
import webbrowser
import os
import qrcode

class StatusWindow:
    def __init__(self, client, on_quit_callback):
        self.client = client
        self.on_quit = on_quit_callback
        
        self.root = tk.Tk()
        self.root.title("GridPass")
        self.root.geometry("340x520") # Slightly taller for QR
        self.root.resizable(False, False)
        
        # ... (rest of init)
        
        # Dark Theme Colors
        self.bg_color = "#1a1a1a"
        self.fg_color = "#ffffff"
        self.accent_color = "#007bff"
        self.success_color = "#28a745"
        self.warning_color = "#ffc107"
        self.error_color = "#dc3545"
        
        self.root.configure(bg=self.bg_color)
        
        # Style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure("TLabel", background=self.bg_color, foreground=self.fg_color)
        self.style.configure("TButton", background=self.accent_color, foreground=self.fg_color, borderwidth=0)
        self.style.map("TButton", background=[("active", "#0056b3")])

        # Header
        self.header_frame = tk.Frame(self.root, bg=self.bg_color)
        self.header_frame.pack(fill="x", pady=15)
        
        try:
            # Try to load icon for header if available
            icon_path = os.path.join(os.path.dirname(__file__), "icon.png")
            if os.path.exists(icon_path):
                img = Image.open(icon_path).resize((32, 32))
                self.icon_img = ImageTk.PhotoImage(img)
                tk.Label(self.header_frame, image=self.icon_img, bg=self.bg_color).pack(side="left", padx=(20, 10))
        except:
            pass

        tk.Label(self.header_frame, text="GridPass Client", font=("Segoe UI", 16, "bold"), bg=self.bg_color, fg=self.fg_color).pack(side="left")

        # Status Section
        self.status_frame = tk.Frame(self.root, bg="#2d2d2d", padx=15, pady=15)
        self.status_frame.pack(fill="x", padx=20, pady=10)
        
        self.status_label = tk.Label(self.status_frame, text="Status: Initializing...", font=("Segoe UI", 10), bg="#2d2d2d", fg=self.fg_color)
        self.status_label.pack(anchor="w")
        
        # Sim Racing Info (Hidden by default)
        self.sim_frame = tk.Frame(self.root, bg=self.bg_color)
        
        self.car_label = tk.Label(self.sim_frame, text="Car: --", font=("Segoe UI", 9), bg=self.bg_color, fg="#aaaaaa")
        self.car_label.pack(anchor="w", padx=20)
        
        self.track_label = tk.Label(self.sim_frame, text="Track: --", font=("Segoe UI", 9), bg=self.bg_color, fg="#aaaaaa")
        self.track_label.pack(anchor="w", padx=20)

        # QR Code Section
        self.qr_frame = tk.Frame(self.root, bg=self.bg_color)
        self.qr_label = tk.Label(self.qr_frame, bg=self.bg_color)
        self.qr_label.pack(pady=10)
        
        self.code_label = tk.Label(self.qr_frame, text="", font=("Consolas", 14, "bold"), bg=self.bg_color, fg=self.accent_color)
        self.code_label.pack()
        
        self.instruct_label = tk.Label(self.qr_frame, text="Scan to Activate", font=("Segoe UI", 9), bg=self.bg_color, fg="#aaaaaa")
        self.instruct_label.pack()
        
        self.current_qr_data = None
        self.qr_image_ref = None

        # Buttons
        self.btn_frame = tk.Frame(self.root, bg=self.bg_color)
        self.btn_frame.pack(side="bottom", fill="x", padx=20, pady=20)
        
        self.dash_btn = ttk.Button(self.btn_frame, text="Open Dashboard", command=self.open_dashboard)
        self.dash_btn.pack(fill="x", pady=5)
        
        self.quit_btn = ttk.Button(self.btn_frame, text="Quit App", command=self.quit_app)
        self.quit_btn.pack(fill="x")

        # Bind closing
        self.root.protocol("WM_DELETE_WINDOW", self.hide_window)
        
        # Start update loop
        self.update_ui()
        
        # Hide initially
        self.root.withdraw()

    def show_window(self):
        self.root.deiconify()
        self.root.lift()
        self.root.focus_force()

    def hide_window(self):
        self.root.withdraw()

    def quit_app(self):
        self.root.quit()
        self.on_quit()

    def open_dashboard(self):
        if self.client.device_manager.device_id:
            import config
            base_url = config.API_BASE_URL.replace("/api", "")
            if base_url.endswith("/"): base_url = base_url[:-1]
            url = f"{base_url}/sim-racing/devices/{self.client.device_manager.device_id}"
            webbrowser.open(url)
        else:
            if self.client.pairing_url:
                webbrowser.open(self.client.pairing_url)

    def update_ui(self):
        # Update Status
        status_text = "Disconnected"
        status_color = self.error_color
        
        if self.client.running:
             status_text = "Running"
             status_color = self.success_color
             
             # Check modules
             if "sim_racing" in self.client.modules:
                 sim = self.client.modules["sim_racing"]
                 if sim.running:
                     status_text = "Sim Racing: Active"
                     if hasattr(sim, 'connected') and sim.connected:
                         status_text = "iRacing Connected 🟢"
        
        if self.client.pairing_code:
            status_text = "Activation Required ⚠"
            status_color = self.warning_color
            
            self.code_label.config(text=self.client.pairing_code)
            self.qr_frame.pack(fill="x", padx=20)
            self.sim_frame.pack_forget()
            
            # Generate QR if needed
            if self.client.pairing_url and self.current_qr_data != self.client.pairing_url:
                try:
                    qr = qrcode.QRCode(box_size=4, border=2)
                    qr.add_data(self.client.pairing_url)
                    qr.make(fit=True)
                    img = qr.make_image(fill_color="black", back_color="white")
                    
                    self.qr_image_ref = ImageTk.PhotoImage(img)
                    self.qr_label.config(image=self.qr_image_ref)
                    self.current_qr_data = self.client.pairing_url
                except Exception as e:
                    print(f"QR Error: {e}")

        else:
            self.qr_frame.pack_forget()
            self.sim_frame.pack(fill="x", pady=5)
            # Update Sim Data
            if "sim_racing" in self.client.modules:
                 sim = self.client.modules["sim_racing"]
                 # Use correct attributes from module
                 if hasattr(sim, 'session_info'):
                     car = sim.session_info.get("car", "--")
                     track = sim.session_info.get("track", "--")
                     self.car_label.config(text=f"Car: {car}")
                     self.track_label.config(text=f"Track: {track}")

        self.status_label.config(text=status_text, fg=status_color)
        
        self.root.after(1000, self.update_ui)

    def run(self):
        self.root.mainloop()
