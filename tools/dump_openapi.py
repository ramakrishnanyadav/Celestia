import json
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.main import app

out_path = Path(__file__).resolve().parent.parent / "docs" / "openapi.json"
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(app.openapi(), f, indent=2)

print(f"Dumped OpenAPI specification to {out_path}")
