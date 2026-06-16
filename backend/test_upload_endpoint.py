import urllib.request
import urllib.parse
import json
import mimetypes
import uuid

# Helper to build multipart form data
def encode_multipart_formdata(fields, files):
    boundary = uuid.uuid4().hex
    CRLF = '\r\n'
    L = []
    for (key, value) in fields.items():
        L.append('--' + boundary)
        L.append(f'Content-Disposition: form-data; name="{key}"')
        L.append('')
        L.append(str(value))
    for (key, filepath) in files.items():
        L.append('--' + boundary)
        filename = os.path.basename(filepath)
        content_type = mimetypes.guess_type(filepath)[0] or 'application/octet-stream'
        L.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"')
        L.append(f'Content-Type: {content_type}')
        L.append('')
        with open(filepath, 'rb') as f:
            L.append(f.read())
    L.append('--' + boundary + '--')
    L.append('')
    body = b''
    for item in L:
        if isinstance(item, bytes):
            body += item + CRLF.encode('ascii')
        else:
            body += item.encode('utf-8') + CRLF.encode('ascii')
    content_type = f'multipart/form-data; boundary={boundary}'
    return content_type, body

import os
# Authenticate
login_url = "http://localhost:8000/auth/login"
data = urllib.parse.urlencode({
    "username": "admin@finesi.unap.edu.pe",
    "password": "admin123"
}).encode('utf-8')

req = urllib.request.Request(login_url, data=data, method="POST")
try:
    with urllib.request.urlopen(req) as res:
        res_data = json.loads(res.read().decode('utf-8'))
        token = res_data["access_token"]
        print("Logged in successfully! Token obtained.")
except Exception as e:
    print("Failed to login:", e)
    sys.exit(1)

# Upload PDF
pdf_path = r"uploads/planes/plan_2_082f95b86dc842a193a18e930c11cf9c.pdf"
upload_url = "http://localhost:8000/planes/2/upload-pdf?extraer=true"

content_type, body = encode_multipart_formdata({}, {"archivo": pdf_path})

upload_req = urllib.request.Request(upload_url, data=body, method="POST")
upload_req.add_header("Authorization", f"Bearer {token}")
upload_req.add_header("Content-Type", content_type)

try:
    with urllib.request.urlopen(upload_req) as res:
        print("Upload responded with status:", res.status)
        print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Upload failed with HTTPError:", e.code)
    print("Response body:", e.read().decode('utf-8'))
except Exception as e:
    print("Upload failed with general error:", e)
