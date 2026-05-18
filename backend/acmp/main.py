# acmp/main.py

from pathlib import Path

from graph import graph
from utils.file_loader import scan_directory, read_file, get_relative_path


INPUT_DIR = "dummy_test"
OUTPUT_DIR = "modernized_code"


def save_modernized_file(relative_path: str, code: str):
    """
    Saves modernized code while preserving directory structure.
    """

    output_path = Path(OUTPUT_DIR) / relative_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(code)


def process_file(file_path: str, root_path: str):
    """
    Runs full agent pipeline on a single file.
    """

    print(f"\nProcessing: {file_path}")

    state = {
        "file_path": file_path,
        "original_code": read_file(file_path),
        "transformation_plan": None,
        "current_code": None,
        "error_logs": None,
        "itr": 0,
    }
    print(f"INPUT CODE : \n",state["original_code"])
    result = graph.invoke(state)

    if result["error_logs"] in [None, "Execution timed out (possible infinite loop)."]:
        relative_path = get_relative_path(file_path, root_path)
        save_modernized_file(relative_path, result["current_code"])
        print("Modernized successfully")
    else:
        print("Failed after retries")
        print("Final Error:", result["error_logs"])


def main():
    root_path = INPUT_DIR

    for file_path in scan_directory(root_path):
        process_file(file_path, root_path)


if __name__ == "__main__":
    main()
