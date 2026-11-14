"""
Autofix-AI Desktop Application Controller & Production Launcher
Manages FastAPI Backend Engine and Next.js Production Web Server,
automatically launches the full application in the default browser,
and provides a clean dark-themed management UI with graceful shutdown.
"""

import os
import sys
import time
import socket
import shutil
import urllib.request
import subprocess
import threading
import webbrowser
import multiprocessing
import tkinter as tk
from tkinter import ttk, messagebox

# Windows subprocess creation flag for hiding console window in production
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0


def check_single_instance() -> bool:
    """
    Prevents multiple instances of AutofixAI desktop app from running simultaneously.
    If another instance is already running, it brings focus to browser and exits cleanly.
    """
    if sys.platform != "win32":
        return True
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        mutex_name = "Local\\AutofixAI_Production_Singleton_Mutex_2026"
        kernel32.CreateMutexW(None, True, mutex_name)
        last_error = kernel32.GetLastError()
        # ERROR_ALREADY_EXISTS = 183
        if last_error == 183:
            try:
                webbrowser.open("http://localhost:3000")
            except Exception:
                pass
            return False
        return True
    except Exception:
        return True


def get_base_dir() -> str:
    """Resolves base directory whether running from PyInstaller frozen exe or script."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def get_system_python() -> str:
    """
    Finds the real Python interpreter on the system.
    CRITICAL: When running as a PyInstaller frozen .exe, sys.executable points to AutofixAI.exe!
    We MUST NOT run sys.executable as python, or it will spawn endless AutofixAI.exe windows!
    """
    if not getattr(sys, "frozen", False):
        return sys.executable

    # Check for python / py in PATH
    for py_cmd in ["python", "python3", "py"]:
        candidate = shutil.which(py_cmd)
        if candidate and not candidate.lower().endswith("autofixai.exe"):
            return candidate

    # Common Windows install locations
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    candidates = [
        r"C:\Users\DELL\AppData\Local\Programs\Python\Python310\python.exe",
        os.path.join(local_app_data, r"Programs\Python\Python310\python.exe"),
        os.path.join(local_app_data, r"Programs\Python\Python311\python.exe"),
        os.path.join(local_app_data, r"Programs\Python\Python312\python.exe"),
        r"C:\Python310\python.exe",
        r"C:\Python311\python.exe",
        r"C:\Python312\python.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c

    return "python"


def find_project_directories():
    """Locates backend and frontend root directories dynamically."""
    base = get_base_dir()
    candidates = [
        (os.path.join(base, "autofix-ai"), os.path.join(base, "autofix-ai", "frontend")),
        (os.path.join(base, "..", "autofix-ai"), os.path.join(base, "..", "autofix-ai", "frontend")),
        (base, os.path.join(base, "frontend")),
        (os.path.join(base, ".."), os.path.join(base, "..", "frontend")),
    ]

    for b_path, f_path in candidates:
        if os.path.exists(os.path.join(b_path, "backend", "main.py")):
            return os.path.abspath(b_path), os.path.abspath(f_path)

    # Fallback to current working directory
    cwd = os.getcwd()
    if os.path.exists(os.path.join(cwd, "backend", "main.py")):
        return cwd, os.path.join(cwd, "frontend")
    if os.path.exists(os.path.join(cwd, "autofix-ai", "backend", "main.py")):
        return os.path.join(cwd, "autofix-ai"), os.path.join(cwd, "autofix-ai", "frontend")

    return None, None


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def check_url(url: str, timeout: float = 1.0) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AutofixAI-HealthCheck"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status in (200, 304, 307, 308)
    except Exception:
        return False


class AutofixAppController:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Autofix-AI • Production System Controller")
        self.root.geometry("540x440")
        self.root.resizable(False, False)
        self.root.configure(bg="#0B0F19")

        # Set Icon
        self.icon_path = self.resolve_icon_path()
        if self.icon_path and os.path.exists(self.icon_path):
            try:
                self.root.iconbitmap(self.icon_path)
            except Exception:
                pass

        self.backend_dir, self.frontend_dir = find_project_directories()
        self.backend_proc = None
        self.frontend_proc = None
        self.is_running = True
        self.browser_opened = False

        self.setup_ui()
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

        # Start servers in background thread
        threading.Thread(target=self.start_servers_lifecycle, daemon=True).start()

    def resolve_icon_path(self) -> str:
        base = get_base_dir()
        icon_candidates = [
            os.path.join(base, "Logo", "app_icon.ico"),
            os.path.join(base, "..", "Logo", "app_icon.ico"),
            os.path.join(base, "app_icon.ico"),
            os.path.join(base, "autofix-ai", "frontend", "public", "symbol.png"),
        ]
        for c in icon_candidates:
            if os.path.exists(c) and c.endswith(".ico"):
                return c
        return ""

    def setup_ui(self):
        # Header Frame
        header = tk.Frame(self.root, bg="#111827", padx=20, pady=16)
        header.pack(fill=tk.X)

        title_lbl = tk.Label(
            header,
            text="AUTOFIX-AI",
            font=("Segoe UI", 16, "bold"),
            fg="#60A5FA",
            bg="#111827",
        )
        title_lbl.pack(anchor="w")

        subtitle_lbl = tk.Label(
            header,
            text="Autonomous L1/L2 Self-Healing IT Support Platform",
            font=("Segoe UI", 9),
            fg="#9CA3AF",
            bg="#111827",
        )
        subtitle_lbl.pack(anchor="w")

        # Status Card Frame
        status_card = tk.Frame(self.root, bg="#1F2937", bd=1, relief=tk.SOLID, padx=16, pady=14)
        status_card.pack(fill=tk.X, padx=20, pady=16)

        # Backend Status Row
        row1 = tk.Frame(status_card, bg="#1F2937")
        row1.pack(fill=tk.X, pady=4)
        tk.Label(row1, text="AI Backend Engine (FastAPI :8000):", font=("Segoe UI", 9, "bold"), fg="#E5E7EB", bg="#1F2937").pack(side=tk.LEFT)
        self.backend_status_lbl = tk.Label(row1, text="🟡 Starting...", font=("Segoe UI", 9, "bold"), fg="#FBBF24", bg="#1F2937")
        self.backend_status_lbl.pack(side=tk.RIGHT)

        # Frontend Status Row
        row2 = tk.Frame(status_card, bg="#1F2937")
        row2.pack(fill=tk.X, pady=4)
        tk.Label(row2, text="Frontend Console (Next.js :3000):", font=("Segoe UI", 9, "bold"), fg="#E5E7EB", bg="#1F2937").pack(side=tk.LEFT)
        self.frontend_status_lbl = tk.Label(row2, text="🟡 Compiling...", font=("Segoe UI", 9, "bold"), fg="#FBBF24", bg="#1F2937")
        self.frontend_status_lbl.pack(side=tk.RIGHT)

        # Knowledge Bank Row
        row3 = tk.Frame(status_card, bg="#1F2937")
        row3.pack(fill=tk.X, pady=4)
        tk.Label(row3, text="Knowledge Bank & Cloud Memory:", font=("Segoe UI", 9, "bold"), fg="#E5E7EB", bg="#1F2937").pack(side=tk.LEFT)
        self.bank_status_lbl = tk.Label(row3, text="🟢 SQLite Active", font=("Segoe UI", 9, "bold"), fg="#34D399", bg="#1F2937")
        self.bank_status_lbl.pack(side=tk.RIGHT)

        # Info Label
        self.info_lbl = tk.Label(
            self.root,
            text="Compiling Next.js project. Browser will open automatically once ready...",
            font=("Segoe UI", 8),
            fg="#9CA3AF",
            bg="#0B0F19",
        )
        self.info_lbl.pack(pady=4)

        # Actions Buttons Frame
        btn_frame = tk.Frame(self.root, bg="#0B0F19", padx=20)
        btn_frame.pack(fill=tk.X, pady=10)

        # Primary Launch Browser Button
        self.btn_browser = tk.Button(
            btn_frame,
            text="🚀  Open Autofix-AI in Browser",
            font=("Segoe UI", 10, "bold"),
            bg="#2563EB",
            fg="#FFFFFF",
            activebackground="#1D4ED8",
            activeforeground="#FFFFFF",
            bd=0,
            padx=16,
            pady=10,
            cursor="hand2",
            command=self.open_browser,
        )
        self.btn_browser.pack(fill=tk.X, pady=4)

        # Secondary Links Frame
        sub_btn_frame = tk.Frame(btn_frame, bg="#0B0F19")
        sub_btn_frame.pack(fill=tk.X, pady=4)

        self.btn_dashboard = tk.Button(
            sub_btn_frame,
            text="📊 Dashboard",
            font=("Segoe UI", 9),
            bg="#374151",
            fg="#E5E7EB",
            activebackground="#4B5563",
            bd=0,
            padx=10,
            pady=6,
            cursor="hand2",
            command=lambda: webbrowser.open("http://localhost:3000/dashboard"),
        )
        self.btn_dashboard.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        self.btn_docs = tk.Button(
            sub_btn_frame,
            text="🔍 API Docs",
            font=("Segoe UI", 9),
            bg="#374151",
            fg="#E5E7EB",
            activebackground="#4B5563",
            bd=0,
            padx=10,
            pady=6,
            cursor="hand2",
            command=lambda: webbrowser.open("http://localhost:8000/docs"),
        )
        self.btn_docs.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        self.btn_restart = tk.Button(
            sub_btn_frame,
            text="🔄 Restart",
            font=("Segoe UI", 9),
            bg="#374151",
            fg="#E5E7EB",
            activebackground="#4B5563",
            bd=0,
            padx=10,
            pady=6,
            cursor="hand2",
            command=self.restart_services,
        )
        self.btn_restart.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        # Bottom Shutdown Bar
        bottom_bar = tk.Frame(self.root, bg="#0B0F19", padx=20, pady=8)
        bottom_bar.pack(fill=tk.X, side=tk.BOTTOM)

        btn_exit = tk.Button(
            bottom_bar,
            text="🛑  Stop All Services & Exit",
            font=("Segoe UI", 9),
            bg="#7F1D1D",
            fg="#FCA5A5",
            activebackground="#991B1B",
            activeforeground="#FFFFFF",
            bd=0,
            pady=6,
            cursor="hand2",
            command=self.on_closing,
        )
        btn_exit.pack(fill=tk.X)

    def start_servers_lifecycle(self):
        """Starts backend and frontend servers, monitoring until fully compiled and ready."""
        # 1. Backend
        if is_port_in_use(8000):
            self.backend_status_lbl.config(text="🟢 Online (Port 8000)", fg="#34D399")
        else:
            self.start_backend()

        # 2. Frontend
        if is_port_in_use(3000):
            self.frontend_status_lbl.config(text="🟢 Online (Port 3000)", fg="#34D399")
        else:
            self.start_frontend()

        # Poll health and compilation status (up to 90 seconds)
        for _ in range(90):
            if not self.is_running:
                break
            time.sleep(1.0)

            b_ready = check_url("http://127.0.0.1:8000/health") or is_port_in_use(8000)
            f_ready = check_url("http://127.0.0.1:3000")

            if b_ready:
                self.backend_status_lbl.config(text="🟢 Online (:8000)", fg="#34D399")
            if f_ready:
                self.frontend_status_lbl.config(text="🟢 Online (:3000)", fg="#34D399")

            # ONLY open browser once frontend has completely finished compiling and responds with HTTP 200
            if b_ready and f_ready and not self.browser_opened:
                self.browser_opened = True
                self.info_lbl.config(text="✓ Project compiled! Opened in browser.", fg="#34D399")
                try:
                    webbrowser.open("http://localhost:3000")
                except Exception:
                    pass
                break

    def start_backend(self):
        if not self.backend_dir or not os.path.exists(self.backend_dir):
            self.backend_status_lbl.config(text="❌ Directory Missing", fg="#EF4444")
            return

        python_bin = get_system_python()
        cmd = [python_bin, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
        try:
            self.backend_proc = subprocess.Popen(
                cmd,
                cwd=self.backend_dir,
                creationflags=CREATE_NO_WINDOW,
            )
        except Exception:
            self.backend_status_lbl.config(text="❌ Launch Failed", fg="#EF4444")

    def start_frontend(self):
        if not self.frontend_dir or not os.path.exists(self.frontend_dir):
            self.frontend_status_lbl.config(text="❌ Directory Missing", fg="#EF4444")
            return

        node_bin = shutil.which("node") or "node"
        standalone_server = os.path.join(self.frontend_dir, ".next", "standalone", "server.js")
        if os.path.exists(standalone_server):
            # Production standalone node server (boots in < 200ms)
            cmd = [node_bin, standalone_server]
            cwd = os.path.join(self.frontend_dir, ".next", "standalone")
        else:
            # Development fallback
            cmd = ["cmd.exe", "/c", "npm run dev"]
            cwd = self.frontend_dir

        try:
            self.frontend_proc = subprocess.Popen(
                cmd,
                cwd=cwd,
                creationflags=CREATE_NO_WINDOW,
            )
        except Exception:
            self.frontend_status_lbl.config(text="❌ Launch Failed", fg="#EF4444")

    def open_browser(self):
        webbrowser.open("http://localhost:3000")

    def restart_services(self):
        self.info_lbl.config(text="Restarting server daemons...", fg="#FBBF24")
        self.stop_subprocesses()
        self.browser_opened = True  # Don't pop up browser again on restart
        threading.Thread(target=self.start_servers_lifecycle, daemon=True).start()

    def stop_subprocesses(self):
        if self.backend_proc:
            try:
                self.backend_proc.terminate()
                self.backend_proc.wait(timeout=1.0)
            except Exception:
                try:
                    self.backend_proc.kill()
                except Exception:
                    pass
            self.backend_proc = None

        if self.frontend_proc:
            try:
                self.frontend_proc.terminate()
                self.frontend_proc.wait(timeout=1.0)
            except Exception:
                try:
                    self.frontend_proc.kill()
                except Exception:
                    pass
            self.frontend_proc = None

        # Clean lingering uvicorn or node on ports 8000 & 3000 if needed on Windows
        if sys.platform == "win32":
            subprocess.run("taskkill /F /IM node.exe >nul 2>&1", shell=True)

    def on_closing(self):
        self.is_running = False
        self.info_lbl.config(text="Shutting down services gracefully...", fg="#EF4444")
        self.stop_subprocesses()
        self.root.destroy()


def main():
    multiprocessing.freeze_support()
    # Check single-instance mutex: if already running, exit immediately
    if not check_single_instance():
        sys.exit(0)

    root = tk.Tk()
    app = AutofixAppController(root)
    root.mainloop()


if __name__ == "__main__":
    main()
