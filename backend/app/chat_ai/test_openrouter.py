from __future__ import annotations

import json
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from chat_ai.client import OpenRouterChatClient
from core.config import settings


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if not settings.OPENROUTER_API_KEY:
        print("OPENROUTER_API_KEY is not configured.")
        print("Add the key to: backend/app/.env")
        print("Example: OPENROUTER_API_KEY=sk-or-v1-...")
        return 1

    client = OpenRouterChatClient()
    result = client.chat(
        "Introduce yourself briefly in English in two sentences."
    )

    print(f"Model: {result['model']}")
    print("Assistant:")
    print(result["content"])

    if result["usage"]:
        print("Usage:")
        print(json.dumps(result["usage"], ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())