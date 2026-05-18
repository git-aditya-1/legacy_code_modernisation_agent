import os
from pathlib import Path
from typing import Generator


SUPPORTED_EXTENSIONS = [".py"]


def scan_directory(root_path: str) -> Generator[str, None, None]:
    """
    Recursively scans a directory and yields supported source files.

    Streaming generator → does NOT load everything into memory.
    """
    root = Path(root_path)

    if not root.exists():
        raise FileNotFoundError(f"Directory not found: {root_path}")

    for file_path in root.rglob("*"):
        if file_path.is_file() and file_path.suffix in SUPPORTED_EXTENSIONS:
            yield str(file_path)


def read_file(file_path: str) -> str:
    """
    Reads file content safely.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def get_relative_path(file_path: str, root_path: str) -> str:
    """
    Returns relative path so we can preserve directory structure
    inside /modernized_code/
    """
    return str(Path(file_path).relative_to(Path(root_path)))
