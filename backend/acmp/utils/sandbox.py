# acmp/utils/sandbox.py

import subprocess
import tempfile
import os
from typing import Tuple


EXECUTION_TIMEOUT = 5  # seconds


def run_python_code(code: str) -> Tuple[bool, str | None]:
    """
    Executes Python code in a temporary file.

    Returns:
        (True, None) if execution succeeds
        (False, error_log) if execution fails
    """

    temp_file = None

    try:
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False,
            encoding="utf-8"
        )

        temp_file.write(code)
        temp_file.close()

        # Execute in isolated subprocess
        result = subprocess.run(
            ["python", temp_file.name],
            capture_output=True,
            text=True,
            timeout=EXECUTION_TIMEOUT
        )

        if result.returncode == 0:
            return True, None
        else:
            return False, result.stderr.strip()

    except subprocess.TimeoutExpired:
        return False, "Execution timed out (possible infinite loop)."

    except Exception as e:
        return False, f"Sandbox error: {str(e)}"

    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file.name):
            os.remove(temp_file.name)
