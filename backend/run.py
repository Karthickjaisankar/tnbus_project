"""Container entrypoint. Reads PORT from the environment in Python so we
never depend on shell variable expansion (Railway runs commands in exec
form, where '$PORT' would be passed literally and crash uvicorn)."""
import os

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port)
