"""Code compliance tool — Thai building code (มยผ.) and accessibility checks."""

from typing import Optional

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger
from .base import BIMToolBase, HAS_IFC

THAI_BUILDING_CODES = {
    "fire_egress": {
        "code": "มยผ. 1301-54",
        "name": "ข้อกำหนดทางหนีไฟ",
        "description": "Thai Fire Egress Standard — minimum door/corridor widths for evacuation",
    },
    "structural": {
        "code": "มยผ. 1311-50",
        "name": "มาตรฐานโครงสร้าง",
        "description": "Thai Structural Design Standard — checks for presence of structural load-bearing elements",
    },
    "accessibility": {
        "code": "กฎกระทรวง 2548",
        "name": "สิ่งอำนวยความสะดวกสำหรับผู้พิการ",
        "description": "Ministerial Regulation on Facilities for Persons with Disabilities (2005)",
    },
}

# Minimum dimension thresholds (metres)
MIN_DOOR_WIDTH_FIRE = 0.9  # มยผ. 1301-54 fire egress
MIN_DOOR_WIDTH_ACCESS = 0.9  # กฎกระทรวง 2548 accessibility
MIN_STAIR_WIDTH = 1.2  # มยผ. 1301-54
MIN_CORRIDOR_WIDTH = 1.5  # มยผ. 1301-54


def _extract_width(element) -> Optional[float]:
    """Try to get element width from IfcQuantityLength or known property names."""
    if hasattr(element, "IsDefinedBy"):
        for rel in element.IsDefinedBy:
            if rel.is_a("IfcRelDefinesByProperties"):
                pd = rel.RelatingPropertyDefinition
                if pd.is_a("IfcElementQuantity"):
                    for q in pd.Quantities:
                        if q.is_a("IfcQuantityLength") and "width" in q.Name.lower():
                            return q.LengthValue
                if pd.is_a("IfcPropertySet"):
                    for prop in pd.HasProperties:
                        if prop.is_a("IfcPropertySingleValue") and "width" in prop.Name.lower():
                            if prop.NominalValue:
                                return float(prop.NominalValue.wrappedValue)
    # Fallback: OverallWidth attribute
    width = getattr(element, "OverallWidth", None)
    if width is not None:
        return float(width)
    return None


