"""IFC parser tool — element extraction and querying."""

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.utils.logger import logger
from .base import BIMToolBase, HAS_IFC


@tool_metadata(
    display_name="IFC Parser",
    description="Parse and query IFC/BIM model elements",
    icon="Box",
    color="bg-purple-100 dark:bg-purple-800/50",
    weight=55,
    visible=True,
    usage_guide="""
## IFC Parser — Parse and Query BIM Models

Parse IFC files and extract structured information about building elements.

### Available Tools
- **parse_ifc**: Get a high-level summary (element counts, storeys, project info)
- **query_elements**: List elements of a specific IFC type with properties

### When to Use
- Understanding what's in a BIM model
- Extracting specific element lists for further analysis
- Getting project metadata and storey breakdown

### Example
```
parse_ifc(file_path="/workspace/model.ifc")
query_elements(file_path="/workspace/model.ifc", ifc_type="IfcDoor", limit=20)
```
""",
)
class IFCParserTool(BIMToolBase):
    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "parse_ifc",
                "description": "Parse an IFC file and return a summary of element counts by type, storey list, and project information.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "**REQUIRED** Path to the IFC file in the sandbox (e.g. /workspace/model.ifc)",
                        }
                    },
                    "required": ["file_path"],
                    "additionalProperties": False,
                },
            },
        }
    )
    async def parse_ifc(self, file_path: str) -> ToolResult:
        try:
            if not HAS_IFC:
                return self.success_response(
                    {
                        "note": "ifcopenshell not installed — returning mock data",
                        "project": {"name": "Mock Project", "description": ""},
                        "element_counts": {
                            "IfcWall": 42,
                            "IfcSlab": 18,
                            "IfcDoor": 24,
                            "IfcWindow": 16,
                        },
                        "storeys": ["Ground Floor", "Level 1", "Level 2"],
                        "total_elements": 100,
                    }
                )

            content = await self.load_ifc_content(file_path)
            ifc_model = await self.open_ifc_model(content)

            # Project info
            projects = ifc_model.by_type("IfcProject")
            project_info = {}
            if projects:
                p = projects[0]
                project_info = {
                    "name": getattr(p, "Name", None),
                    "description": getattr(p, "Description", None),
                    "phase": getattr(p, "Phase", None),
                }

            # Element counts by type
            element_types = [
                "IfcWall",
                "IfcSlab",
                "IfcBeam",
                "IfcColumn",
                "IfcDoor",
                "IfcWindow",
                "IfcRoof",
                "IfcStair",
                "IfcRailing",
                "IfcPipeSegment",
                "IfcDuctSegment",
                "IfcSpace",
            ]
            counts = {}
            for et in element_types:
                items = ifc_model.by_type(et)
                if items:
                    counts[et] = len(items)

            # Storeys
            storeys = [
                getattr(s, "Name", f"Storey {s.id()}")
                for s in ifc_model.by_type("IfcBuildingStorey")
            ]

            return self.success_response(
                {
                    "project": project_info,
                    "element_counts": counts,
                    "storeys": storeys,
                    "total_elements": sum(counts.values()),
                }
            )
        except Exception as e:
            logger.error(f"parse_ifc error: {e}")
            return self.fail_response(f"Failed to parse IFC file: {e}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "query_elements",
                "description": "Return a list of IFC elements of a given type with their properties.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "**REQUIRED** Path to the IFC file in the sandbox",
                        },
                        "ifc_type": {
                            "type": "string",
                            "description": "**REQUIRED** IFC entity type (e.g. 'IfcWall', 'IfcDoor', 'IfcBeam')",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "**OPTIONAL** Maximum number of elements to return (default 50)",
                            "default": 50,
                        },
                    },
                    "required": ["file_path", "ifc_type"],
                    "additionalProperties": False,
                },
            },
        }
    )
    async def query_elements(self, file_path: str, ifc_type: str, limit: int = 50) -> ToolResult:
        try:
            if not HAS_IFC:
                return self.success_response(
                    {
                        "note": "ifcopenshell not installed — returning mock data",
                        "ifc_type": ifc_type,
                        "count": 3,
                        "elements": [
                            {
                                "express_id": 1,
                                "global_id": "MOCK001",
                                "type": ifc_type,
                                "name": f"Mock {ifc_type} 1",
                            },
                            {
                                "express_id": 2,
                                "global_id": "MOCK002",
                                "type": ifc_type,
                                "name": f"Mock {ifc_type} 2",
                            },
                            {
                                "express_id": 3,
                                "global_id": "MOCK003",
                                "type": ifc_type,
                                "name": f"Mock {ifc_type} 3",
                            },
                        ],
                    }
                )

            content = await self.load_ifc_content(file_path)
            ifc_model = await self.open_ifc_model(content)

            elements = ifc_model.by_type(ifc_type)
            result = []
            for el in elements[:limit]:
                result.append(self.get_element_properties(el))

            return self.success_response(
                {
                    "ifc_type": ifc_type,
                    "count": len(elements),
                    "returned": len(result),
                    "elements": result,
                }
            )
        except Exception as e:
            logger.error(f"query_elements error: {e}")
            return self.fail_response(f"Failed to query elements: {e}")
