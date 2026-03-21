"""Base class for BIM analysis tools."""

import asyncio
import hashlib
import os
import tempfile
from typing import Optional

from core.sandbox.tool_base import SandboxToolsBase
from core.utils.logger import logger

try:
    import ifcopenshell

    HAS_IFC = True
except ImportError:
    HAS_IFC = False


class BIMToolBase(SandboxToolsBase):
    """Base class providing common BIM functionality."""

    # Process-level model cache keyed by SHA-256 of file content.
    # Avoids re-parsing the same IFC file across multiple tool calls in one agent run.
    _model_cache: dict = {}

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

    async def open_ifc_model(self, content: bytes):
        """Parse IFC bytes into a model, using the in-process cache.

        Blocking ifcopenshell.open() is run in a thread pool so it doesn't
        stall the asyncio event loop during multi-second parses.
        """
        cache_key = hashlib.sha256(content).hexdigest()
        if cache_key in BIMToolBase._model_cache:
            logger.debug(f"IFC model cache hit for key {cache_key[:8]}")
            return BIMToolBase._model_cache[cache_key]

        def _parse():
            with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            try:
                return ifcopenshell.open(tmp_path)
            finally:
                os.unlink(tmp_path)

        model = await asyncio.to_thread(_parse)
        BIMToolBase._model_cache[cache_key] = model
        logger.debug(f"IFC model parsed and cached (key {cache_key[:8]})")
        return model

    def get_element_properties(self, element) -> dict:
        """Extract all properties from an IFC element."""
        props = {
            "express_id": element.id(),
            "global_id": element.GlobalId,
            "type": element.is_a(),
            "name": getattr(element, "Name", None),
        }
        if hasattr(element, "IsDefinedBy"):
            for definition in element.IsDefinedBy:
                if definition.is_a("IfcRelDefinesByProperties"):
                    prop_set = definition.RelatingPropertyDefinition
                    if prop_set.is_a("IfcPropertySet"):
                        for prop in prop_set.HasProperties:
                            if prop.is_a("IfcPropertySingleValue") and prop.NominalValue:
                                props[prop.Name] = prop.NominalValue.wrappedValue
        return props

    def _get_element_volume(self, element) -> Optional[float]:
        """Extract volume from element quantities."""
        if hasattr(element, "IsDefinedBy"):
            for rel in element.IsDefinedBy:
                if rel.is_a("IfcRelDefinesByProperties"):
                    prop_def = rel.RelatingPropertyDefinition
                    if prop_def.is_a("IfcElementQuantity"):
                        for quantity in prop_def.Quantities:
                            if quantity.is_a("IfcQuantityVolume"):
                                return quantity.VolumeValue
        return None

    def get_element_material(self, element) -> Optional[str]:
        """Return the primary material name assigned to an IFC element, or None."""
        if not hasattr(element, "HasAssociations"):
            return None
        for assoc in element.HasAssociations:
            if assoc.is_a("IfcRelAssociatesMaterial"):
                mat = assoc.RelatingMaterial
                if mat.is_a("IfcMaterial"):
                    return mat.Name
                if mat.is_a("IfcMaterialLayerSetUsage"):
                    mat = mat.ForLayerSet
                if mat.is_a("IfcMaterialLayerSet") and mat.MaterialLayers:
                    thickest = max(mat.MaterialLayers, key=lambda l: l.LayerThickness or 0)
                    if thickest.Material:
                        return thickest.Material.Name
                if mat.is_a("IfcMaterialConstituentSet") and mat.MaterialConstituents:
                    first = mat.MaterialConstituents[0]
                    if first.Material:
                        return first.Material.Name
                if mat.is_a("IfcMaterialProfileSetUsage"):
                    mat = mat.ForProfileSet
                if mat.is_a("IfcMaterialProfileSet") and mat.MaterialProfiles:
                    profile = mat.MaterialProfiles[0]
                    if profile.Material:
                        return profile.Material.Name
        return None
