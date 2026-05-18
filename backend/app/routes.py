from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models import ModernizeRequest, RepoRequest, ApproveFileRequest
from services import run_modernization_stream, run_repo_modernization_stream
from github_service import clone_repo, scan_repo_files, apply_changes, cleanup_repo

router = APIRouter()


# ─── Existing: Single File Mode ───────────────────────────────────────────────

@router.post("/modernize")
async def modernize_code(request: ModernizeRequest):
    # We pass file_name and code directly to the service
    return StreamingResponse(
        run_modernization_stream(request.file_name, request.code),
        media_type="text/event-stream"
    )


# ─── New: GitHub Repo Mode ────────────────────────────────────────────────────

@router.post("/repo/clone")
async def clone_github_repo(request: RepoRequest):
    """Clone a public GitHub repo and return the list of Python files."""
    try:
        result = clone_repo(request.repo_url)
        # Don't send full file content in the clone response (too large)
        files_summary = [
            {
                "relative_path": f["relative_path"],
                "size": f["size"],
            }
            for f in result["files"]
        ]
        return {
            "status": "success",
            "repo_name": result["repo_name"],
            "file_count": result["file_count"],
            "files": files_summary,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/repo/{repo_name}/files")
async def get_repo_files(repo_name: str):
    """Get the list of Python files in a cloned repo."""
    try:
        files = scan_repo_files(repo_name)
        files_summary = [
            {
                "relative_path": f["relative_path"],
                "size": f["size"],
            }
            for f in files
        ]
        return {"status": "success", "files": files_summary}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/repo/{repo_name}/modernize")
async def modernize_repo(repo_name: str):
    """
    Run the modernization pipeline on all Python files in the repo.
    Streams SSE events per-file with diffs and status updates.
    """
    try:
        files = scan_repo_files(repo_name)
        return StreamingResponse(
            run_repo_modernization_stream(files),
            media_type="text/event-stream"
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/repo/approve")
async def approve_file(request: ApproveFileRequest):
    """
    Human-in-the-loop: Apply or reject modernized code for a specific file.
    """
    try:
        if request.approved and request.modernized_code:
            apply_changes(request.repo_name, request.file_path, request.modernized_code)
            return {
                "status": "success",
                "message": f"Changes applied to {request.file_path}",
                "action": "approved",
            }
        else:
            return {
                "status": "success",
                "message": f"Changes rejected for {request.file_path}",
                "action": "rejected",
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.delete("/repo/{repo_name}")
async def delete_repo(repo_name: str):
    """Clean up a cloned repo."""
    try:
        cleanup_repo(repo_name)
        return {"status": "success", "message": f"Repo {repo_name} deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}