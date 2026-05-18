# acmp/agents/auditor.py

import json
import re
from typing import Dict, Any
import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from ..state import TransformationPlan
from langchain_groq import ChatGroq
load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    # api_key= os.getenv("GROQ_API_KEY")
)

LANGUAGE="python"

# llm = HuggingFaceEndpoint(
#     repo_id="meta-llama/Llama-3.1-8B-Instruct",
#     task="text-generation",
#     # temperature=0,
#     # max_new_tokens=1024,
#     huggingfacehub_api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
# )
# model=ChatHuggingFace(llm=llm)

def extract_json(text: str) -> dict:
    """
    Extracts first JSON object from model output safely.
    """
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {}
    except Exception:
        return {}


def auditor_node(state: Dict[str, Any]) -> Dict[str, Any]:

    prompt = f"""
Return ONLY valid JSON with this structure:

{{
  "language": {LANGUAGE},
  "legacy_patterns": [
    {{"pattern": "...", "recommended_fix": "..."}}
  ],
  
  "modernization_steps": [
    "..."
  ]
}}

Focus on modernising the syntax
Do not change or optimize the logic and behaviour
Only aim is to convert the outdated syntax to modern equivalent
Do NOT add explanation text.
Do NOT wrap in markdown.

Code:
{state["original_code"]}
"""
    # print(model.invoke("Hi there i need your help"))

    response = llm.invoke(prompt)

    raw_output = response.content.strip()

    extracted = extract_json(raw_output)

    try:
        structured_output = TransformationPlan(**extracted)
    except Exception:
        structured_output = TransformationPlan(
            language="unknown",
            legacy_patterns=[],
            # security_issues=[],
            modernization_steps=["Manual review required (validation failed)."],
        )
    print(f"AUDITOR {state['itr']}\n",structured_output)
    state["transformation_plan"] = structured_output
    return state
