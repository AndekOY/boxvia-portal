#!/usr/bin/env python3
"""Read-only HTTP diagnostics for the isolated BoxVia Preview Worker.

Never sends credentials, cookies or request bodies.
A 403 is recorded as a blocked verification, not a failed deployment.
"""
import urllib.error
import urllib.request

BASE = "https://boxvia-service-preview.andeks.workers.dev"
PATHS = ("/api/health", "/services/technical-pilot/")
for path in PATHS:
    req = urllib.request.Request(
        BASE + path,
        headers={"User-Agent": "BoxVia-Preview-Verification/1.0", "Accept": "text/html,application/json"},
    )
    try:
        response = urllib.request.urlopen(req, timeout=20)
    except urllib.error.HTTPError as exc:
        response = exc
    except Exception as exc:
        print(f"{path}: NETWORK_ERROR {type(exc).__name__}: {exc}")
        continue
    with response:
        status = response.status
        headers = response.headers
        body = response.read(1024).decode("utf-8", "replace")
    print(f"{path}: HTTP {status}")
    for name in ("content-type", "server", "cf-ray", "cf-mitigated", "location", "www-authenticate"):
        if headers.get(name):
            print(f"  {name}: {headers[name]}")
    if status == 200 and path.endswith("/technical-pilot/"):
        print("  preview_sitekey_present:", 'data-sitekey="0x4AAAAAAF9H9qiroFWGcniz"' in body)
    if status == 403:
        print("  BLOCKED: determine Cloudflare security/Access policy from Ray ID before changing configuration")
    if status != 200:
        print("  body_prefix:", body[:250].replace("\n", " "))
