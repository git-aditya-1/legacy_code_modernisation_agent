from pydantic import BaseModel
from typing import Optional

class ModernizeRequest(BaseModel):
    file_name: str
    code: str  # The raw source code from the frontend

class SaveRequest(BaseModel):
    file_path: str
    code: str

class RepoRequest(BaseModel):
    repo_url: str  # GitHub repo URL to clone

class ApproveFileRequest(BaseModel):
    repo_name: str
    file_path: str  # Relative path within the repo
    approved: bool  # True = apply changes, False = reject
    modernized_code: Optional[str] = None  # The code to write if approved