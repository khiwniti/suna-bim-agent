"""BIM-specific API endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid


def _get_max_file_size_mb() -> int:
    try:
        return int(os.environ.get("BIM_MAX_FILE_SIZE_MB", "500"))
    except ValueError:
        return 500  # safe default


def _get_uploads_dir() -> str:
    """Get BIM uploads directory, creating it if necessary."""
    uploads_dir = "/tmp/bim-uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    return uploads_dir


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
    uploads_dir = _get_uploads_dir()
    file_path = os.path.join(uploads_dir, f"{file_id}.ifc")

    with open(file_path, 'wb') as f:
        f.write(content)

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
    uploads_dir = _get_uploads_dir()
    file_path = os.path.join(uploads_dir, f"{file_id}.ifc")

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
    """Delete an uploaded file."""
    uploads_dir = _get_uploads_dir()
    file_path = os.path.join(uploads_dir, f"{file_id}.ifc")

    if os.path.exists(file_path):
        os.unlink(file_path)
        return JSONResponse(
            content={"deleted": True}
        )
    else:
        return JSONResponse(
            content={"deleted": False},
            status_code=404
        )


@router.get("/health")
async def bim_health():
    """BIM service health check."""
    try:
        from core.tools.bim import IFCParserTool, CarbonCalculationTool  # noqa: F401
        return {"status": "ok", "bim_tools": "available"}
    except ImportError as e:
        return {"status": "degraded", "reason": str(e)}
