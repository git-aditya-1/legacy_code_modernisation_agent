# acmp/agents/engineer.py
import os
import difflib
from typing import Dict, Any
import json

from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

from ..utils.helper import extract_code_block
from langchain_groq import ChatGroq
load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    # api_key= os.getenv("GROQ_API_KEY")
)



# llm = HuggingFaceEndpoint(
#     repo_id="meta-llama/Llama-3.1-8B-Instruct",
#     task="text-generation",
#     # temperature=0,
#     # max_new_tokens=1024,
#     huggingfacehub_api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
# )
# model=ChatHuggingFace(llm=llm)


def generate_diff(original: str, modernized: str, file_path: str = "file.py") -> str:
    """
    Generates a unified diff between original and modernized code.
    Shows only the changed portions with context lines.
    """
    original_lines = original.splitlines(keepends=True)
    modernized_lines = modernized.splitlines(keepends=True)

    diff = difflib.unified_diff(
        original_lines,
        modernized_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        n=3,  # 3 lines of context
    )
    return "".join(diff)


def engineer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Refactors legacy code into modern, secure, optimized version
    using the TransformationPlan.
    Also generates a diff showing only the changed portions.
    """

    transformation_plan = state["transformation_plan"]

    # Convert structured plan to JSON string for prompt clarity
    plan_json = json.dumps(transformation_plan.model_dump(), indent=2)

    prompt = f"""
You are a senior software engineer modernizing legacy code.

Follow this transformation plan strictly:

{plan_json}

Rules:
- Preserve original logic and functionality of the complete code.
- Do NOT change behavior.
- Fix legacy syntax.
- Replace deprecated synatx and functions
- Apply modernization improvements.
- ONLY modify the parts that need modernization. Keep unchanged code exactly as-is.
- Output ONLY valid executable code.
- Do NOT add explanations.
- Do NOT wrap in markdown.
-Do not provide language labels
-Just provide the new code and no other extra things, not even a single word

Original Code:
{state["original_code"]}
"""

    response = llm.invoke(prompt)
    modernized_code = extract_code_block(response.content.strip())
    print(f"ENGINEER {state['itr']}: \n", modernized_code)

    state["current_code"] = modernized_code

    # Generate diff showing only changed portions
    file_path = state.get("file_path", "file.py")
    state["diff_output"] = generate_diff(state["original_code"], modernized_code, file_path)

    return state

