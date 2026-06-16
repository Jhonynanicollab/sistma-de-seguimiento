import urllib.request
import socket

def check_port(url, name):
    try:
        response = urllib.request.urlopen(url, timeout=2)
        print(f"{name} ({url}) is UP! Response code: {response.status}")
        return True
    except Exception as e:
        print(f"{name} ({url}) is DOWN! Error: {e}")
        return False

print("Checking ports...")
b_up = check_port("http://localhost:8000/", "Backend")
f_up = check_port("http://localhost:5173/", "Frontend")
