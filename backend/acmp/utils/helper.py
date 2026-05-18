import re

def extract_code_block(text: str) -> str:
    """
    Extract pure code from model output.
    Removes markdown fences and explanations.
    """
    # Remove markdown code fences
    text = re.sub(r"```.*?```", lambda m: m.group(0).strip("`"), text, flags=re.DOTALL)

    # Remove triple backticks
    text = text.replace("python","")
    text = text.replace("Python","")
    text = text.replace("py","")
    # text = text.replace("```", "")

    return text.strip()
