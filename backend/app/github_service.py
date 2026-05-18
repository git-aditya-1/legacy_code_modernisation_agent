import os
import shutil
import subprocess
from pathlib import Path
from typing import List, Optional

# Base directory for cloned repos
CLONE_BASE_DIR = Path(__file__).resolve().parent.parent / "cloned_repos"
SUPPORTED_EXTENSIONS = [".py"]


def clone_repo(repo_url: str) -> dict:
    """
    Clones a public GitHub repository into cloned_repos/<repo_name>/.
    Returns metadata about the cloned repo.
    """
    # Extract repo name from URL
    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    clone_path = CLONE_BASE_DIR / repo_name

    # Clean up if already cloned
    if clone_path.exists():
        shutil.rmtree(clone_path)

    # Ensure base dir exists
    CLONE_BASE_DIR.mkdir(parents=True, exist_ok=True)

    # Clone the repo
    result = subprocess.run(
        ["git", "clone", "--depth", "1", repo_url, str(clone_path)],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Git clone failed: {result.stderr.strip()}")

    # Scan files
    files = scan_repo_files(repo_name)

    return {
        "repo_name": repo_name,
        "clone_path": str(clone_path),
        "file_count": len(files),
        "files": files,
    }


def scan_repo_files(repo_name: str) -> List[dict]:
    """
    Scans a cloned repo for supported source files.
    Returns list of file metadata dicts.
    """
    clone_path = CLONE_BASE_DIR / repo_name

    if not clone_path.exists():
        raise FileNotFoundError(f"Repo not found: {repo_name}")

    files = []
    for file_path in clone_path.rglob("*"):
        if file_path.is_file() and file_path.suffix in SUPPORTED_EXTENSIONS:
            # Skip hidden dirs (.git, etc.)
            rel_path = file_path.relative_to(clone_path)
            if any(part.startswith(".") for part in rel_path.parts):
                continue

            content = file_path.read_text(encoding="utf-8", errors="replace")
            files.append({
                "path": str(file_path),
                "relative_path": str(rel_path),
                "content": content,
                "size": file_path.stat().st_size,
            })

    return files


def apply_changes(repo_name: str, relative_path: str, new_code: str) -> bool:
    """
    Writes approved modernized code back to the cloned file.
    """
    clone_path = CLONE_BASE_DIR / repo_name
    file_path = clone_path / relative_path

    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {relative_path}")

    file_path.write_text(new_code, encoding="utf-8")
    return True


def cleanup_repo(repo_name: str) -> bool:
    """
    Deletes a cloned repo directory.
    """
    clone_path = CLONE_BASE_DIR / repo_name
    if clone_path.exists():
        shutil.rmtree(clone_path)
        return True
    return False
