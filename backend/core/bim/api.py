"""BIM-specific API endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import re
import uuid


UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
_UPLOADS_DIR = "/tmp/bim-uploads"
os.makedirs(_UPLOADS_DIR, exist_ok=True)


def _get_max_file_size_mb() -> int:
    try:
        return int(os.environ.get("BIM_MAX_FILE_SIZE_MB", "500"))
    except ValueError:
        return 500  # safe default


def _validate_file_id(file_id: str) -> None:
    if not UUID_RE.match(file_id):
        raise HTTPException(status_code=400, detail="Invalid file_id format")


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

    # Generate file_id and save to persistent directory
    file_id = str(uuid.uuid4())
    file_path = os.path.join(_UPLOADS_DIR, f"{file_id}.ifc")

    try:
        with open(file_path, 'wb') as f:
            f.write(content)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    return JSONResponse(
        content={
            "status": "success",
            "file_id": file_id,
            "file_path": file_path,
            "filename": file.filename,
            "size_bytes": len(content),
        }
    )


@router.get("/uploads/{file_id}")
async def get_upload_info(file_id: str):
    """Get information about an uploaded file."""
    _validate_file_id(file_id)
    file_path = os.path.join(_UPLOADS_DIR, f"{file_id}.ifc")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return JSONResponse(
        content={
            "file_id": file_id,
            "file_path": file_path,
            "exists": True,
        }
    )


@router.delete("/uploads/{file_id}")
async def delete_upload(file_id: str):
    """Delete a previously uploaded IFC file."""
    _validate_file_id(file_id)
    file_path = os.path.join(_UPLOADS_DIR, f"{file_id}.ifc")
    try:
        os.unlink(file_path)
        return {"deleted": True, "file_id": file_id}
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"deleted": False, "file_id": file_id})


@router.get("/health")
async def bim_health():
    """BIM service health check."""
    try:
        from core.tools.bim import IFCParserTool, CarbonCalculationTool  # noqa: F401
        return {"status": "ok", "bim_tools": "available"}
    except ImportError as e:
        return {"status": "degraded", "reason": str(e)}