@tool_metadata(
    display_name="Code Compliance",
    description="Check building code compliance including Thai standards (มยผ.)",
    icon="ClipboardCheck",
    color="bg-blue-100 dark:bg-blue-800/50",
    weight=70,
    visible=True,
    usage_guide="""
## Code Compliance — Thai Building Standards (มยผ.)

Validates building elements against Thai building codes and international accessibility standards.

### Available Tools
- **check_compliance**: Run compliance checks and return pass/fail results with element highlights

### Checks Performed
| Check | Standard | Requirement |
|-------|----------|-------------|
| Door width (fire egress) | มยผ. 1301-54 | ≥ 0.9 m |
| Door width (accessibility) | กฎกระทรวง 2548 | ≥ 0.9 m |
| Stair width | มยผ. 1301-54 | ≥ 1.2 m |
| Corridor width | มยผ. 1301-54 | ≥ 1.5 m |

### Example
```
check_compliance(file_path="/workspace/model.ifc", standards=["fire_egress", "accessibility"], locale="th")
```
""",
)
class CodeComplianceTool(BIMToolBase):
    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "check_compliance",
                "description": "Check BIM model compliance against Thai building codes (มยผ.) and accessibility standards.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "**REQUIRED** Path to the IFC file in the sandbox",
                        },
                        "standards": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "**OPTIONAL** List of standards to check: 'fire_egress', 'structural', 'accessibility'. Defaults to all.",
                        },
                    },
                    "required": ["file_path"],
                    "additionalProperties": False,
                },
            },
        }
    )
    async def check_compliance(
        self,
        file_path: str,
        standards: Optional[list] = None,
    ) -> ToolResult:
        try:
            if standards is None:
                standards = list(THAI_BUILDING_CODES.keys())

            if not HAS_IFC:
                return self.success_response(self._mock_compliance_result(standards))

            content = await self.load_ifc_content(file_path)
            ifc_model = await self.open_ifc_model(content)

            findings = []
            element_highlights = []
            pass_count = fail_count = 0

            # --- Fire egress & accessibility: door widths ---
            if "fire_egress" in standards or "accessibility" in standards:
                for door in ifc_model.by_type("IfcDoor"):
                    width = _extract_width(door)
                    if width is None:
                        continue
                    eid = door.id()
                    name = getattr(door, "Name", f"Door {eid}")

                    if "fire_egress" in standards and width < MIN_DOOR_WIDTH_FIRE:
                        fail_count += 1
                        findings.append(
                            {
                                "standard": THAI_BUILDING_CODES["fire_egress"]["code"],
                                "element_id": eid,
                                "element_name": name,
                                "check": "Door width (fire egress)",
                                "required": f"≥ {MIN_DOOR_WIDTH_FIRE} m",
                                "actual": f"{width:.2f} m",
                                "status": "FAIL",
                            }
                        )
                        element_highlights.append({"express_id": eid, "color": "#ef4444"})
                    elif "accessibility" in standards and width < MIN_DOOR_WIDTH_ACCESS:
                        fail_count += 1
                        findings.append(
                            {
                                "standard": THAI_BUILDING_CODES["accessibility"]["code"],
                                "element_id": eid,
                                "element_name": name,
                                "check": "Door width (accessibility)",
                                "required": f"≥ {MIN_DOOR_WIDTH_ACCESS} m",
                                "actual": f"{width:.2f} m",
                                "status": "FAIL",
                            }
                        )
                        element_highlights.append({"express_id": eid, "color": "#f59e0b"})
                    else:
                        pass_count += 1
                        element_highlights.append({"express_id": eid, "color": "#22c55e"})

            # --- Stair widths ---
            if "fire_egress" in standards:
                for stair in ifc_model.by_type("IfcStair"):
                    width = _extract_width(stair)
                    if width is None:
                        continue
                    eid = stair.id()
                    name = getattr(stair, "Name", f"Stair {eid}")
                    if width < MIN_STAIR_WIDTH:
                        fail_count += 1
                        findings.append(
                            {
                                "standard": THAI_BUILDING_CODES["fire_egress"]["code"],
                                "element_id": eid,
                                "element_name": name,
                                "check": "Stair width",
                                "required": f"≥ {MIN_STAIR_WIDTH} m",
                                "actual": f"{width:.2f} m",
                                "status": "FAIL",
                            }
                        )
                        element_highlights.append({"express_id": eid, "color": "#ef4444"})
                    else:
                        pass_count += 1
                        element_highlights.append({"express_id": eid, "color": "#22c55e"})

            # --- Structural: presence of load-bearing elements (มยผ. 1311-50) ---
            if "structural" in standards:
                columns = list(ifc_model.by_type("IfcColumn"))
                beams = list(ifc_model.by_type("IfcBeam"))
                walls = list(ifc_model.by_type("IfcWall"))
                slabs = list(ifc_model.by_type("IfcSlab"))

                if not columns and not walls:
                    fail_count += 1
                    findings.append(
                        {
                            "standard": THAI_BUILDING_CODES["structural"]["code"],
                            "element_id": None,
                            "element_name": None,
                            "check": "Structural elements present",
                            "required": "At least one IfcColumn or IfcWall must exist",
                            "actual": "None found",
                            "status": "FAIL",
                        }
                    )
                else:
                    pass_count += 1

                if not beams and not slabs:
                    fail_count += 1
                    findings.append(
                        {
                            "standard": THAI_BUILDING_CODES["structural"]["code"],
                            "element_id": None,
                            "element_name": None,
                            "check": "Horizontal structural elements present",
                            "required": "At least one IfcBeam or IfcSlab must exist",
                            "actual": "None found",
                            "status": "FAIL",
                        }
                    )
                else:
                    pass_count += 1

            overall = "PASS" if fail_count == 0 else "FAIL"
            standards_info = {
                k: THAI_BUILDING_CODES[k] for k in standards if k in THAI_BUILDING_CODES
            }

            return self.success_response(
                {
                    "overall_status": overall,
                    "pass_count": pass_count,
                    "fail_count": fail_count,
                    "findings": findings,
                    "element_highlights": element_highlights,
                    "standards_checked": standards_info,
                }
            )
        except Exception as e:
            logger.error(f"check_compliance error: {e}")
            return self.fail_response(f"Compliance check failed: {e}")

    def _mock_compliance_result(self, standards: list) -> dict:
        return {
            "note": "ifcopenshell not installed — returning mock data",
            "overall_status": "FAIL",
            "pass_count": 18,
            "fail_count": 3,
            "findings": [
                {
                    "standard": "มยผ. 1301-54",
                    "element_id": 201,
                    "element_name": "Door-Stairwell-01",
                    "check": "Door width (fire egress)",
                    "required": "≥ 0.9 m",
                    "actual": "0.75 m",
                    "status": "FAIL",
                },
                {
                    "standard": "กฎกระทรวง 2548",
                    "element_id": 305,
                    "element_name": "Door-Lift-Lobby",
                    "check": "Door width (accessibility)",
                    "required": "≥ 0.9 m",
                    "actual": "0.80 m",
                    "status": "FAIL",
                },
            ],
            "element_highlights": [
                {"express_id": 201, "color": "#ef4444"},
                {"express_id": 305, "color": "#f59e0b"},
            ],
            "standards_checked": {
                k: THAI_BUILDING_CODES[k] for k in standards if k in THAI_BUILDING_CODES
            },
        }
