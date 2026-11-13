"""
Autofix-AI Side-by-Side Dual Console Launcher
Launches exactly two CMD windows tiled side-by-side:
- Left Half : AI Backend Engine (FastAPI on Port 8000)
- Right Half: Localhost Frontend (Next.js on Port 3000)
Automatically launches the browser at http://localhost:3000 and closes the launcher
so exactly 2 windows are open on screen.
"""

import os
import sys
import time
import subprocess
import webbrowser
import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32

class RECT(ctypes.Structure):
    _fields_ = [
        ('left', wintypes.LONG),
        ('top', wintypes.LONG),
        ('right', wintypes.LONG),
        ('bottom', wintypes.LONG),
    ]

def get_work_area():
    """Retrieves primary monitor working area excluding taskbar."""
    rect = RECT()
    # SPI_GETWORKAREA = 0x0030
    user32.SystemParametersInfoW(0x0030, 0, ctypes.byref(rect), 0)
    w = rect.right - rect.left
    h = rect.bottom - rect.top
    return rect.left, rect.top, w, h

def find_windows_by_title(substring: str):
    matches = []
    def enum_handler(hwnd, extra):
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buf = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buf, length + 1)
                if substring.lower() in buf.value.lower():
                    matches.append(hwnd)
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows(WNDENUMPROC(enum_handler), 0)
    return matches

def position_window(hwnd, x, y, width, height):
    # SW_RESTORE = 9
    user32.ShowWindow(hwnd, 9)
    # Move and resize window
    user32.MoveWindow(hwnd, int(x), int(y), int(width), int(height), True)

def main():
    print("=" * 65)
    print("   AUTOFIX-AI : SIDE-BY-SIDE DUAL CONSOLE LAUNCHER")
    print("=" * 65)
    print("Detecting screen layout and project roots...")

    # Determine directories
    current_dir = os.path.abspath(os.path.dirname(__file__))
    workspace_root = os.path.abspath(os.path.join(current_dir, ".."))
    
    candidates = [
        (os.path.join(workspace_root, "autofix-ai"), os.path.join(workspace_root, "autofix-ai", "frontend")),
        (os.path.join(current_dir, "..", "autofix-ai"), os.path.join(current_dir, "..", "autofix-ai", "frontend")),
        (workspace_root, os.path.join(workspace_root, "frontend")),
    ]

    backend_dir = None
    frontend_dir = None
    for b_candidate, f_candidate in candidates:
        if os.path.exists(os.path.join(b_candidate, "backend", "main.py")):
            backend_dir = b_candidate
            frontend_dir = f_candidate
            break

    if not backend_dir:
        print("[ERROR] Could not resolve project root directory containing backend/main.py")
        sys.exit(1)

    print(f"[OK] Backend Dir : {backend_dir}")
    print(f"[OK] Frontend Dir: {frontend_dir}")

    left, top, screen_w, screen_h = get_work_area()
    half_w = screen_w // 2

    backend_title = "Autofix-AI [AI Backend Engine :8000]"
    frontend_title = "Autofix-AI [Frontend Localhost :3000]"

    # Launch Backend CMD Window
    print(f"\n[1/2] Launching AI Backend (Left screen: 0, 0, {half_w}, {screen_h})...")
    backend_cmd = (
        f'start "{backend_title}" cmd /k '
        f'"title {backend_title} && cd /d \"{backend_dir}\" && '
        f'python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"'
    )
    subprocess.Popen(backend_cmd, shell=True)

    # Launch Frontend CMD Window
    print(f"[2/2] Launching Localhost Frontend (Right screen: {half_w}, 0, {screen_w - half_w}, {screen_h})...")
    frontend_cmd = (
        f'start "{frontend_title}" cmd /k '
        f'"title {frontend_title} && cd /d \"{frontend_dir}\" && '
        f'npm run dev"'
    )
    subprocess.Popen(frontend_cmd, shell=True)

    print("\nAligning both command windows side-by-side...")
    # Poll for window handles to appear (up to 4 seconds)
    backend_hwnd = None
    frontend_hwnd = None

    for _ in range(20):
        time.sleep(0.2)
        if not backend_hwnd:
            hwnds = find_windows_by_title("AI Backend Engine :8000")
            if hwnds:
                backend_hwnd = hwnds[0]
        if not frontend_hwnd:
            hwnds = find_windows_by_title("Frontend Localhost :3000")
            if hwnds:
                frontend_hwnd = hwnds[0]

        if backend_hwnd and frontend_hwnd:
            break

    if backend_hwnd:
        position_window(backend_hwnd, left, top, half_w, screen_h)
        print("  ✓ AI Backend CMD positioned on LEFT half.")
    else:
        print("  ! AI Backend window not yet registered for tiling.")

    if frontend_hwnd:
        position_window(frontend_hwnd, left + half_w, top, screen_w - half_w, screen_h)
        print("  ✓ Localhost Frontend CMD positioned on RIGHT half.")
    else:
        print("  ! Frontend window not yet registered for tiling.")

    # Automatically open browser
    time.sleep(1.0)
    print("\nOpening application console at http://localhost:3000 in your browser...")
    try:
        webbrowser.open("http://localhost:3000")
    except Exception as e:
        print(f"Notice: Please open http://localhost:3000 in your browser ({e})")

    print("\n" + "=" * 65)
    print("   SUCCESS: Dual side-by-side consoles active.")
    print("   Exiting launcher script cleanly (only 2 windows kept open).")
    print("=" * 65)
    time.sleep(0.5)

if __name__ == "__main__":
    main()
