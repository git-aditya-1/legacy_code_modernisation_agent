from typing import Any, TypedDict, Optional, List
from pydantic import BaseModel

class LegacyPattern(BaseModel):
    pattern: str
    recommended_fix: str


# class SecurityIssue(BaseModel):
#     issue: str
#     severity: str  # low | medium | high


class TransformationPlan(BaseModel):
    language: str
    legacy_patterns: List[LegacyPattern]
    # security_issues: List[SecurityIssue]
    modernization_steps: List[str]

class AgentState(TypedDict):
    """
    Shared state that flows through the LangGraph pipeline.
    All agent reads from and writes to this state.
    """
    #file data:
    file_path : str
    original_code : str

    #auditor_output:
    transformation_plan : Optional[TransformationPlan]

    #Drafted new code:
    current_code : Optional[str]

    #Targeted diff (only changed portions):
    diff_output : Optional[str]

    #error logs :
    error_logs : Optional[str]

    #iterations:
    itr : int

    #final flag:
    # is_valid : bool