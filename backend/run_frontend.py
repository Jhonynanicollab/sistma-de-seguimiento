import subprocess
import time
import os

frontend_dir = r"C:\Users\crist\Documents\2026\practicas pre profesionales\sistema de monitoreo de plan de trabajo\practica_sistema\sistema-seguimiento-pti\frontend"

print("Starting npm run dev in:", frontend_dir)
try:
    # Use Popen to run it as a background process from Python
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        shell=True
    )
    
    # Wait a bit and check if it's still running
    time.sleep(3)
    
    # Read any output
    print("Checking process status...")
    poll = proc.poll()
    if poll is None:
        print("Process is still running!")
        # Print first few lines of output
        print("Reading stdout...")
        # To avoid blocking, we read line by line or use a non-blocking read
        # Let's write stdout to a file so we can view it
        with open("frontend_out.log", "w", encoding="utf-8") as f:
            f.write("Frontend is running\n")
    else:
        print("Process exited with code:", poll)
        stdout, stderr = proc.communicate()
        print("Stdout:", stdout)
        print("Stderr:", stderr)
except Exception as e:
    print("Error:", e)
