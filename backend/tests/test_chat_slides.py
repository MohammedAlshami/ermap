"""
Integration test: chat API returns multiple slides when user asks for 3+ slides.

Run with backend up (e.g. npm run start in backend, port 3002) and OPENAI_API_KEY set.

  cd backend && python -m pytest tests/test_chat_slides.py -v
  # or
  cd backend && python tests/test_chat_slides.py
"""
import os
import sys

import requests

BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:3002")


def test_chat_returns_multiple_slides():
    """POST 'create 3 slides' and assert we get 3+ slides in the stream (add_slides used)."""
    payload = {
        "message": "Create 3 slides: first Malaysia districts, second education centers, third global landslide catalog.",
        "slides": [],
        "selected_layer_ids": [],
    }
    resp = requests.post(
        f"{BASE_URL}/api/chat",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=60,
        stream=True,
    )
    assert resp.status_code == 200, resp.text

    slides_count = 0
    for line in resp.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        try:
            import json

            data = json.loads(line[6:].strip())
        except Exception:
            continue
        if data.get("type") == "slides" and isinstance(data.get("slides"), list):
            slides_count = len(data["slides"])
        if data.get("type") == "done" and isinstance(data.get("slides"), list):
            slides_count = max(slides_count, len(data["slides"]))

    assert slides_count >= 3, (
        f"Expected 3+ slides from add_slides; got {slides_count}. "
        "Agent may have used add_slide once instead of add_slides."
    )


if __name__ == "__main__":
    # Run as script
    try:
        test_chat_returns_multiple_slides()
        print("OK: Backend returned 3+ slides.")
    except AssertionError as e:
        print("FAIL:", e, file=sys.stderr)
        sys.exit(1)
