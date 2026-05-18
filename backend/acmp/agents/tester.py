# acmp/agents/tester.py

from typing import Dict, Any
from ..utils.sandbox import run_python_code
from ..utils.helper import extract_code_block


def tester_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the current_code inside sandbox.
    Updates error_log depending on result.
    """

    code = extract_code_block(state.get("current_code"))

    if not code:
        state["error_logs"] = "No code to test."
        return state

    success, error = run_python_code(code)
    print(f"TEST {state['itr']}\n", error)
    if success:
        state["error_logs"] = None
    else:
        state["error_logs"] = error

    return state
