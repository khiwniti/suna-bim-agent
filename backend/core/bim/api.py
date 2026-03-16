"""BIM-specific API endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from starlette.background import BackgroundTask
import tempfile
import os
import uuid


def _get_max_file_size_mb() -> int:
    try:
        return int(os.environ.get("BIM_MAX_FILE_SIZE_MB", "500"))
    except ValueError:
        return 500  # safe default


router = APIRouter(prefix="/bim", tags=["bim"])


@router.post("/upload")
async def upload_ifc_file(
    file: UploadFile = File(...),
):
    """Upload IFC file for BIM analysis."""
    if not file.filename or not file.filename.lower().endswith('.ifc'):
        raise HTTPException(status_code=400, detail="Only IFC files are supported")

    MAX_MB = _get_max_file_size_mb()
    max_bytes = MAX_MB * 1024 * 1024

    # Read one extra byte so we can detect oversize without loading full file into memory
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_MB}MB limit")

    # Save to temp file (real impl would upload to sandbox storage)
    with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    file_id = str(uuid.uuid4())
    return JSONResponse(
        content={
            "status": "success",
            "file_id": file_id,
            "filename": file.filename,
            "size_bytes": len(content),
        },
        background=BackgroundTask(os.unlink, tmp_path),
    )


@router.get("/health")
async def bim_health():
    """BIM service health check."""
    try:
        from core.tools.bim import IFCParserTool, CarbonCalculationTool  # noqa: F401
        return {"status": "ok", "bim_tools": "available"}
    except ImportError as e:
        return {"status": "degraded", "reason": str(e)}
