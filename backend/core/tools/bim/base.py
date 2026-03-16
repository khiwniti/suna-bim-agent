"""Base class for BIM analysis tools."""
from typing import Optional

from core.sandbox.tool_base import SandboxToolsBase
from core.utils.logger import logger


class BIMToolBase(SandboxToolsBase):
    """Base class providing common BIM functionality."""

    _model_cache: dict = {}  # Simple in-memory cache keyed by file_path

    async def load_ifc_content(self, file_path: str) -> bytes:
        """Download IFC file content from sandbox filesystem."""
        sandbox = await self._ensure_sandbox()
        clean = self.clean_path(file_path)
        try:
            content = await sandbox.files.read(clean, format="bytes")
            return content
        except AttributeError:
            # Fallback for Daytona-style API
            content = await sandbox.fs.download_file(clean)
            return content

    def get_element_properties(self, element) -> dict:
        """Extract all properties from an IFC element."""
        props = {
            'express_id': element.id(),
            'global_id': element.GlobalId,
            'type': element.is_a(),
            'name': getattr(element, 'Name', None),
        }
        if hasattr(element, 'IsDefinedBy'):
            for definition in element.IsDefinedBy:
                if definition.is_a('IfcRelDefinesByProperties'):
                    prop_set = definition.RelatingPropertyDefinition
                    if prop_set.is_a('IfcPropertySet'):
                        for prop in prop_set.HasProperties:
                            if prop.is_a('IfcPropertySingleValue') and prop.NominalValue:
                                props[prop.Name] = prop.NominalValue.wrappedValue
        return props

    def _get_element_volume(self, element) -> Optional[float]:
        """Extract volume from element quantities."""
        if hasattr(element, 'IsDefinedBy'):
            for rel in element.IsDefinedBy:
                if rel.is_a('IfcRelDefinesByProperties'):
                    prop_def = rel.RelatingPropertyDefinition
                    if prop_def.is_a('IfcElementQuantity'):
                        for quantity in prop_def.Quantities:
                            if quantity.is_a('IfcQuantityVolume'):
                                return quantity.VolumeValue
        return None
