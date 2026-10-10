from __future__ import annotations

import hashlib
import json
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
RAW = PROJECT / "data" / "raw"
PROCESSED = PROJECT / "data" / "processed"
RECEIPTS = PROJECT / "evidence" / "receipts"
ZIP_PATH = RAW / "hydraulic-systems.zip"
EXTRACT_DIR = RAW / "uci-hydraulic-447"
URL = "https://archive.ics.uci.edu/static/public/447/condition%2Bmonitoring%2Bof%2Bhydraulic%2Bsystems.zip"
DOI = "10.24432/C5CW21"

REQUIRED = {
    "profile.txt",
    "PS1.txt", "PS2.txt", "PS3.txt", "PS4.txt", "PS5.txt", "PS6.txt",
    "EPS1.txt", "FS1.txt", "FS2.txt", "TS1.txt", "TS2.txt", "TS3.txt", "TS4.txt",
    "VS1.txt", "CE.txt", "CP.txt", "SE.txt",
}

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    PROCESSED.mkdir(parents=True, exist_ok=True)
    RECEIPTS.mkdir(parents=True, exist_ok=True)

    downloaded = False
    if not ZIP_PATH.exists():
        urllib.request.urlretrieve(URL, ZIP_PATH)
        downloaded = True

    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    profile_candidates = list(EXTRACT_DIR.rglob("profile.txt"))
    if not profile_candidates:
        with zipfile.ZipFile(ZIP_PATH) as zf:
            zf.extractall(EXTRACT_DIR)
        profile_candidates = list(EXTRACT_DIR.rglob("profile.txt"))

    if len(profile_candidates) != 1:
        raise RuntimeError(f"Expected exactly one profile.txt after extraction; found {len(profile_candidates)}")

    data_dir = profile_candidates[0].parent
    present = {p.name for p in data_dir.iterdir() if p.is_file()}
    missing = sorted(REQUIRED - present)
    if missing:
        raise RuntimeError(f"Dataset archive missing required files: {missing}")

    receipt = {
        "schema": "ci-research.acquisition-receipt/v1",
        "source": {
            "title": "Condition monitoring of hydraulic systems",
            "publisher": "UCI Machine Learning Repository",
            "datasetId": 447,
            "doi": DOI,
            "url": URL,
            "license": "CC BY 4.0",
        },
        "downloadedThisRun": downloaded,
        "zipPath": str(ZIP_PATH.relative_to(PROJECT)),
        "zipBytes": ZIP_PATH.stat().st_size,
        "zipSha256": sha256(ZIP_PATH),
        "extractedRoot": str(data_dir.relative_to(PROJECT)),
        "requiredFiles": sorted(REQUIRED),
        "acquiredAtUtc": datetime.now(timezone.utc).isoformat(),
    }
    rendered = json.dumps(receipt, indent=2) + "\n"
    (PROCESSED / "acquisition-receipt.json").write_text(rendered, encoding="utf-8")
    (RECEIPTS / "acquisition-receipt.json").write_text(rendered, encoding="utf-8")
    print(rendered, end="")

if __name__ == "__main__":
    main()
