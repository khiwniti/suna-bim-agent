"""BIM-specific API endpoints."""

import base64
import json
import os
import re
import time
import uuid

import litellm
from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List


UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)
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
    if not file.filename or not file.filename.lower().endswith(".ifc"):
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
        with open(file_path, "wb") as f:
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


@router.post("/boq/analyze")
async def analyze_boq(pageImages: List[str] = Form(...)):
    """Analyze a Bill of Quantities document from page images using AI vision."""
    if not pageImages:
        raise HTTPException(status_code=400, detail="No page images provided")
    if len(pageImages) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 pages allowed")

    model = os.environ.get("BOQ_ANALYSIS_MODEL", "anthropic/claude-3-5-sonnet-20241022")

    content = [
        {
            "type": "text",
            "text": (
                "You are a BOQ (Bill of Quantities) extraction specialist for construction projects. "
                "Analyze the provided document pages and extract all BOQ line items. "
                "Return a JSON object with this exact structure:\n"
                "{\n"
                '  "summary": {\n'
                '    "totalItems": <number>,\n'
                '    "matchedItems": <number>,\n'
                '    "totalCarbon": <kgCO2e float>,\n'
                '    "categories": [{"category": str, "count": int, "carbon": float, "percentage": float}],\n'
                '    "totalCost": <float or null>,\n'
                '    "currency": <str or null>\n'
                "  },\n"
                '  "items": [\n'
                "    {\n"
                '      "id": <uuid string>,\n'
                '      "itemNumber": <str>,\n'
                '      "description": <str>,\n'
                '      "quantity": <float>,\n'
                '      "unit": <str>,\n'
                '      "category": <str>,\n'
                '      "unitRate": <float or null>,\n'
                '      "amount": <float or null>,\n'
                '      "carbonFootprint": {"total": <float>, "embodied": <float or null>},\n'
                '      "confidence": <0.0-1.0>,\n'
                '      "matched": <bool>\n'
                "    }\n"
                "  ],\n"
                '  "metadata": {\n'
                '    "pageCount": <int>,\n'
                '    "analyzedAt": <ISO timestamp>,\n'
                '    "modelUsed": <str>,\n'
                '    "language": <str>\n'
                "  },\n"
                '  "warnings": [<str>]\n'
                "}\n"
                "Use standard Thai/international construction material carbon factors where possible. "
                "For unknown materials, estimate based on material category. Return ONLY valid JSON."
            ),
        }
    ]

    for i, img_data in enumerate(pageImages[:20]):
        if img_data.startswith("data:"):
            media_type, b64 = img_data.split(",", 1)
            mime = media_type.split(";")[0].replace("data:", "")
        else:
            mime = "image/jpeg"
            b64 = img_data
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            }
        )

    start = time.monotonic()
    try:
        response = await litellm.acompletion(
            model=model,
            messages=[{"role": "user", "content": content}],
            max_tokens=4096,
            temperature=0.1,
        )
        raw = response.choices[0].message.content or "{}"
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)[:200]}")

    duration_ms = int((time.monotonic() - start) * 1000)
    if "metadata" not in result:
        result["metadata"] = {}
    result["metadata"].update(
        {
            "pageCount": len(pageImages),
            "analyzedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "processingTime": duration_ms,
            "modelUsed": model,
        }
    )

    return result
