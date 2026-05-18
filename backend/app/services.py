import json
import asyncio
from typing import AsyncGenerator
from acmp.graph import graph


async def run_modernization_stream(file_name: str, code: str) -> AsyncGenerator[str, None]:
    """Streams graph updates for a single uploaded file string."""
    
    # Initial state using the code provided by the frontend
    state = {
        "file_path": file_name,
        "original_code": code,
        "transformation_plan": None,
        "current_code": None,
        "diff_output": None,
        "error_logs": None,
        "itr": 0,
    }

    try:
        # Stream node updates using LangGraph
        async for chunk in graph.astream(state, stream_mode="updates"):
            for node_name, node_data in chunk.items():
                payload = {
                    "node": node_name,
                    "file_path": file_name,
                    "current_code": node_data.get("current_code"),
                    "diff_output": node_data.get("diff_output"),
                    "error_logs": node_data.get("error_logs"),
                    "original_code": code if node_name == "auditor" else None
                }
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(0.1)
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


async def run_repo_modernization_stream(files: list) -> AsyncGenerator[str, None]:
    """
    Streams modernization results for all files in a cloned repo.
    Each file is processed through the full pipeline, and SSE events
    are emitted per-file with status, diff, and modernized code.
    """
    total = len(files)

    for idx, file_info in enumerate(files):
        file_path = file_info["relative_path"]
        code = file_info["content"]

        # Emit start event for this file
        yield f"data: {json.dumps({'event': 'file_start', 'file_path': file_path, 'file_index': idx, 'total_files': total})}\n\n"
        await asyncio.sleep(0.05)

        state = {
            "file_path": file_path,
            "original_code": code,
            "transformation_plan": None,
            "current_code": None,
            "diff_output": None,
            "error_logs": None,
            "itr": 0,
        }

        try:
            async for chunk in graph.astream(state, stream_mode="updates"):
                for node_name, node_data in chunk.items():
                    payload = {
                        "event": "node_update",
                        "node": node_name,
                        "file_path": file_path,
                        "file_index": idx,
                        "total_files": total,
                        "current_code": node_data.get("current_code"),
                        "diff_output": node_data.get("diff_output"),
                        "error_logs": node_data.get("error_logs"),
                        "original_code": code if node_name == "auditor" else None,
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    await asyncio.sleep(0.1)

            # Emit file complete event
            yield f"data: {json.dumps({'event': 'file_done', 'file_path': file_path, 'file_index': idx, 'total_files': total})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'event': 'file_error', 'file_path': file_path, 'file_index': idx, 'error': str(e)})}\n\n"

        await asyncio.sleep(0.05)

    # Emit stream complete
    yield f"data: {json.dumps({'event': 'stream_done', 'total_files': total})}\n\n"