"""Test helper: serve the repo root on a free port and open pages in headless Chromium. AI-assisted (Claude Code)."""
import functools
import http.server
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(root=ROOT):
    """Start a static server on 127.0.0.1 and a free port. Returns (server, base_url)."""
    h = functools.partial(_Quiet, directory=str(root))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"
