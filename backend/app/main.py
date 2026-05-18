import os
import sys
from pathlib import Path

# --- OPTION 1: Path Injection ---
# This looks at the location of this file (main.py), 
# goes up one level to the 'app' folder, then up again to 'backend'.
# It adds 'backend' to the system path so Python can see 'acmp' and 'app' packages.
ROOT_PATH = str(Path(__file__).resolve().parent.parent)
if ROOT_PATH not in sys.path:
    sys.path.append(ROOT_PATH)


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI(title="ACMP Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)