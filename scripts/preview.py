"""Local static preview with media byte ranges. AI-assisted by OpenAI Codex.

Run from any directory: python scripts/preview.py
Binds loopback only. Uses only Python's standard library.
"""
import argparse
import http.server
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Preview(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_head(self):
        self.byte_range = None
        parts = Path(unquote(urlsplit(self.path).path)).parts
        if any(p.startswith('.') and p not in {'.', '..'} for p in parts):
            self.send_error(404)
            return None
        path = Path(self.translate_path(self.path))
        if not path.is_file() or path.suffix.lower() not in {'.mp4', '.m4a', '.mp3', '.wav'}:
            return super().send_head()
        size = path.stat().st_size
        start, end = 0, size-1
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested.strip())
            valid = bool(match and any(match.groups()))
            if valid:
                first, last = match.groups()
                if first:
                    start = int(first)
                    end = min(int(last), size-1) if last else size-1
                else:
                    start = max(0, size-int(last))
                valid = 0 <= start <= end < size
            if not valid:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        source = path.open('rb')
        source.seek(start)
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end-start+1))
        self.send_header('Last-Modified', self.date_time_string(path.stat().st_mtime))
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        self.byte_range = (start, end)
        return source

    def copyfile(self, source, output):
        try:
            if self.byte_range is None:
                return super().copyfile(source, output)
            remaining = self.byte_range[1]-self.byte_range[0]+1
            while remaining > 0:
                data = source.read(min(65536, remaining))
                if not data:
                    break
                output.write(data)
                remaining -= len(data)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # Browser cancelled a preload or seek.

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8766)
    args = parser.parse_args()
    server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Preview)
    print(f'Flashpoint preview: http://127.0.0.1:{args.port}/site/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
