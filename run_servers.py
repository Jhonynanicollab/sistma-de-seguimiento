import subprocess
import time
import sys
import os

root_dir = r"C:\Users\crist\Documents\2026\practicas pre profesionales\sistema de monitoreo de plan de trabajo\practica_sistema\sistema-seguimiento-pti"
backend_dir = os.path.join(root_dir, "backend")
frontend_dir = os.path.join(root_dir, "frontend")

backend_log_path = os.path.join(root_dir, "backend.log")
frontend_log_path = os.path.join(root_dir, "frontend.log")

python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")

print(f"Starting servers...")
print(f"Backend directory: {backend_dir}")
print(f"Frontend directory: {frontend_dir}")
print(f"Python path: {python_exe}")

# Clear logs
with open(backend_log_path, "w") as f:
    f.write("--- Backend Server Log ---\n")
with open(frontend_log_path, "w") as f:
    f.write("--- Frontend Server Log ---\n")

backend_log = open(backend_log_path, "a", encoding="utf-8")
frontend_log = open(frontend_log_path, "a", encoding="utf-8")

# Start backend
print("Launching backend...")
backend_proc = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "0.0.0.0"],
    cwd=backend_dir,
    stdout=backend_log,
    stderr=backend_log,
    text=True
)

# Start frontend
print("Launching frontend...")
frontend_proc = subprocess.Popen(
    ["npm", "run", "dev", "--", "--host"],
    cwd=frontend_dir,
    stdout=frontend_log,
    stderr=frontend_log,
    text=True,
    shell=True
)

print("Servers launched. Monitoring...")
print(f"Backend log: {backend_log_path}")
print(f"Frontend log: {frontend_log_path}")

try:
    while True:
        # Check processes
        b_poll = backend_proc.poll()
        f_poll = frontend_proc.poll()
        
        if b_poll is not None:
            print(f"CRITICAL: Backend exited with code {b_poll}")
        if f_poll is not None:
            print(f"CRITICAL: Frontend exited with code {f_poll}")
            
        time.sleep(2)
except KeyboardInterrupt:
    print("Shutting down servers...")
finally:
    backend_proc.terminate()
    frontend_proc.terminate()
    backend_log.close()
    frontend_log.close()
    print("Servers stopped.")
