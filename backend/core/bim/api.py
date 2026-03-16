"""BIM-specific API endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import os

router = APIRouter(prefix="/bim", tags=["bim"])


@router.post("/upload")
async def upload_ifc_file(
    file: UploadFile = File(...),
):
    """Upload IFC file for BIM analysis."""
    if not file.filename or not file.filename.lower().endswith('.ifc'):
        raise HTTPException(status_code=400, detail="Only IFC files are supported")

    content = await file.read()
    max_bytes = int(os.environ.get("BIM_MAX_FILE_SIZE_MB", "500")) * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {os.environ.get('BIM_MAX_FILE_SIZE_MB', '500')}MB limit",
        )

    # Save to temp file (real impl would upload to sandbox storage)
    with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    return {
        "status": "success",
        "file_path": tmp_path,
        "filename": file.filename,
        "size_bytes": len(content),
    }


@router.get("/health")
async def bim_health():
    """BIM service health check."""
    try:
        from core.tools.bim import IFCParserTool, CarbonCalculationTool  # noqa: F401
        return {"status": "ok", "bim_tools": "available"}
    except ImportError as e:
        return {"status": "degraded", "reason": str(e)}
