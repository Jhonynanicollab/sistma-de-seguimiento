import subprocess

try:
    print("Running node -v...")
    res = subprocess.run(["node", "-v"], capture_output=True, text=True, shell=True)
    print("Exit code:", res.returncode)
    print("Stdout:", repr(res.stdout))
    print("Stderr:", repr(res.stderr))
except Exception as e:
    print("Error:", e)

try:
    print("\nRunning npm -v...")
    res = subprocess.run(["npm", "-v"], capture_output=True, text=True, shell=True)
    print("Exit code:", res.returncode)
    print("Stdout:", repr(res.stdout))
    print("Stderr:", repr(res.stderr))
except Exception as e:
    print("Error:", e)
