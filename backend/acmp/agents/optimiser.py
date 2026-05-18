# acmp/agents/optimizer.py
import os
from typing import Dict, Any
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


def optimizer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fixes failing code using error logs.
    Increments retry counter.
    """

    if not state.get("error_logs"):
        return state

    prompt = f"""
You are a debugging expert.

The following code failed with this error:

ERROR:
{state["error_logs"]}

- Fix the issue causing the error.
- Preserve original logic and functionality.
- Do NOT change behavior.
- Fix legacy syntax.
- Replace deprecated synatx and functions
- Apply modernization improvements.
- Output ONLY valid executable code.
- Do NOT add explanations.
- Do NOT wrap in markdown.
-Do not provide language labels

Failing Code:
{state["current_code"]}
"""

    response = llm.invoke(prompt)
    print(f"OPTIMIZER {state['itr']}\n", response.content.strip())
    state["current_code"] = extract_code_block(response.content.strip())
    state["itr"] += 1

    return state
